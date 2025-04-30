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
import { showToast } from "@/components/CustomToast";

export type VideoCollection = {
  collection_id: string;
  collection_name: string;
};

export type QueryContextType = {
  notesData: any[];
  isLoadingNotesData: boolean;
  refetchNotesData: () => Promise<QueryObserverResult<any[], Error>>;
  flashCardData: any[];
  isLoadingFlashCardData: boolean;
  refetchFlashCardData: () => Promise<QueryObserverResult<any[], Error>>;
  recentVideosData: any[];
  isLoadingRecentVideosData: boolean;
  refetchRecentVideosData: () => Promise<QueryObserverResult<any[], Error>>;
  updateRecentVideo: (newVideo: YouTubePlayerVideo) => void;
  updateRecentVideoTime: (newVideo: YouTubePlayerVideo) => void;
  videoCollectionsData: any[];
  isLoadingVideoCollectionsData: boolean;
  refetchVideoCollectionsData: () => Promise<QueryObserverResult<any[], Error>>;
  updateVideoCollections: (
    video: YouTubePlayerVideo,
    collection_id: string | null,
    collection_name: string
  ) => void;
  videoCollectionData: any[];
  isLoadingVideoCollectionData: boolean;
  refetchVideoCollectionData: () => Promise<QueryObserverResult<any[], Error>>;
  updateVideoCollection: (
    collection_id: string | null,
    collection_name: string
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
    data: notesData,
    isLoading: isLoadingNotesData,
    refetch: refetchNotesData,
  } = useQuery<any>({
    queryKey: ["notes", currentUser?.user_id],
    queryFn: async () => {
      const res = await makeRequest.post("/api/users/get-notes", {});
      return res.data.notes;
    },
    enabled: !!currentUser?.user_id,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    // refetchOnMount: true,
  });

  const {
    data: flashCardData,
    isLoading: isLoadingFlashCardData,
    refetch: refetchFlashCardData,
  } = useQuery<any>({
    queryKey: ["flashcards", currentUser?.user_id],
    queryFn: async () => {
      const res = await makeRequest.post("/api/users/get-flashcards", {});
      const data = res.data.flashcards.map((card: any) => ({
        ...card,
        content: JSON.parse(card.content),
      }));
      return data;
    },
    enabled: !!currentUser?.user_id,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    // refetchOnMount: true,
  });

  const {
    data: recentVideosData,
    isLoading: isLoadingRecentVideosData,
    refetch: refetchRecentVideosData,
  } = useQuery<any>({
    queryKey: ["recent-videos"],
    queryFn: async () => {
      const res = await makeRequest.post("/api/users/get-recent-videos", {});
      // console.log(res.data.recentVideos);
      return res.data.recentVideos;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnMount: true,
    enabled: isLoggedIn,
  });

  const updateRecentVideoMutation = useMutation({
    mutationFn: async (video: YouTubePlayerVideo) => {
      await makeRequest.post("/api/users/update-recent-videos", {
        video_id: video.id,
        video_data: JSON.stringify(video),
        updateTime: false,
        last_timestamp:
          video.last_timestamp !== undefined
            ? Math.round(video.last_timestamp * 100) / 100
            : 0,
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

  const updateRecentVideoTimeMutation = useMutation({
    mutationFn: async (video: YouTubePlayerVideo) => {
      await makeRequest.post("/api/users/update-recent-videos", {
        video_id: video.id,
        video_data: JSON.stringify(video),
        updateTime: true,
        last_timestamp:
          video.last_timestamp !== undefined
            ? Math.round(video.last_timestamp * 100) / 100
            : 0,
      });
    },
    onMutate: async (video: YouTubePlayerVideo) => {
      const queryKey = ["recent-videos"];
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<any[]>(queryKey);
      if (!previousData) return { previousData, queryKey };
      queryClient.setQueryData(queryKey, previousData);
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

  const updateRecentVideo = async (video: YouTubePlayerVideo) => {
    await updateRecentVideoMutation.mutateAsync(video);
  };

  const updateRecentVideoTime = async (video: YouTubePlayerVideo) => {
    await updateRecentVideoTimeMutation.mutateAsync(video);
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
      // console.log(res.data.collections);
      return res.data.collections;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnMount: true,
    enabled: isLoggedIn,
  });

  const updateVideoCollectionsMutation = useMutation({
    mutationFn: async ({
      video,
      collection_id,
      collection_name,
    }: {
      video: YouTubePlayerVideo;
      collection_id: string | null;
      collection_name: string;
    }) => {
      await makeRequest.post("/api/users/update-video-collections", {
        video_id: video.id,
        video_data: JSON.stringify(video),
        collection_id,
        collection_name,
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
      return { previousData, queryKey };
    },
    onError: (_err, _newData, context) => {
      if (context?.queryKey && context?.previousData) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
    },
    onSuccess: () => {
      showToast("Video saved to collection", "success");
    },
    onSettled: (_data, _err, _variables, context) => {
      if (context?.queryKey) {
        queryClient.invalidateQueries({ queryKey: context.queryKey });
      }
    },
  });

  const updateVideoCollections = async (
    video: YouTubePlayerVideo,
    collection_id: string | null,
    collection_name: string
  ) => {
    await updateVideoCollectionsMutation.mutateAsync({
      video,
      collection_id,
      collection_name,
    });
  };

  const {
    data: videoCollectionData,
    isLoading: isLoadingVideoCollectionData,
    refetch: refetchVideoCollectionData,
  } = useQuery<any>({
    queryKey: ["video-collection"],
    queryFn: async () => {
      const res = await makeRequest.post("/api/users/get-video-collection", {});
      // console.log(res.data.collections);
      return res.data.collections;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnMount: true,
    enabled: isLoggedIn,
  });

  const updateVideoCollectionMutation = useMutation({
    mutationFn: async ({
      collection_id,
      collection_name,
    }: {
      collection_id: string | null;
      collection_name: string;
    }) => {
      await makeRequest.post("/api/users/update-video-collection", {
        collection_id,
        collection_name,
      });
    },
    onMutate: async ({
      collection_id,
      collection_name,
    }: {
      collection_id: string | null;
      collection_name: string;
    }) => {
      const queryKey = ["video-collection"];
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);
      // TO DO: Fix optimistic update
      // queryClient.setQueryData<any[]>(queryKey, (old) => [
      //   ...(old || []),
      //   { id: collection_id || null, name: "New" },
      // ]);
      return { previousData, queryKey };
    },
    onSuccess: () => {
      showToast("New collection added", "success");
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

  const updateVideoCollection = async (
    collection_id: string | null,
    collection_name: string
  ) => {
    await updateVideoCollectionMutation.mutateAsync({
      collection_id,
      collection_name,
    });
  };

  return (
    <QueryContext.Provider
      value={{
        notesData,
        isLoadingNotesData,
        refetchNotesData,
        flashCardData,
        isLoadingFlashCardData,
        refetchFlashCardData,
        recentVideosData,
        isLoadingRecentVideosData,
        refetchRecentVideosData,
        updateRecentVideo,
        updateRecentVideoTime,
        videoCollectionsData,
        isLoadingVideoCollectionsData,
        refetchVideoCollectionsData,
        updateVideoCollections,
        videoCollectionData,
        isLoadingVideoCollectionData,
        refetchVideoCollectionData,
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
