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

export type QueryContextType = {
  newVideoLoaded: (newVideo: YouTubePlayerVideo) => void;
  recentVideosData: any[];
  isLoadingRecentVideosData: boolean;
  refetchRecentVideosData: () => Promise<QueryObserverResult<any[], Error>>;
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
      console.log("get-recent-videos");
      return JSON.parse(res.data.recent_videos);
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnMount: true,
    enabled: isLoggedIn,
  });

  const updateRecentVideos = useMutation({
    mutationFn: async (updatedRecentVideos: string) => {
      await makeRequest.post("/api/users/update-recent-videos", {
        updated_recent_videos: updatedRecentVideos,
      });
    },
    onMutate: async (newDataString) => {
      const queryKey = ["recent-videos"];
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);
      const newData = JSON.parse(newDataString);
      queryClient.setQueryData(queryKey, newData);
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

  const newVideoLoaded = (newVideo: YouTubePlayerVideo) => {
    const updated = !recentVideosData
      ? JSON.stringify([newVideo].slice(0, 10))
      : JSON.stringify(
          [
            newVideo,
            ...recentVideosData.filter((v: any) => v.id !== newVideo.id),
          ].slice(0, 10)
        );
    updateRecentVideos.mutate(updated);
  };

  return (
    <QueryContext.Provider
      value={{
        recentVideosData,
        isLoadingRecentVideosData,
        refetchRecentVideosData,
        newVideoLoaded,
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
