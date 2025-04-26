"use client";
import { useContext } from "react";
import { appTheme } from "../../../util/appTheme";
import { AuthContext } from "../../../contexts/authContext";
import React, { useState } from "react";
import { RiPlayLargeFill } from "react-icons/ri";
import { vid } from "../../../../video_db";
import { useContextQueries } from "@/contexts/queryContext";
import Link from "next/link";
import { useVideo, YouTubePlayerVideo } from "@/contexts/videoContext";
import { FRONTEND_URL } from "@/util/config";

const LibraryPage = () => {
  const { currentUser } = useContext(AuthContext);
  const { recentVideosData, newVideoLoaded } = useContextQueries();
  const { setCurrentVideo, currentVideo } = useVideo();

  const [showAllCurrentlyWatching, setShowAllCurrentlyWatching] =
    useState<boolean>(false);
  const [showAllSavedVideos, setShowAllSavedVideos] = useState<boolean>(false);

  const handleVideoClick = (video: YouTubePlayerVideo) => {
    setCurrentVideo(video);
    newVideoLoaded(video);
  };

  if (!currentUser) return <></>;

  return (
    <div className="w-full relative px-[30px] pb-[50px]">
      <p className="mt-[20px] text-[30px] leading-[30px] tracking-[1px] font-[600] w-[100%] text-center">
        Library
      </p>
      <p className="mb-[12px] font-[600]">Keep Watching</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-[30px]">
        {recentVideosData &&
          recentVideosData
            .slice(0, showAllCurrentlyWatching ? recentVideosData.length : 6)
            .map((video, index) => {
              console.log(video);
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
                    className="w-[100%] h-[2.5px] bottom-[-2.5px]"
                    style={{
                      backgroundColor: appTheme[currentUser.theme].background_3,
                    }}
                  >
                    <div className="w-[40%] bg-red-400 h-[2.5px] bottom-0"></div>
                  </div>
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

      <p className="mb-[12px] font-[600]">Saved Videos</p>
      {/* <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-[30px] gap-y-[20px]">
        {videos
          .slice(0, showAllSavedVideos ? videos.length : 4)
          .map((video, index) => (
            <div key={index} className="rounded-[3px] overflow-hidden">
              <div className="dim hover:brightness-75 cursor-pointer relative w-[100%] aspect-[16/9]">
                <img
                  className="w-[100%] h-[100%]"
                  src="https://images.unsplash.com/photo-1741761446510-7804410eade3?q=80&w=2350&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                />
              </div>
              <div
                onClick={() => {
                  window.open(
                    `https://www.youtube.com/channel/${vid.snippet.channelId}`,
                    "_blank"
                  );
                }}
                className="dim hover:brightness-75 cursor-pointer flex flex-row py-[9px] gap-[10px]"
              >
                <div className="flex flex-col px-[1px]">
                  <p
                    className="font-[600] text-[11px] leading-[11px] tracking-[0.2px]"
                    style={{ color: appTheme[currentUser.theme].text_1 }}
                  >
                    Gordon Ramsey
                  </p>
                  <p
                    className="font-[500] text-[10px] leading-[10px] tracking-[0.2px] mt-[3px]"
                    style={{ color: appTheme[currentUser.theme].text_1 }}
                  >
                    Cooking II: Restaurant Recipies at Home
                  </p>
                  <p
                    className="font-[300] text-[9px] leading-[10.5px] tracking-[0.2px] mt-[4px] line-clamp-3 overflow-hidden"
                    style={{ color: appTheme[currentUser.theme].text_3 }}
                  >
                    Start creating dining experiences at home. Learn to cook
                    restaurant-inspired dishes with tips for time-saving prep to
                    show-stopping menus on the go!
                  </p>
                </div>
              </div>
            </div>
          ))}
      </div> */}
      <div className="w-[100%] flex justify-center my-[28px]">
        <div
          style={{
            backgroundColor: appTheme[currentUser.theme].background_2_2,
          }}
          className="dim hover:brightness-75 cursor-pointer px-[87px] py-[10px] rounded-[5px] font-[500] text-[12px]"
          onClick={() => setShowAllSavedVideos((prev: boolean) => !prev)}
        >
          {showAllSavedVideos ? "SHOW LESS" : "SHOW ALL (8)"}
        </div>
      </div>
    </div>
  );
};

export default LibraryPage;
