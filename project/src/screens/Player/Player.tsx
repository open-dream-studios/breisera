"use client"
import { useState, useEffect, useRef, useContext } from "react";
import { appTheme } from "@/util/appTheme";
import { AuthContext } from "@/contexts/authContext";
import YouTubePlayer from "./YouTubePlayer/YouTubePlayer";
import YoutubePlayerData from "./YoutubePlayerData/YoutubePlayerData";
import StudyTools from "./StudyTools/StudyTools";

const Player = () => {
  const { currentUser } = useContext(AuthContext)
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
  
  if (!currentUser) return

  return (
    <div ref={containerRef} className="flex h-[100%] w-[100%] select-none relative">
      <div
        className="select-none flex flex-col"
        style={{
          width: `${dividerPercent}%`,
        }}
      >
        <YouTubePlayer />
        <YoutubePlayerData />
      </div>

      <div
        onMouseDown={handleMouseDown}
        className="absolute h-[100%] cursor-col-resize w-[6px] ml-[-2px]"
        style={{
          left: `${dividerPercent}%`,
        }}
      >
        <div className="w-[0.5px] h-[100%] ml-[1px]" style={{backgroundColor: appTheme[currentUser.theme].background_2}}></div>
      </div>

      <div className="select-none flex-grow">
        <StudyTools />
      </div>
    </div>
  );
};

export default Player;
