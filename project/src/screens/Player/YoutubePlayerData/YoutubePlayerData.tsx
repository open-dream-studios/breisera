"use client";
import { showToast } from "@/components/CustomToast";
import { AuthContext } from "@/contexts/authContext";
import { useVideo } from "@/contexts/videoContext";
import { useModal2Store } from "@/store/useModalStore";
import { appTheme, appTextSizes } from "@/util/appTheme";
import { BACKEND_URL } from "@/util/config";
import { openWindow } from "@/util/functions/AppFunctions";
import { formatSubs } from "@/util/functions/YouTubeData";
import Modal2Continue from "@/util/modals/Modal2Continue";
import React, { useContext, useState } from "react";
import { RxCopy } from "react-icons/rx";
import { TfiDownload } from "react-icons/tfi";

const YoutubePlayerData = () => {
  const { currentUser } = useContext(AuthContext);
  const { currentVideo } = useVideo();
  const modal2 = useModal2Store((state: any) => state.modal2);
  const setModal2 = useModal2Store((state: any) => state.setModal2);

  const [loading, setLoading] = useState<boolean>(false);
  const [start, setStart] = useState<string>("00:00");
  const [end, setEnd] = useState<string>("00:40");

  const handleDownload = async () => {
    if (!currentVideo) return;
    setLoading(true);
    showToast("Downloading...", "success");
    try {
      const response = await fetch(`${BACKEND_URL}/create-video`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          link: `https://www.youtube.com/watch?v=${currentVideo.id}`,
          start: start,
          end: end,
        }),
      });
      const responseData = await response.json();
      if (response.status === 200) {
        showToast("Downloaded!", "success");
        window.open(`${BACKEND_URL}/download-video`, "_self");
      }
    } catch (error) {
      console.error("Error downloading the video:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!currentVideo) return;
    navigator.clipboard
      .writeText(`https://www.youtube.com/watch?v=${currentVideo.id}`)
      .then(() => showToast("Copied link to clipboard", "success"))
      .catch((err) => console.error("Failed to copy: ", err));
  };

  const handleDownloadClick = () => {
    if (!currentUser) return;
    setModal2({
      ...modal2,
      open: !modal2.open,
      showClose: false,
      offClickClose: true,
      width: "w-[300px]",
      maxWidth: "max-w-[400px]",
      aspectRatio: "aspect-[5/2]",
      borderRadius: "rounded-[12px] md:rounded-[15px]",
      content: (
        <Modal2Continue
          text={"Download this YouTube video?"}
          onContinue={handleDownload}
        />
      ),
    });
  };

  if (currentVideo === null || !currentUser) return;

  return (
    <div className="w-[100%] px-[16px] pt-[12px] pb-[18px]">
      <div className={`font-[600] ${appTextSizes.textHead1}`}>
        {currentVideo.snippet.title}
      </div>
      <div className="w-[100%] flex flex-row justify-between items-start mt-[10px]">
        <div
          onClick={() => {
            openWindow(
              `https://www.youtube.com/channel/${currentVideo.snippet.channelId}`
            );
          }}
          style={{ backgroundColor: appTheme[currentUser.theme].background_2 }}
          className="cursor-pointer dim hover:brightness-75 w-fit py-[8px] pl-[10px] pr-[15px] rounded-[5px] flex flex-row gap-[10px]"
        >
          <div className="rounded-full w-[38px] h-[38px] lg:w-[42px] lg:h-[42px] overflow-hidden">
            <img
              className="w-[100%] h-[100%] object-cover"
              alt=""
              src={currentVideo.channelInfo.thumbnail}
            />
          </div>
          <div className="w-[100%] flex-1 flex flex-col gap-[3px] justify-center max-w-[30vw]">
            <h1
              className={`font-[600] truncate w-[100%] ${appTextSizes.textHead5}`}
            >
              {currentVideo.snippet.channelTitle}
            </h1>
            <p
              style={{ color: appTheme[currentUser.theme].text_4 }}
              className={`font-[400] ${appTextSizes.textSub1}`}
            >
              {formatSubs(currentVideo.channelInfo.subs)} subscribers
            </p>
          </div>
        </div>
        <div className="flex flex-row gap-[8px]">
          <button
            disabled={loading}
            onClick={handleDownloadClick}
            className="flex flex-col h-[34px] pb-[1px] w-[65px] rounded-[11px] cursor-pointer hover:brightness-75 dim text-[15px] leading-[15px] items-center justify-center"
            style={{
              backgroundColor:
                currentUser.theme === "dark"
                  ? "transparent"
                  : appTheme[currentUser.theme].background_2,
              border:
                currentUser.theme === "dark"
                  ? `1px solid ${appTheme[currentUser.theme].background_2}`
                  : "none",
              color: appTheme[currentUser.theme].text_2,
            }}
          >
            <TfiDownload className="w-[19px] h-[19px]" />
          </button>

          <div
            onClick={copyToClipboard}
            className="flex h-[34px] pb-[1px] w-[65px] rounded-[11px] cursor-pointer hover:brightness-75 dim text-[15px] leading-[15px] items-center justify-center"
            style={{
              backgroundColor:
                currentUser.theme === "dark"
                  ? "transparent"
                  : appTheme[currentUser.theme].background_2,
              border:
                currentUser.theme === "dark"
                  ? `1px solid ${appTheme[currentUser.theme].background_2}`
                  : "none",
              color: appTheme[currentUser.theme].text_2,
            }}
          >
            <RxCopy className="w-[18px] h-[18px] " />
          </div>
        </div>
      </div>
    </div>
  );
};

export default YoutubePlayerData;
