"use client";
import { useEffect, RefObject, useRef, useState, useContext } from "react";
import {
  useLeftBarOpenStore,
  useLeftBarRefStore,
} from "../../store/useLeftBarOpenStore";
import { useModal2Store } from "../../store/useModalStore";
import Modal2Continue from "../../util/modals/Modal2Continue";
import { appTheme } from "../../util/appTheme";
import appDetails from "../../util/appDetails.json";
import { AuthContext } from "@/contexts/authContext";
import Link from "next/link";
import { useVideo, YouTubePlayerVideo } from "@/contexts/videoContext";
import { FRONTEND_URL } from "@/util/config";
import { LuCircleFadingPlus } from "react-icons/lu";
import { MdLibraryBooks } from "react-icons/md";
import { useContextQueries } from "@/contexts/queryContext";
import { playVideo } from "@/screens/Player/YouTubePlayer/YouTubePlayer";
import { LuPanelLeftClose } from "react-icons/lu";
import { BiWindows } from "react-icons/bi";

const LeftBar = () => {
  const {
    handleVideoClick,
    currentVideo,
    playerState,
    setCurrentVideo,
    setPlayerState,
  } = useVideo();
  const { recentVideosData } = useContextQueries();
  const { currentUser, handleLogout } = useContext(AuthContext);
  const modal2 = useModal2Store((state: any) => state.modal2);
  const setModal2 = useModal2Store((state: any) => state.setModal2);
  const leftBarRef = useRef<HTMLDivElement>(null);
  const setLeftBarRef = useLeftBarRefStore((state) => state.setLeftBarRef);
  const leftBarOpen = useLeftBarOpenStore((state: any) => state.leftBarOpen);
  const setLeftBarOpen = useLeftBarOpenStore(
    (state: any) => state.setLeftBarOpen
  );
  const [showLeftBar, setShowLeftBar] = useState<boolean>(false);
  const showLeftBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLeftBarRef(leftBarRef as RefObject<HTMLDivElement>);
  }, [setLeftBarRef, leftBarRef]);

  // Global State -> Set local state -> Trigger fade in
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (leftBarOpen) {
      setShowLeftBar(true);
    } else {
      if (showLeftBarRef.current) {
        showLeftBarRef.current.style.opacity = "0";
        showLeftBarRef.current.style.backgroundColor = "transparent";
      }
      timeout = setTimeout(() => {
        setShowLeftBar(false);
      }, 500);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [leftBarOpen]);

  // Local State -> Trigger fade out
  useEffect(() => {
    if (showLeftBar) {
      requestAnimationFrame(() => {
        if (showLeftBarRef.current) {
          showLeftBarRef.current.style.opacity = "1";
          showLeftBarRef.current.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
        }
      });
    }
  }, [showLeftBar]);

  const closeLeftBar = () => {
    if (leftBarRef && leftBarRef.current) {
      leftBarRef.current.style.transition = "right 0.3s ease-in-out";
    }
    setLeftBarOpen(false);
    setTimeout(() => {
      if (leftBarRef && leftBarRef.current) {
        leftBarRef.current.style.transition = "none";
      }
    }, 300);
  };

  const [windowWidth, setWindowWidth] = useState<number | null>(null);
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth > 1024) {
        setLeftBarOpen(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setLeftBarOpen]);
  if (windowWidth === null) return null;

  const offsetHeight =
    appDetails.left_bar_full || windowWidth < 1024 ? 0 : appDetails.nav_height;

  const handleSignOut = () => {
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
          text={
            "Sign out as " +
            currentUser.first_name +
            " " +
            currentUser.last_name +
            "?"
          }
          onContinue={handleLogout}
        />
      ),
    });
  };

  const handleLeftBarVideoClick = (video: YouTubePlayerVideo) => {
    closeLeftBar();
    handleVideoClick(video);
  };

  if (!currentUser) return;

  return (
    <>
      <div
        style={
          {
            "--left-bar-width": appDetails.left_bar_width,
            "--offset-height": `${offsetHeight}px`,
            top: `${offsetHeight}px`,
          } as React.CSSProperties
        }
        className="z-[921] pointer-events-none w-[calc(var(--left-bar-width))] h-[calc(100vh-var(--offset-height))] left-0 fixed"
      >
        <div
          ref={leftBarRef}
          style={{
            backgroundColor: appTheme[currentUser.theme].background_1,
            borderRight: `0.5px solid ${
              appTheme[currentUser.theme].background_2
            }`,
          }}
          className={`z-[951] pointer-events-auto lg:right-0 ${
            leftBarOpen ? "right-0" : "right-[100%]"
          } absolute top-0 h-[100%] w-[100%] flex justify-center
          `}
        >
          <div
            style={{
              color: appTheme[currentUser.theme].text_1,
            }}
            className="relative w-[100%] h-[100%] px-[20px] pt-[10px] items-start flex flex-col"
          >
            {playerState === "hidden" && (
              <div className="w-[100%] mt-[5px] mb-[15px]">
                <p
                  style={{
                    color: appTheme[currentUser.theme].text_3,
                  }}
                  className="font-[300] text-[15px] leading-[15px] mb-[10px]"
                >
                  Currently Watching
                </p>

                {currentVideo !== null && (
                  <div
                    className="dim hover:brightness-75 cursor-pointer w-[100%] flex justify-between items-center rounded-[8px] pr-[20px] pl-[12px] py-[7px] text-[14px] leading-[14px] font-[400]"
                    onClick={() => {
                      closeLeftBar();
                      setPlayerState("screen");
                      playVideo();
                    }}
                    style={{
                      backgroundColor: appTheme[currentUser.theme].background_2,
                    }}
                  >
                    <img
                      alt=""
                      className="w-[35%] aspect-[16/9] object-cover min-w-[35%]"
                      src={currentVideo.snippet?.thumbnails?.standard?.url}
                    />
                    <p className="pb-[2px] truncate pl-[10px]">
                      {currentVideo.snippet.title}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="w-[100%] justify-between flex flex-row items-center">
              <Link
                href="/"
                className="mt-[5px] dim hover:brightness-75 cursor-pointer w-[100%] flex gap-[7px] items-center rounded-[10px] px-[12px] py-[5px]"
                style={{
                  backgroundColor: appTheme[currentUser.theme].background_2,
                  color: appTheme[currentUser.theme].text_1,
                }}
                onClick={() => {
                  closeLeftBar();
                }}
              >
                <BiWindows className="w-[17px] h-[17px]" />
                <p>Explore</p>
              </Link>
              <LuPanelLeftClose
                style={{ color: appTheme[currentUser.theme].text_4 }}
                className="dim cursor-pointer brightness-75 hover:brightness-50 w-[24px] h-[24px] mr-[-8px] ml-[10px] mt-[3px]"
                onClick={() => {
                  closeLeftBar();
                }}
              />
            </div>

            <div
              style={{
                backgroundColor: appTheme[currentUser.theme].background_2,
              }}
              className="w-[100%] h-[1px] rounded-[1px] my-[15px]"
            ></div>

            <Link
              style={{
                color: appTheme[currentUser.theme].text_2,
              }}
              className="dim hover:brightness-75 cursor-pointer w-[100%] flex gap-[8px] items-center rounded-[10px] px-[12px] py-[5px]"
              href="/library"
              onClick={() => {
                closeLeftBar();
              }}
            >
              <MdLibraryBooks className="w-[17px] h-[17px]" />
              <p>Library</p>
            </Link>

            <div
              style={{
                color: appTheme[currentUser.theme].text_2,
              }}
              className={`relative flex flex-col w-[100%] ${
                playerState === "hidden"
                  ? "h-[calc(100%-255px)]"
                  : "h-[calc(100%-165px)]"
              }`}
            >
              <p className="mt-[20px]">Recent Videos</p>
              <div
                className="mt-[15px] h-[1px] w-[100%] rounded-[1px]"
                style={{
                  backgroundColor: appTheme[currentUser.theme].background_2,
                }}
              ></div>
              <div className="pt-[15px] w-[calc(100%+10px)] pr-[10px] h-[100%] relative overflow-y-scroll flex flex-col pb-[3px]">
                {recentVideosData &&
                  recentVideosData.length > 0 &&
                  recentVideosData.map((recent_video: any, index: number) => {
                    const video_data = recent_video.video_data;
                    return (
                      <Link
                        key={index}
                        onClick={(e) => {
                          handleLeftBarVideoClick(
                            video_data as YouTubePlayerVideo
                          );
                        }}
                        href={`${FRONTEND_URL}/www.youtube.com/watch?v=${video_data.id}`}
                        className="min-h-[25px] w-[100%] truncate my-[1.8px] dim hover:brightness-75"
                        style={{
                          color: appTheme[currentUser.theme].text_4,
                        }}
                      >
                        {video_data.snippet.title}
                      </Link>
                    );
                  })}
              </div>
            </div>
          </div>

          <div
            onClick={handleSignOut}
            className="dim select-none cursor-pointer w-[80%] hover:brightness-75 h-[40px] absolute bottom-[20px] flex items-center justify-center font-[600]"
            style={{
              borderRadius: "6px",
              backgroundColor: appTheme[currentUser.theme].background_2,
              color: appTheme[currentUser.theme].text_2,
            }}
          >
            Sign out
          </div>
        </div>
      </div>

      {showLeftBar && windowWidth !== null && (
        <div
          className={`z-[920] flex ${
            windowWidth < 1024 ? "" : "hidden"
          } w-full h-full fixed top-0 left-0`}
        >
          <div
            ref={showLeftBarRef}
            onClick={closeLeftBar}
            className="absolute top-0 left-0 w-[100vw] h-[100vh] flex items-center justify-center"
            style={{
              opacity: 0,
              transition:
                "opacity 0.5s ease-in-out, backdrop-filter 0.5s ease-in-out, -webkit-backdrop-filter 0.5s ease-in-out, background-color 0.5s ease-in-out",
            }}
          ></div>
        </div>
      )}
    </>
  );
};

export default LeftBar;
