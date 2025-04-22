import { AuthContext } from "@/contexts/authContext";
import { useVideo } from "@/contexts/videoContext";
import { appTheme } from "@/util/appTheme";
import { formatTimeStamp } from "@/util/functions/YouTubeData";
import React, { useContext, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  setVideoTime,
  getVideoTime,
} from "@/screens/Player/YouTubePlayer/YouTubePlayer";

const TranscriptDisplay = () => {
  const { currentUser } = useContext(AuthContext);
  const { currentVideoTranscript, loadingCurrentVideoTranscript } = useVideo();

  const handleTimeClick = (time: number) => {
    const currentTime = getVideoTime();
    if (currentTime !== time) {
      setVideoTime(time);
    }
  };

  if (!currentUser || !currentVideoTranscript) return <></>;
  return (
    <div className="flex flex-col pb-[60px]">
      {!loadingCurrentVideoTranscript &&
      currentVideoTranscript &&
      Array.isArray(currentVideoTranscript) ? (
        currentVideoTranscript.map((transcriptItem: any, index: number) => {
          return (
            <div key={index} className="flex flex-col gap-[6px] mb-[20px]">
              <p
                onClick={() => {
                  handleTimeClick(transcriptItem.offset);
                }}
                className="dim hover:underline underline-offset-2 w-fit cursor-pointer text-[15px] leading-[15px]"
                style={{
                  color: appTheme[currentUser.theme].text_3,
                }}
              >
                {formatTimeStamp(transcriptItem.offset)}
              </p>
              <p
                className="text-[15px] leading-[15px]"
                style={{
                  color: appTheme[currentUser.theme].text_1,
                }}
              >
                {transcriptItem.text}
              </p>
            </div>
          );
        })
      ) : (
        <>
          {[1, 2, 3, 4, 5].map((item: number, index: number) => {
            return (
              <div className="flex flex-col gap-[9px]" key={index}>
                <Skeleton
                  className={`w-[100px] h-[25px] ${
                    currentUser.theme === "dark"
                      ? "brightness-25"
                      : "brightness-[90%]"
                  }`}
                />
                <Skeleton
                  className={`w-[50%] h-[25px] mb-[20px] ${
                    currentUser.theme === "dark"
                      ? "brightness-25"
                      : "brightness-[90%]"
                  }`}
                />
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};

export default TranscriptDisplay;
