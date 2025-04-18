"use client";
import { useState, useEffect, useRef, useContext } from "react";
import { appTheme } from "@/util/appTheme";
import { AuthContext } from "@/contexts/authContext";
import YouTubePlayer from "./YouTubePlayer/YouTubePlayer";
import YoutubePlayerData from "./YoutubePlayerData/YoutubePlayerData";
import StudyTools from "./StudyTools/StudyTools";
import { useVideo } from "@/contexts/videoContext";
import { LuSquareArrowOutUpLeft } from "react-icons/lu";

const Player = () => {
  const { currentUser } = useContext(AuthContext);
  const { playerState, setPlayerState, windowWidth } = useVideo();
  const [dividerPercent, setDividerPercent] = useState(66);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent) => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const containerLeft = containerRef.current.getBoundingClientRect().left;
      const newPercent = ((e.clientX - containerLeft) / containerWidth) * 100;
      setDividerPercent(Math.max(35, Math.min(newPercent, 73)));
    }
  };

  const handleMouseUp = () => {
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  };

  const handleMouseDown = () => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  useEffect(() => {
    const handleResize = () => {
      setDividerPercent((prev) => Math.max(35, Math.min(prev, 70)));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!currentUser) return;

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col sm:flex-row w-[100%] h-[100%]"
      style={{backgroundColor: appTheme[currentUser.theme].background_1}}
    >
      {playerState === "sm" && (
        <div
          style={{
            backgroundColor: appTheme[currentUser.theme].background_1,
            border: `1px solid ${appTheme[currentUser.theme].background_2}`,
          }}
          onClick={() => {
            setPlayerState("screen");
          }}
          className="cursor-pointer dim hover:brightness-75 absolute top-[-20px] left-[-20px] rounded-full w-[40px] h-[40px] flex justify-center items-center"
        >
          <LuSquareArrowOutUpLeft
            className="w-[20px] h-[20px]"
            style={{
              color: appTheme[currentUser.theme].text_1,
            }}
          />
        </div>
      )}
      <div
        className="select-none flex flex-col"
        style={{
          width: playerState === "sm" || (windowWidth !== null && windowWidth < 640) ? "100%" : `${dividerPercent}%`,
        }}
      >
        <YouTubePlayer />
        <YoutubePlayerData />
      </div>

      <div
        onMouseDown={handleMouseDown}
        className={`absolute h-[100%] cursor-col-resize ${
          playerState === "sm" ? "hidden" : "hidden sm:block"
        } w-[6px] ml-[-2px]`}
        style={{
          left: `${dividerPercent}%`,
        }}
      >
        <div
          className="w-[0.5px] h-[100%] ml-[1px]"
          style={{
            backgroundColor: appTheme[currentUser.theme].background_2,
          }}
        ></div>
      </div>

      <div style={{
        maxWidth: `calc(100% - ${dividerPercent}%)`
      }} className={`select-none flex-grow ${playerState === "sm" && "w-0"}`}>
        <StudyTools />
      </div>
    </div>
  );
};

export default Player;
