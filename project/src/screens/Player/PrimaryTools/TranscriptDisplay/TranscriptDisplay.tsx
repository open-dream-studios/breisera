import { AuthContext } from "@/contexts/authContext";
import { useVideo } from "@/contexts/videoContext";
import { appTheme } from "@/util/appTheme";
import {
  convertToSeconds,
  formatTimeStamp,
} from "@/util/functions/YouTubeData";
import React, { useContext, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  setVideoTime,
  getVideoTime,
} from "@/screens/Player/YouTubePlayer/YouTubePlayer";
import { SiOpenai } from "react-icons/si";
import { makeRequest } from "@/util/axios";
import { showToast } from "@/components/CustomToast";

const TranscriptTextDisplay = () => {
  return <></>;
};

const TranscriptDisplay = () => {
  const { currentUser } = useContext(AuthContext);
  const {
    currentVideo,
    currentVideoTranscript,
    loadingCurrentVideoTranscript,
    currentWhisperTranscript,
    loadingCurrentWhisperTranscript,
    setLoadingCurrentWhisperTranscript,
    setCurrentWhisperTranscript,
  } = useVideo();

  const handleWhisperClick = async () => {
    if (currentUser && currentVideo) {
      setLoadingCurrentWhisperTranscript(true);
      try {
        const res = await makeRequest.post("/api/youtube/generate-transcript", {
          videoId: currentVideo.id,
          video: currentVideo,
        });
        if (res.status === 200) {
          setCurrentWhisperTranscript(res.data);
          showToast("Whisper transcript generated!", "success");
        }
      } catch (error) {
        console.error("Video transcript not available:", error);
        showToast("Unable to generate whisper transcript", "error");
      } finally {
        setLoadingCurrentWhisperTranscript(false);
      }
    }
  };

  if (!currentUser) return <></>;
  return (
    <div className="flex flex-col pb-[60px]">
      <div className="w-[100%] flex justify-between">
        <p className="text-[23px] mb-[18px] font-[600]">Transcript</p>
        <button
          // disabled={loading}
          onClick={handleWhisperClick}
          className="flex flex-row gap-[8px] h-[34px] pb-[1px] px-[20px] rounded-[11px] cursor-pointer hover:brightness-75 dim text-[15px] leading-[15px] items-center justify-center"
          style={{
            backgroundColor:
              currentUser.theme === "dark"
                ? "transparent"
                : appTheme[currentUser.theme].background_2,
            border:
              !loadingCurrentWhisperTranscript && currentWhisperTranscript
                ? `1px solid #6DB0C0`
                : currentUser.theme === "dark"
                ? `1px solid ${appTheme[currentUser.theme].background_2}`
                : "none",
            color:
              appTheme[currentUser.theme].text_2,
          }}
        >
          <SiOpenai />
          {loadingCurrentWhisperTranscript ? (
            <p>Generating with Whisper...</p>
          ) : currentWhisperTranscript ? (
            <p>Using Whisper</p>
          ) : (
            <p>Use Whisper</p>
          )}
        </button>
      </div>
      {loadingCurrentVideoTranscript && !currentVideoTranscript ? (
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
      ) : currentWhisperTranscript ? (
        currentWhisperTranscript.map((transcriptItem: any, index: number) => {
          return (
            <div
              onClick={() => {
                const currentTime = getVideoTime();
                if (
                  transcriptItem.offset &&
                  currentTime !== transcriptItem.offset
                ) {
                  setVideoTime(transcriptItem.offset);
                }
              }}
              key={index}
              className="flex flex-row gap-[10px] mb-[14px] items-start hover:brightness-75 dim cursor-pointer"
            >
              <div
                style={{
                  backgroundColor: appTheme[currentUser.theme].bot_time_stamp,
                  color: appTheme[currentUser.theme].text_2,
                }}
                className="bg-gray-500 px-[5px] text-[14px] leading-[14px] py-[4px] ml-[2px] mr-[2px] rounded-[5px]"
              >
                {formatTimeStamp(transcriptItem.offset)}
              </div>

              <p
                className="text-[15px] leading-[20px] mt-[1px]"
                style={{
                  color: appTheme[currentUser.theme].text_1,
                }}
              >
                {transcriptItem.text}
              </p>
            </div>
          );
        })
      ) : !currentVideoTranscript || !Array.isArray(currentVideoTranscript) ? (
        <div style={{ color: appTheme[currentUser.theme].text_4 }}>
          Transcript is not available for this video
        </div>
      ) : (
        currentVideoTranscript.map((transcriptItem: any, index: number) => {
          return (
            <div
              onClick={() => {
                const currentTime = getVideoTime();
                if (
                  transcriptItem.offset &&
                  currentTime !== transcriptItem.offset
                ) {
                  setVideoTime(transcriptItem.offset);
                }
              }}
              key={index}
              className="flex flex-row gap-[10px] mb-[14px] items-start hover:brightness-75 dim cursor-pointer"
            >
              <div
                style={{
                  backgroundColor: appTheme[currentUser.theme].bot_time_stamp,
                  color: appTheme[currentUser.theme].text_2,
                }}
                className="bg-gray-500 px-[5px] text-[14px] leading-[14px] py-[4px] ml-[2px] mr-[2px] rounded-[5px]"
              >
                {formatTimeStamp(transcriptItem.offset)}
              </div>

              <p
                className="text-[15px] leading-[20px] mt-[1px]"
                style={{
                  color: appTheme[currentUser.theme].text_1,
                }}
              >
                {transcriptItem.text}
              </p>
            </div>
          );
        })
      )}
    </div>
  );
};

export default TranscriptDisplay;
