import { AuthContext } from "@/contexts/authContext";
import { useContextQueries } from "@/contexts/queryContext";
import { useVideo } from "@/contexts/videoContext";
import { appTheme } from "@/util/appTheme";
import { FRONTEND_URL } from "@/util/config";
import { iso8601ToSeconds } from "@/util/functions/Data";
import Link from "next/link";
import { useContext } from "react";
import { RiPlayLargeFill } from "react-icons/ri";

const CustomVideoFrame = ({
  recentVideo,
  index,
}: {
  recentVideo: any;
  index: number;
}) => {
  const { currentUser } = useContext(AuthContext);
  const { handleVideoClick } = useVideo();
  const { recentVideosData } = useContextQueries();
  if (!currentUser) return;
  return (
    <div
      className="rounded-[5px] overflow-hidden relative w-[100%] h-[100%] flex flex-col"
      style={{
        backgroundColor: appTheme[currentUser.theme].background_2,
      }}
    >
      <Link
        onClick={() => handleVideoClick(recentVideo)}
        href={`${FRONTEND_URL}/www.youtube.com/watch?v=${recentVideo.id}`}
        className="dim hover:brightness-75 cursor-pointer relative w-[100%] aspect-[16/9] overflow-hidden"
      >
        <img
          className="w-[100%] h-[100%] object-cover"
          src={
            recentVideo.snippet?.thumbnails?.high?.url
              ? recentVideo.snippet.thumbnails.high.url
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
                  recentVideosData[index].video_data.contentDetails.duration
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
            `https://www.youtube.com/channel/${recentVideo.snippet.channelId}`,
            "_blank"
          );
        }}
        className="w-[100%] relative dim hover:brightness-75 cursor-pointer flex flex-col pt-[5px] pb-[10px] px-[13px] gap-[6px]"
      >
        <p
          className="font-[500] truncate w-[100%] overflow-hidden text-[14px] leading-[14px] tracking-[0.2px] mt-[5px]"
          style={{
            color: appTheme[currentUser.theme].text_1,
          }}
        >
          {recentVideo.snippet.title}
        </p>
        <div className="flex flex-row gap-[8px] items-center w-[100%]">
          <div className="w-[25px] h-[25px] min-w-[25px] overflow-hidden rounded-full">
            <img
              className="w-[100%] h-[100%] object-cover"
              src={recentVideo.channelInfo.thumbnail}
            />
          </div>
          <p
            className="truncate overflow-hidden mt-[-2px] font-[500] w-[100%] text-[14px] leading-[14px] tracking-[0.2px]"
            style={{
              color: appTheme[currentUser.theme].text_1,
            }}
          >
            {recentVideo.snippet.channelTitle}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomVideoFrame;
