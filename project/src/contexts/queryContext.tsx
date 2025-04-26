"use client";
import React, { createContext, ReactNode, useContext, useMemo } from "react";
import {
  useQuery,
  useMutation,
  QueryClient,
  QueryObserverResult,
  useQueryClient,
} from "@tanstack/react-query";
import { YouTubePlayerVideo } from "@/contexts/videoContext";
import { makeRequest } from "@/util/axios";
import { AuthContext } from "./authContext";
import { secondsToISO8601 } from "@/util/functions/Data";

export type QueryContextType = {
  recentVideosData: any[];
  isLoadingRecentVideosData: boolean;
  refetchRecentVideosData: () => Promise<QueryObserverResult<any[], Error>>;
  updateRecentVideo: (newVideo: YouTubePlayerVideo) => void;
};

const QueryContext = createContext<QueryContextType | undefined>(undefined);

export const QueryProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const queryClient = useQueryClient();
  const { currentUser } = useContext(AuthContext);
  const isLoggedIn = useMemo(
    () => !!currentUser?.user_id,
    [currentUser?.user_id]
  );

  const {
    data: recentVideosData,
    isLoading: isLoadingRecentVideosData,
    refetch: refetchRecentVideosData,
  } = useQuery<any>({
    queryKey: ["recent-videos"],
    queryFn: async () => {
      const res = await makeRequest.post("/api/users/get-recent-videos", {});
      // console.log("get-recent-videos");
      return res.data.recentVideos
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnMount: true,
    enabled: isLoggedIn,
  });

  const updateRecentVideos = useMutation({
    mutationFn: async (video: YouTubePlayerVideo) => {
       await makeRequest.post("/api/users/update-recent-videos", {
        video_id: video.id,
        video_data: JSON.stringify(video),
        last_timestamp: video.last_timestamp ? secondsToISO8601(video.last_timestamp) : secondsToISO8601(0)
      });
    },
    onMutate: async (video: YouTubePlayerVideo) => {
      const queryKey = ["recent-videos"];
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, video);
      return { previousData, queryKey };
    },
    onError: (_err, _newData, context) => {
      if (context?.queryKey && context?.previousData) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
    },
    onSettled: (_data, _err, _variables, context) => {
      if (context?.queryKey) {
        queryClient.invalidateQueries({ queryKey: context.queryKey });
      }
    },
  });

  const updateRecentVideo = (newVideo: YouTubePlayerVideo) => {
    updateRecentVideos.mutate(newVideo);
  };

  return (
    <QueryContext.Provider
      value={{
        recentVideosData,
        isLoadingRecentVideosData,
        refetchRecentVideosData,
        updateRecentVideo,
      }}
    >
      {children}
    </QueryContext.Provider>
  );
};

export const useContextQueries = () => {
  const context = useContext(QueryContext);
  if (!context) {
    throw new Error("useQueries must be used within a QueryProvider");
  }
  return context;
};
