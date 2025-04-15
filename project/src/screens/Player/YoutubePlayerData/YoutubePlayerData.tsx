import { AuthContext } from "@/contexts/authContext";
import { useCurrentPlayerVideoStore } from "@/store/useCurrentPlayerVideoStore";
import { appTheme, appTextSizes } from "@/util/appTheme";
import React, { useContext } from "react";

const YoutubePlayerData = () => {
  const { currentUser } = useContext(AuthContext);
  const currentPlayerVideo = useCurrentPlayerVideoStore(
    (state: any) => state.currentPlayerVideo
  );
  if (currentPlayerVideo === null || !currentUser) return;

  return (
    <div className="w-[100%] h-[100px] px-[16px] pt-[12px]">
      <div className={`font-[600] ${appTextSizes.textHead1}`}>
        {currentPlayerVideo.title}
      </div>
      <div
        onClick={() => {
          window.open(currentPlayerVideo.channel_url, "_blank");
        }}
        style={{ backgroundColor: appTheme[currentUser.theme].background_2 }}
        className="cursor-pointer dim hover:brightness-75 w-fit py-[7.5px] px-[9px] rounded-[5px] mt-[8px] flex flex-row gap-[10px]"
      >
        <div className="rounded-full w-[41px] h-[41px] lg:w-[45px] lg:h-[45px] overflow-hidden">
          <img
            className="w-[100%] h-[100%] object-cover"
            alt=""
            src={currentPlayerVideo.channel_profile}
          />
        </div>
        <div className="w-[100%] flex-1  flex flex-col gap-[3px] justify-center">
          <h1 className={`font-[600] truncate ${appTextSizes.textHead5}`}>
            {currentPlayerVideo.channel}
          </h1>
          <p
            style={{ color: appTheme[currentUser.theme].text_4 }}
            className={`font-[400] ${appTextSizes.textSub1}`}
          >
            {currentPlayerVideo.channel_subs} subscribers
          </p>
        </div>
      </div>
    </div>
  );
};

export default YoutubePlayerData;
