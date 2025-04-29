"use client";
import { useContext, useEffect, useRef } from "react";
import { appTheme } from "../../../util/appTheme";
import { AuthContext } from "../../../contexts/authContext";
import React, { useState } from "react";
import { useContextQueries, VideoCollection } from "@/contexts/queryContext";
import { useVideo, YouTubePlayerVideo } from "@/contexts/videoContext";
import CustomVideoFrame from "@/components/CustomVideoFrame/CustomVideoFrame";
import EmptyVideoFrame from "@/components/CustomVideoFrame/EmptyVideoFrame";
import { makeRequest } from "@/util/axios";
import CustomVideoFrameSkeleton from "@/components/CustomVideoFrame/CustomVideoFrameSkeleton";
import { useQueryClient } from "@tanstack/react-query";
import { showToast } from "@/components/CustomToast";

type EditedCollectionNames = {
  [collectionId: string]: string;
};

type VideoCollectionInputProps = {
  item: VideoCollection;
  index: number;
  editedCollectionNames: EditedCollectionNames;
  setEditedCollectionNames: React.Dispatch<
    React.SetStateAction<EditedCollectionNames>
  >;
  videoCollectionData: YouTubePlayerVideo[];
};
const VideoCollectionInput = ({
  item,
  index,
  editedCollectionNames,
  setEditedCollectionNames,
  videoCollectionData,
}: VideoCollectionInputProps) => {
  const queryClient = useQueryClient();
  const editedNamesRef = useRef(editedCollectionNames);
  useEffect(() => {
    editedNamesRef.current = editedCollectionNames;
  }, [editedCollectionNames]);

  const handleInputChange = (e: any) => {
    setEditedCollectionNames((prev) => ({
      ...prev,
      [item.collection_id]: (e.target as HTMLInputElement).value,
    }));
    resetTimer();
  };

  const changeCollectionName = async () => {
    cancelTimer();
    await makeRequest.post("/api/users/update-video-collection", {
      collection_name:
        editedNamesRef.current[item.collection_id].trim() === ""
          ? "Collection Title"
          : editedNamesRef.current[item.collection_id],
      collection_id: item.collection_id,
    });
    queryClient.invalidateQueries({
      queryKey: ["video-collection"],
      refetchType: "active",
    });
  };

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(async () => {
      await changeCollectionName();
    }, 2000);
  };

  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    startTimer();
  };

  const cancelTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <input
      className="mb-[12px] font-[600] w-[calc(100%-140px)] pr-[10px] outline-none border-none"
      type="text"
      value={
        editedCollectionNames[item.collection_id] ??
        videoCollectionData[index].collection_name
      }
      onInput={handleInputChange}
    />
  );
};

