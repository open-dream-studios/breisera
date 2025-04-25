"use client";
import { useState, useEffect, useRef, useContext } from "react";
import { appTheme } from "@/util/appTheme";
import { AuthContext } from "@/contexts/authContext";
import YouTubePlayer, { pauseVideo } from "./YouTubePlayer/YouTubePlayer";
import YoutubePlayerData from "./YoutubePlayerData/YoutubePlayerData";
import StudyTools from "./StudyTools/StudyTools";
import { useVideo } from "@/contexts/videoContext";
import { LuSquareArrowOutUpLeft } from "react-icons/lu";
import { makeRequest } from "@/util/axios";
import PrimaryTools from "./PrimaryTools/PrimaryTools";
import { ChevronDown } from "lucide-react";

const Player = () => {
  const { currentUser } = useContext(AuthContext);
  const {
    playerState,
    setPlayerState,
    windowWidth,
    currentVideo,
    currentVideoTranscript,
    setCurrentVideoTranscript,
    setLoadingCurrentVideoTranscript,
    setCurrentKeyConcepts,
    setLoadingCurrentKeyConcepts,
    setLoadingCurrentSummary,
    setCurrentSummary,
  } = useVideo();
  const [dividerPercent, setDividerPercent] = useState(66);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showPrimaryTools, setShowPrimaryTools] = useState<boolean>(true);

  useEffect(() => {
    const fetchTranscript = async () => {
      if (currentUser && currentVideo) {
        try {
          const res = await makeRequest.post("/api/youtube/get-transcript", {
            videoId: currentVideo.id,
          });
          if (res.status === 200 && res.data.success) {
            setCurrentVideoTranscript(res.data.content);
          } else {
            setLoadingCurrentSummary(false);
            setLoadingCurrentKeyConcepts(false);
          }
        } catch (error) {
          setLoadingCurrentSummary(false);
          setLoadingCurrentKeyConcepts(false);
          console.error("Failed to fetch videos:", error);
        } finally {
          setLoadingCurrentVideoTranscript(false);
        }
      }
    };

    setCurrentVideoTranscript(null);
    setCurrentKeyConcepts(null);
    setCurrentSummary(null);
    setLoadingCurrentVideoTranscript(true);
    setLoadingCurrentKeyConcepts(true);
    setLoadingCurrentSummary(true);
    fetchTranscript();
  }, [currentVideo]);

  useEffect(() => {
    const generateSummary = async () => {
      try {
        const res = await makeRequest.post("/api/youtube/gemini-summary", {
          transcript: currentVideoTranscript,
          video: currentVideo,
        });
        if (res.status === 200) {
          setCurrentSummary(res.data.content);
        }
      } catch (error) {
        setCurrentSummary(null);
        console.error("Failed to fetch videos:", error);
      } finally {
        setLoadingCurrentSummary(false);
      }
    };

    const generateKeyConcepts = async () => {
      try {
        const res = await makeRequest.post("/api/youtube/gemini-key-concepts", {
          transcript: currentVideoTranscript,
          video: currentVideo,
        });
        if (res.status === 200) {
          setCurrentKeyConcepts(res.data.content);
        }
      } catch (error) {
        setCurrentKeyConcepts(null);
        console.error("Failed to fetch key concepts:", error);
      } finally {
        setLoadingCurrentKeyConcepts(false);
      }
    };

    if (currentUser && currentVideoTranscript) {
      generateSummary();
      generateKeyConcepts();
    }
  }, [currentVideoTranscript]);

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
      className={`${
        playerState !== "sm" && "overflow-scroll"
      } relative flex flex-col sm:flex-row w-[100%] h-[100%] min-h-[700px]`}
      style={{ backgroundColor: appTheme[currentUser.theme].background_1 }}
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
          className="z-[600] cursor-pointer dim hover:brightness-75 absolute top-[-20px] left-[-20px] rounded-full w-[40px] h-[40px] flex justify-center items-center"
        >
          <LuSquareArrowOutUpLeft
            className="w-[20px] h-[20px]"
            style={{
              color: appTheme[currentUser.theme].text_1,
            }}
          />
        </div>
      )}
      {playerState === "sm" && (
        <div
          style={{
            backgroundColor: appTheme[currentUser.theme].background_1,
            border: `1px solid ${appTheme[currentUser.theme].background_2}`,
          }}
          onClick={() => {
            setPlayerState("hidden");
            pauseVideo();
          }}
          className="z-[600] cursor-pointer dim hover:brightness-75 absolute top-[27px] left-[-20px] rounded-full w-[40px] h-[40px] flex justify-center items-center"
        >
          <ChevronDown
            className="mt-[1px] ml-[1px] w-[29x] h-[29px]"
            style={{
              color: appTheme[currentUser.theme].text_1,
            }}
          />
        </div>
      )}
      <div
        style={{
          width:
            playerState === "sm" || (windowWidth !== null && windowWidth < 640)
              ? "100%"
              : `${dividerPercent}%`,
        }}
        className={`relative h-[100%] min-h-[100%] ${
          playerState === "sm" ? "overflow-hidden" : "overflow-scroll"
        }`}
      >
        <div className="flex flex-col w-[100%] h-[100%]">
          <YouTubePlayer />
          <YoutubePlayerData />
          <div
            className="sm:hidden w-[calc(100%-24px)] ml-[12px] px-[4px] h-[37px] min-h-[37px] rounded-[6px] flex flex-row items-center justify-center"
            style={{ background: appTheme[currentUser.theme].background_2 }}
          >
            {["Summary", "Study Tools"].map((tool: string, index: number) => {
              return (
                <div
                  key={index}
                  className="group flex flex-row w-[50%] h-[30px] relative"
                >
                  <div
                    style={{
                      backgroundColor:
                        (tool === "Summary" && showPrimaryTools) ||
                        (tool === "Study Tools" && !showPrimaryTools)
                          ? appTheme[currentUser.theme].background_1
                          : appTheme[currentUser.theme].background_2,
                    }}
                    className={`cursor-pointer w-[100%] h-[100%] rounded-[5px] flex justify-center items-center text-[calc(10px+0.2vw)]`}
                    onClick={() => {
                      if (tool === "Summary") setShowPrimaryTools(true);
                      if (tool === "Study Tools") setShowPrimaryTools(false);
                    }}
                  >
                    <p className="dim group-hover:brightness-75">{tool}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={`${!showPrimaryTools && "hidden sm:flex"}`}>
            <PrimaryTools />
          </div>

          <div
            className={`${showPrimaryTools ? "hidden" : "sm:hidden"} h-[100%]`}
          >
            <StudyTools />
          </div>
        </div>
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

      <div
        style={
          {
            "--max-width": `calc(100% - ${dividerPercent}%)`,
          } as React.CSSProperties
        }
        className={`hidden sm:flex flex-grow max-w-[100%] sm:max-w-[var(--max-width)] ${
          playerState === "sm" && "w-0"
        }`}
      >
        <StudyTools />
      </div>
    </div>
  );
};

export default Player;
