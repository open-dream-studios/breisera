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
import { useVideo } from "@/contexts/videoContext";
import { FRONTEND_URL } from "@/util/config";

const LeftBar = () => {
  const { currentVideo, setCurrentVideo, setPlayerState } = useVideo();
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

  const toggleLeftBar = () => {
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

  const handleVid = () => {
    const vid = {
      kind: "youtube#video",
      etag: "5nNyEW9Zg9sDPP8yn7SSmlkYAus",
      id: "JfbnpYLe3Ms",
      snippet: {
        publishedAt: "2022-10-18T18:14:24Z",
        channelId: "UCb8vrqP8Z7Oz9ZTYvUtjUHQ",
        title: "If Cleaning Was a Timed Sport. Part 2",
        description:
          "Watch behind the scenes here: https://www.youtube.com/watch?v=bly0QlqqDek\n" +
          "\n" +
          "My other socials: https://linktr.ee/DanielLaBelle",
        thumbnails: [Object],
        channelTitle: "Daniel LaBelle",
        tags: [Array],
        categoryId: "23",
        liveBroadcastContent: "none",
        localized: [Object],
        defaultAudioLanguage: "en-US",
      },
      contentDetails: {
        duration: "PT37S",
        dimension: "2d",
        definition: "hd",
        caption: "false",
        licensedContent: true,
        contentRating: {},
        projection: "rectangular",
      },
      statistics: {
        viewCount: "1686300140",
        likeCount: "39344147",
        favoriteCount: "0",
        commentCount: "144942",
      },
      channelInfo: {
        title: "Daniel LaBelle",
        thumbnail:
          "https://yt3.ggpht.com/mtLBECHLKLPzfFu7admDqPxSpc1dWIgkJG7jVmQwVuEdpDxQ3_u1ijNwySCVlgkkay-aiFcBrs4=s88-c-k-c0x00ffffff-no-rj",
        subs: "35000000",
      },
    };
    setCurrentVideo(vid);
    setPlayerState("screen");
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
          <div className="w-[100%] px-[20px] pt-[10px] relative flex items-start">
            {currentVideo !== null && (
              <Link
                href={`${FRONTEND_URL}/www.youtube.com/watch?v=${currentVideo.id}`}
                className="dim hover:brightness-75 cursor-pointer w-[100%] flex justify-between rounded-[5px] px-[12px] py-[10px]"
                style={{
                  backgroundColor: appTheme[currentUser.theme].background_2,
                  color: appTheme[currentUser.theme].text_1,
                }}
              >
                <p>Current Video</p>
                {/* <img
                  alt=""
                  className="w-[30%] aspect-[16/9] object-cover"
                  src={currentVideo.snippet.thumbnails.standard.url}
                /> */}
              </Link>
            )}
          </div>

          <div
            onClick={handleVid}
            className="dim select-none cursor-pointer w-[80%] hover:brightness-75 h-[40px] absolute bottom-[70px] flex items-center justify-center font-[600]"
            style={{
              borderRadius: "6px",
              backgroundColor: appTheme[currentUser.theme].background_2,
              color: appTheme[currentUser.theme].text_2,
            }}
          >
            Set Video
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
            onClick={toggleLeftBar}
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
