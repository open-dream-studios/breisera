import { AuthContext } from "@/contexts/authContext";
import { useVideo } from "@/contexts/videoContext";
import { useCurrentPlayerVideoStore } from "@/store/useCurrentPlayerVideoStore";
import { appTheme, appTextSizes } from "@/util/appTheme";
import { formatSubs } from "@/util/functions/YouTubeData";
import React, { useContext } from "react";

const YoutubePlayerData = () => {
  const { currentUser } = useContext(AuthContext);
  const { currentVideo } = useVideo();
  if (currentVideo === null || !currentUser) return;

  return (
    <div className="w-[100%] h-[100px] px-[16px] pt-[12px]">
      <div className={`font-[600] ${appTextSizes.textHead1}`}>
        {currentVideo.snippet.title}
      </div>
      <div
        onClick={() => {
          window.open(currentVideo.channel_url, "_blank");
        }}
        style={{ backgroundColor: appTheme[currentUser.theme].background_2 }}
        className="cursor-pointer dim hover:brightness-75 w-fit py-[8px] pl-[10px] pr-[12px] rounded-[5px] mt-[8px] flex flex-row gap-[10px]"
      >
        <div className="rounded-full w-[38px] h-[38px] lg:w-[42px] lg:h-[42px] overflow-hidden">
          <img
            className="w-[100%] h-[100%] object-cover"
            alt=""
            src={currentVideo.channelInfo.thumbnail}
          />
        </div>
        <div className="w-[100%] flex-1 flex flex-col gap-[3px] justify-center max-w-[30vw]">
          <h1 className={`font-[600] truncate w-[100%] ${appTextSizes.textHead5}`}>
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
    </div>
  );
};

export default YoutubePlayerData;