const LibraryPage = () => {
  const queryClient = useQueryClient();
  const { currentUser } = useContext(AuthContext);
  const {
    recentVideosData,
    videoCollectionsData,
    videoCollectionData,
    updateVideoCollection,
  } = useContextQueries();
  const { playerState, setPlayerState } = useVideo();

  const [showAllCurrentlyWatching, setShowAllCurrentlyWatching] =
    useState<boolean>(false);
  const [showAllCollections, setShowAllCollections] = useState<{
    [key: string]: boolean;
  }>({});
  const [editedCollectionNames, setEditedCollectionNames] = useState<{
    [key: string]: string;
  }>({});

  useEffect(() => {
    if (playerState === "screen") {
      setPlayerState("sm");
    }
  }, []);

  const handleAddCollection = async () => {
    await updateVideoCollection(null, "New Collection");
    queryClient.invalidateQueries({
      queryKey: ["video-collections"],
      refetchType: "active",
    });
  };

  const handleRemoveSavedVideo = async (video: any, collection_id: any) => {
    if (!video || !collection_id) return;
    const res = await makeRequest.post("/api/users/delete-video-collections", {
      collection_id: collection_id,
      video_id: video.id,
    });
    queryClient.invalidateQueries({
      queryKey: ["video-collections"],
      refetchType: "active",
    });
    if (res.status === 200) {
      showToast("Video removed from collection", "success");
    }
  };

  const handleRemoveCollection = async (collection: VideoCollection) => {
    if (!collection) return;
    const res = await makeRequest.post("/api/users/delete-video-collection", {
      collection_id: collection.collection_id,
    });
    queryClient.invalidateQueries({
      queryKey: ["video-collection"],
      refetchType: "active",
    });
    queryClient.invalidateQueries({
      queryKey: ["video-collections"],
      refetchType: "active",
    });
    if (res.status === 200) {
      showToast("Successfully removed collection", "success");
    }
  };

  if (!currentUser) return <></>;

  return (
    <div className="w-full relative px-[30px] pb-[50px]">
      <p className="mt-[20px] text-[30px] leading-[30px] tracking-[1px] font-[600] w-[100%] text-center">
        Library
      </p>
      <p className="mb-[12px] font-[600]">Keep Watching</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-[30px]">
        {recentVideosData && recentVideosData.length > 0 ? (
          recentVideosData
            .slice(0, showAllCurrentlyWatching ? recentVideosData.length : 6)
            .map((recentVideo, index) => {
              if (!recentVideo.video_data) return <></>;
              const videoData = recentVideo.video_data;
              return (
                <div key={index}>
                  <CustomVideoFrame recentVideo={videoData} index={index} />
                </div>
              );
            })
        ) : (
          <>
            {Array.from({ length: 6 }, (_, index) => {
              return (
                <div key={index}>
                  <CustomVideoFrameSkeleton />
                </div>
              );
            })}
          </>
        )}
      </div>
      {recentVideosData && recentVideosData.length > 6 ? (
        <div className="w-[100%] flex justify-center my-[28px]">
          <div
            style={{
              backgroundColor: appTheme[currentUser.theme].background_2_2,
            }}
            className="dim hover:brightness-75 cursor-pointer px-[87px] py-[10px] rounded-[5px] font-[500] text-[12px]"
            onClick={() =>
              setShowAllCurrentlyWatching((prev: boolean) => !prev)
            }
          >
            {showAllCurrentlyWatching
              ? "SHOW LESS"
              : `SHOW ALL (${recentVideosData.length})`}
          </div>
        </div>
      ) : (
        <div className="h-[50px]"></div>
      )}

      <div className="relative">
        {videoCollectionsData && videoCollectionData && (
          <>
            <p className="mt-[50px] mb-[10px] text-[30px] leading-[30px] tracking-[1px] font-[600] w-[100%] text-center">
              Saved Collections
            </p>
            <div className="hover:brightness-50 brightness-75 cursor-pointer dim absolute right-0 top-[11px]" onClick={handleAddCollection}>Add Collection</div>

            {videoCollectionData.length > 0 &&
              videoCollectionData.map(
                (item: VideoCollection, index: number) => {
                  return (
                    <div key={index} className="w-[100%] relative">
                      <div>
                        <VideoCollectionInput
                          item={item}
                          index={index}
                          setEditedCollectionNames={setEditedCollectionNames}
                          editedCollectionNames={editedCollectionNames}
                          videoCollectionData={videoCollectionData}
                        />
                        <div
                          onClick={() => {
                            handleRemoveCollection(item);
                          }}
                          className="absolute right-0 top-[4px] hover:brightness-[37%] brightness-50 dim cursor-pointer text-[15px] leading-[15px] font-[300]"
                        >
                          Remove Collection
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-[30px]">
                        {videoCollectionsData.length > 0 &&
                        videoCollectionsData.findIndex(
                          (video) => video.collection_id === item.collection_id
                        ) !== -1 ? (
                          videoCollectionsData[
                            videoCollectionsData.findIndex(
                              (video) =>
                                video.collection_id === item.collection_id
                            )
                          ].videos
                            .slice(
                              0,
                              showAllCollections[item.collection_id]
                                ? videoCollectionsData[
                                    videoCollectionsData.findIndex(
                                      (video) =>
                                        video.collection_id ===
                                        item.collection_id
                                    )
                                  ].videos.length
                                : 3
                            )
                            .map((recentVideo: any, index: number) => {
                              return (
                                <div key={index} className="relative">
                                  <CustomVideoFrame
                                    recentVideo={recentVideo}
                                    index={index}
                                  />
                                  <div
                                    onClick={() =>
                                      handleRemoveSavedVideo(
                                        recentVideo,
                                        videoCollectionsData[
                                          videoCollectionsData.findIndex(
                                            (video) =>
                                              video.collection_id ===
                                              item.collection_id
                                          )
                                        ].collection_id
                                      )
                                    }
                                    className="hover:brightness-[37%] brightness-50 dim cursor-pointer absolute text-[14px] leading-[14px] font-[300] bottom-[-22px] left-[3px]"
                                  >
                                    Remove
                                  </div>
                                </div>
                              );
                            })
                        ) : (
                          <EmptyVideoFrame />
                        )}
                      </div>
                      {videoCollectionsData &&
                      videoCollectionsData.length > 0 &&
                      videoCollectionsData.findIndex(
                        (video) => video.collection_id === item.collection_id
                      ) !== -1 &&
                      videoCollectionsData[
                        videoCollectionsData.findIndex(
                          (video) => video.collection_id === item.collection_id
                        )
                      ].videos &&
                      videoCollectionsData[
                        videoCollectionsData.findIndex(
                          (video) => video.collection_id === item.collection_id
                        )
                      ].videos.length > 3 ? (
                        <div className="w-[100%] flex justify-center mt-[35px] mb-[28px]">
                          <div
                            style={{
                              backgroundColor:
                                appTheme[currentUser.theme].background_2_2,
                            }}
                            className="dim hover:brightness-75 cursor-pointer px-[87px] py-[10px] rounded-[5px] font-[500] text-[12px]"
                            onClick={() => {
                              setShowAllCollections((prev) => ({
                                ...prev,
                                [item.collection_id]: !prev[item.collection_id],
                              }));
                            }}
                          >
                            {showAllCollections[item.collection_id]
                              ? "SHOW LESS"
                              : `SHOW ALL (${
                                  videoCollectionsData[
                                    videoCollectionsData.findIndex(
                                      (video) =>
                                        video.collection_id ===
                                        item.collection_id
                                    )
                                  ].videos.length
                                })`}
                          </div>
                        </div>
                      ) : (
                        <div className="h-[50px]"></div>
                      )}
                    </div>
                  );
                }
              )}
          </>
        )}
      </div>
    </div>
  );
};

export default LibraryPage;
