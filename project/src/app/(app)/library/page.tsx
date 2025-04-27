"use client";
import { useContext, useEffect } from "react";
import { appTheme } from "../../../util/appTheme";
import { AuthContext } from "../../../contexts/authContext";
import React, { useState } from "react";
import { RiPlayLargeFill } from "react-icons/ri";
import { useContextQueries } from "@/contexts/queryContext";
import Link from "next/link";
import { useVideo, YouTubePlayerVideo } from "@/contexts/videoContext";
import { FRONTEND_URL } from "@/util/config";
import { iso8601ToSeconds } from "@/util/functions/Data";
import CustomVideoFrame from "@/components/CustomVideoFrame/CustomVideoFrame";

const LibraryPage = () => {
  const { currentUser } = useContext(AuthContext);
  const { recentVideosData, videoCollectionsData, videoCollectionData } =
    useContextQueries();
  const { setCurrentVideo, currentVideo, playerState, setPlayerState } =
    useVideo();

  const [showAllCurrentlyWatching, setShowAllCurrentlyWatching] =
    useState<boolean>(false);
  const [showAllSavedVideos, setShowAllSavedVideos] = useState<boolean>(false);

  const handleVideoClick = (video: YouTubePlayerVideo) => {
    setCurrentVideo(video);
  };

  useEffect(() => {
    if (playerState === "screen") {
      setPlayerState("sm");
    }
  }, []);

  if (!currentUser) return <></>;

  return (
    <div className="w-full relative px-[30px] pb-[50px]">
      <p className="mt-[20px] text-[30px] leading-[30px] tracking-[1px] font-[600] w-[100%] text-center">
        Library
      </p>
      <p className="mb-[12px] font-[600]">Keep Watching</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-[30px]">
        {recentVideosData &&
          recentVideosData.length > 0 &&
          recentVideosData
            .slice(0, showAllCurrentlyWatching ? recentVideosData.length : 6)
            .map((recentVideo, index) => {
              return (
                <div
                  key={index}
                  className="rounded-[5px] overflow-hidden relative w-[100%] h-[100%] flex flex-col"
                  style={{
                    backgroundColor: appTheme[currentUser.theme].background_2,
                  }}
                >
                  <Link
                    onClick={() => handleVideoClick(recentVideo.video_data)}
                    href={`${FRONTEND_URL}/www.youtube.com/watch?v=${recentVideo.video_data.id}`}
                    className="dim hover:brightness-75 cursor-pointer relative w-[100%] aspect-[16/9] overflow-hidden"
                  >
                    <img
                      className="w-[100%] h-[100%] object-cover"
                      src={
                        recentVideo.video_data.snippet?.thumbnails?.high?.url
                          ? recentVideo.video_data.snippet.thumbnails.high.url
                          : ""
                      }
                    />
                    <div className="absolute bottom-[10px] right-[12px] bg-white py-[8px] px-[19px] rounded-[6px] flex flex-row gap-[6px] items-center justify-center">
                      <RiPlayLargeFill className="text-black w-[13px] h-[13px]" />
                      <p className="text-[11px] leading-[11px] font-[600] mt-[1px] text-black">
                        Resume
                      </p>
                    </div>
                  </Link>
                  <div
                    className="w-[100%] h-[2.5px] bottom-[-2.5px]"
                    style={{
                      backgroundColor: appTheme[currentUser.theme].background_3,
                    }}
                  >
                    <div
                      style={{
                        width: `${
                          (recentVideosData[index].last_timestamp /
                            iso8601ToSeconds(
                              recentVideosData[index].video_data.contentDetails
                                .duration
                            )) *
                          100
                        }%`,
                      }}
                      className="bg-red-400 h-[2.5px] bottom-0"
                    ></div>
                  </div>
                  <div
                    onClick={() => {
                      window.open(
                        `https://www.youtube.com/channel/${recentVideo.video_data.snippet.channelId}`,
                        "_blank"
                      );
                    }}
                    className="w-[100%] relative dim hover:brightness-75 cursor-pointer flex flex-col pt-[5px] pb-[10px] px-[13px] gap-[6px]"
                  >
                    <p
                      className="font-[500] truncate w-[100%] overflow-hidden text-[14px] leading-[14px] tracking-[0.2px] mt-[5px]"
                      style={{ color: appTheme[currentUser.theme].text_1 }}
                    >
                      {recentVideo.video_data.snippet.title}
                    </p>
                    <div className="flex flex-row gap-[8px] items-center w-[100%]">
                      <div className="w-[25px] h-[25px] min-w-[25px] overflow-hidden rounded-full">
                        <img
                          className="w-[100%] h-[100%] object-cover"
                          src={recentVideo.video_data.channelInfo.thumbnail}
                        />
                      </div>
                      <p
                        className="truncate overflow-hidden mt-[-2px] font-[500] w-[100%] text-[14px] leading-[14px] tracking-[0.2px]"
                        style={{ color: appTheme[currentUser.theme].text_1 }}
                      >
                        {recentVideo.video_data.snippet.channelTitle}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
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

      {/* <p className="mb-[12px] font-[600]">Saved Videos</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-[30px]">
        {videoCollectionsData &&
          videoCollectionsData.length > 0 &&
          videoCollectionsData.findIndex(
            (collection) =>
              collection.collection_id === "saved-videos-collection"
          ) !== -1 &&
          videoCollectionsData[
            videoCollectionsData.findIndex(
              (collection) =>
                collection.collection_id === "saved-videos-collection"
            )
          ].videos.length > 0 &&
          videoCollectionsData[
            videoCollectionsData.findIndex(
              (collection) =>
                collection.collection_id === "saved-videos-collection"
            )
          ].videos
            .slice(
              0,
              showAllSavedVideos
                ? videoCollectionsData[
                    videoCollectionsData.findIndex(
                      (collection) =>
                        collection.collection_id === "saved-videos-collection"
                    )
                  ].videos.length
                : 6
            )
            .map((video: YouTubePlayerVideo, index: number) => {
              return (
                <div
                  key={index}
                  className="rounded-[5px] overflow-hidden relative w-[100%] h-[100%] flex flex-col"
                  style={{
                    backgroundColor: appTheme[currentUser.theme].background_2,
                  }}
                >
                  <Link
                    onClick={() => handleVideoClick(video)}
                    href={`${FRONTEND_URL}/www.youtube.com/watch?v=${video.id}`}
                    className="dim hover:brightness-75 cursor-pointer relative w-[100%] aspect-[16/9] overflow-hidden"
                  >
                    <img
                      className="w-[100%] h-[100%] object-cover"
                      src={
                        video.snippet?.thumbnails?.high?.url
                          ? video.snippet.thumbnails.high.url
                          : ""
                      }
                    />
                    <div className="absolute bottom-[10px] right-[12px] bg-white py-[8px] px-[19px] rounded-[6px] flex flex-row gap-[6px] items-center justify-center">
                      <RiPlayLargeFill className="text-black w-[13px] h-[13px]" />
                      <p className="text-[11px] leading-[11px] font-[600] mt-[1px] text-black">
                        Resume
                      </p>
                    </div>
                  </Link>
                  <div
                    onClick={() => {
                      window.open(
                        `https://www.youtube.com/channel/${video.snippet.channelId}`,
                        "_blank"
                      );
                    }}
                    className="w-[100%] relative dim hover:brightness-75 cursor-pointer flex flex-col pt-[5px] pb-[10px] px-[13px] gap-[6px]"
                  >
                    <p
                      className="font-[500] truncate w-[100%] overflow-hidden text-[14px] leading-[14px] tracking-[0.2px] mt-[5px]"
                      style={{ color: appTheme[currentUser.theme].text_1 }}
                    >
                      {video.snippet.title}
                    </p>
                    <div className="flex flex-row gap-[8px] items-center w-[100%]">
                      <div className="w-[25px] h-[25px] min-w-[25px] overflow-hidden rounded-full">
                        <img
                          className="w-[100%] h-[100%] object-cover"
                          src={video.channelInfo.thumbnail}
                        />
                      </div>
                      <p
                        className="truncate overflow-hidden mt-[-2px] font-[500] w-[100%] text-[14px] leading-[14px] tracking-[0.2px]"
                        style={{ color: appTheme[currentUser.theme].text_1 }}
                      >
                        {video.snippet.channelTitle}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
      </div> */}

      <div>
        {videoCollectionData &&
          videoCollectionData.length > 0 &&
          videoCollectionData.map((item: any, index: number) => {
            return (
              <div key={index} className="w-[100%]">
                <p className="mb-[12px] font-[600]">
                  {videoCollectionData[index].collection_name}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-[30px]">
                  {videoCollectionsData &&
                    videoCollectionsData.length > 0 &&
                    videoCollectionsData.findIndex(
                      (video) => video.collection_id === item.collection_id
                    ) !== -1 &&
                    videoCollectionsData[
                      videoCollectionsData.findIndex(
                        (video) => video.collection_id === item.collection_id
                      )
                    ].videos
                      .slice(
                        0,
                        showAllCurrentlyWatching ? recentVideosData.length : 6
                      )
                      .map((recentVideo: any, index: number) => {
                        return (
                          <div key={index}>
                            <CustomVideoFrame
                              recentVideo={recentVideo}
                              index={index}
                            />
                          </div>
                        );
                      })}
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
                ].videos.length > 1 ? (
                  <div className="w-[100%] flex justify-center my-[28px]">
                    <div
                      style={{
                        backgroundColor:
                          appTheme[currentUser.theme].background_2_2,
                      }}
                      className="dim hover:brightness-75 cursor-pointer px-[87px] py-[10px] rounded-[5px] font-[500] text-[12px]"
                      onClick={() => {
                        // setShowAllCurrentlyWatching((prev: boolean) => !prev)
                      }}
                    >
                      {/* {showAllCurrentlyWatching
                        ? "SHOW LESS"
                        : `SHOW ALL (${videoCollectionsData.length})`} */}
                    </div>
                  </div>
                ) : (
                  <div className="h-[50px]"></div>
                )}
              </div>
            );
          })}
      </div>

      {/* {videoCollectionsData &&
      videoCollectionsData.length > 0 &&
      videoCollectionsData.findIndex(
        (collection) => collection.collection_id === "saved-videos-collection"
      ) !== -1 &&
      videoCollectionsData[
        videoCollectionsData.findIndex(
          (collection) => collection.collection_id === "saved-videos-collection"
        )
      ].videos.length > 6 ? (
        <div className="w-[100%] flex justify-center my-[28px]">
          <div
            style={{
              backgroundColor: appTheme[currentUser.theme].background_2_2,
            }}
            className="dim hover:brightness-75 cursor-pointer px-[87px] py-[10px] rounded-[5px] font-[500] text-[12px]"
            onClick={() => setShowAllSavedVideos((prev: boolean) => !prev)}
          >
            {showAllSavedVideos
              ? "SHOW LESS"
              : `SHOW ALL (${
                  videoCollectionsData[
                    videoCollectionsData.findIndex(
                      (collection) =>
                        collection.collection_id === "saved-videos-collection"
                    )
                  ].videos.length
                })`}
          </div>
        </div>
      ) : (
        <div className="h-[50px]"></div>
      )} */}
    </div>
  );
};

export default LibraryPage;
