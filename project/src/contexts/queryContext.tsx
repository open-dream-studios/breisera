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
import { showToast } from "@/components/CustomToast";

export type QueryContextType = {
  recentVideosData: any[];
  isLoadingRecentVideosData: boolean;
  refetchRecentVideosData: () => Promise<QueryObserverResult<any[], Error>>;
  updateRecentVideo: (newVideo: YouTubePlayerVideo) => void;
  videoCollectionsData: any[];
  isLoadingVideoCollectionsData: boolean;
  refetchVideoCollectionsData: () => Promise<QueryObserverResult<any[], Error>>;
  updateVideoCollection: (
    video: YouTubePlayerVideo,
    collection_id: string | null
  ) => void;
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
      console.log(res.data.recentVideos);
      return res.data.recentVideos;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnMount: true,
    enabled: isLoggedIn,
  });

  const updateRecentVideos = useMutation({
    mutationFn: async (video: YouTubePlayerVideo) => {
      const last_timestamp =
        video.last_timestamp !== undefined
          ? Math.round(video.last_timestamp * 100) / 100
          : 0;

      await makeRequest.post("/api/users/update-recent-videos", {
        video_id: video.id,
        video_data: JSON.stringify(video),
        last_timestamp,
      });
    },
    onMutate: async (video: YouTubePlayerVideo) => {
      const queryKey = ["recent-videos"];
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<any[]>(queryKey);
      if (!previousData) return { previousData, queryKey };
      const last_timestamp =
        video.last_timestamp !== undefined
          ? Math.round(video.last_timestamp * 100) / 100
          : 0;
      const newVideoEntry = {
        video_data: video,
        last_timestamp,
      };
      const updatedData = [
        newVideoEntry,
        ...previousData.filter((v) => v.video_data.id !== video.id),
      ];
      queryClient.setQueryData(queryKey, updatedData);
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

  const {
    data: videoCollectionsData,
    isLoading: isLoadingVideoCollectionsData,
    refetch: refetchVideoCollectionsData,
  } = useQuery<any>({
    queryKey: ["video-collections"],
    queryFn: async () => {
      const res = await makeRequest.post(
        "/api/users/get-video-collections",
        {}
      );
      console.log("get-video-collections");
      console.log(res.data.collections);
      return res.data.collections;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnMount: true,
    enabled: isLoggedIn,
  });

  const updateVideoCollections = useMutation({
    mutationFn: async ({
      video,
      collection_id,
    }: {
      video: YouTubePlayerVideo;
      collection_id: string | null;
    }) => {
      await makeRequest.post("/api/users/update-video-collections", {
        video_id: video.id,
        video_data: JSON.stringify(video),
        collection_id,
      });
    },
    onMutate: async ({
      video,
      collection_id,
    }: {
      video: YouTubePlayerVideo;
      collection_id: string | null;
    }) => {
      const queryKey = ["video-collections"];
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, video);
      showToast("Video saved to library", "success");
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

  const updateVideoCollection = (
    video: YouTubePlayerVideo,
    collection_id: string | null
  ) => {
    updateVideoCollections.mutate({ video, collection_id });
  };

  return (
    <QueryContext.Provider
      value={{
        recentVideosData,
        isLoadingRecentVideosData,
        refetchRecentVideosData,
        updateRecentVideo,
        videoCollectionsData,
        isLoadingVideoCollectionsData,
        refetchVideoCollectionsData,
        updateVideoCollection,
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
