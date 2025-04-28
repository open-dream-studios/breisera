"use client";
import { showToast } from "@/components/CustomToast";
import { AuthContext } from "@/contexts/authContext";
import { useContextQueries } from "@/contexts/queryContext";
import { useVideo } from "@/contexts/videoContext";
import { useModal2Store } from "@/store/useModalStore";
import { appTheme, appTextSizes } from "@/util/appTheme";
import { BACKEND_URL } from "@/util/config";
import { openWindow } from "@/util/functions/AppFunctions";
import { formatSubs } from "@/util/functions/YouTubeData";
import Modal2Continue from "@/util/modals/Modal2Continue";
import React, { useContext, useEffect, useRef, useState } from "react";
import { RxCopy } from "react-icons/rx";
import { TfiDownload } from "react-icons/tfi";
import { LuLibrary } from "react-icons/lu";
import { FaLink } from "react-icons/fa6";
import { FaPlus } from "react-icons/fa6";
import { RxCheck } from "react-icons/rx";
import { makeRequest } from "@/util/axios";
import { useQueryClient } from "@tanstack/react-query";
import { IoCloseOutline } from "react-icons/io5";
import { io } from "socket.io-client";

const socket = io(BACKEND_URL);

const smoothScrollTo = (element: HTMLElement, targetPosition: number) => {
  const startPosition = element.scrollTop;
  const distance = targetPosition - startPosition;
  const startTime = performance.now();
  const duration = 1200;

  function animateScroll(currentTime: number) {
    const elapsedTime = currentTime - startTime;
    const progress = Math.min(elapsedTime / duration, 1);
    const ease = easeInOutQuad(progress);

    element.scrollTop = startPosition + distance * ease;

    if (progress < 1) {
      requestAnimationFrame(animateScroll);
    }
  }

  function easeInOutQuad(t: number) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  requestAnimationFrame(animateScroll);
};

type ChildProps = {
  libraryButtonRef: React.RefObject<HTMLButtonElement | null>;
};

function CollectionsPopup({ libraryButtonRef }: ChildProps) {
  const { currentUser } = useContext(AuthContext);
  const { currentVideo, setAddToLibraryVisible } = useVideo();
  const queryClient = useQueryClient();
  const {
    videoCollectionsData,
    updateVideoCollections,
    videoCollectionData,
    updateVideoCollection,
  } = useContextQueries();
  const popupRef = useRef<HTMLDivElement>(null);
  const saveToCollectionsPopupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(event: any) {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target) &&
        libraryButtonRef.current &&
        !libraryButtonRef.current.contains(event.target)
      ) {
        console.log("neither");
        setAddToLibraryVisible(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, []);

  const handleSaveVideo = (
    collection_id: string | null,
    collection_name: string
  ) => {
    if (currentVideo) {
      updateVideoCollections(currentVideo, collection_id, collection_name);
    }
  };

  const handleCollectionClick = (collection: any) => {
    handleSaveVideo(collection.collection_id, collection.collection_name);
  };

  const handleAddCollection = async () => {
    await updateVideoCollection(null, "New");
    queryClient.invalidateQueries({
      queryKey: ["video-collections"],
      refetchType: "active",
    });
    if (saveToCollectionsPopupRef.current) {
      smoothScrollTo(
        saveToCollectionsPopupRef.current,
        saveToCollectionsPopupRef.current.scrollHeight
      );
    }
  };

  const handleRemoveSavedVideo = async (collection: any) => {
    if (!currentVideo) return;
    const res = await makeRequest.post("/api/users/delete-video-collections", {
      collection_id: collection.collection_id,
      video_id: currentVideo.id,
    });
    queryClient.invalidateQueries({
      queryKey: ["video-collections"],
      refetchType: "active",
    });
    if (res.status === 200) {
      showToast("Video removed from collection", "success");
    }
  };

  if (!currentUser || !currentVideo) return <></>;

  return (
    <div
      ref={popupRef}
      style={{
        backgroundColor: appTheme[currentUser.theme].background_1,
        border: `1px solid ${appTheme[currentUser.theme].background_2}`,
      }}
      className="z-[503] p-[10px] pt-[18px] max-h-[360px] min-h-[200px] w-[300px] absolute right-[38px] bottom-[calc(100%+10px)] rounded-2xl shadow-x flex flex-col"
    >
      <div ref={saveToCollectionsPopupRef} className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-3 gap-[10px]">
          {videoCollectionData &&
            videoCollectionData.length > 0 &&
            videoCollectionData.map((collection: any, index: number) => {
              // if (!videoCollectionData) return
              const collectionIndex = videoCollectionsData.findIndex(
                (item) => item.collection_id === collection.collection_id
              );

              if (
                collectionIndex !== -1 &&
                videoCollectionsData[collectionIndex].videos.findIndex(
                  (item: any) => item.id === currentVideo.id
                ) !== -1
              ) {
                return (
                  <div
                    key={index}
                    className="brightness-[76%] flex flex-col gap-[6px] overflow-hidden items-center justify-center aspect-square"
                  >
                    <div
                      style={{
                        backgroundColor:
                          appTheme[currentUser.theme].background_2,
                      }}
                      className="relative cursor-pointer group aspect-[1/1] rounded-[5px] overflow-hidden w-[65%] flex justify-center items-center"
                      onClick={() => handleRemoveSavedVideo(collection)}
                    >
                      <RxCheck
                        className="z-[502] w-[35px] h-[35px] group-hover:hidden"
                        style={{ color: appTheme[currentUser.theme].text_4 }}
                      />
                      <IoCloseOutline
                        className="z-[502] ml-[1px] w-[38px] h-[38px] hidden group-hover:block"
                        style={{ color: appTheme[currentUser.theme].text_4 }}
                      />
                      {videoCollectionsData[collectionIndex].videos &&
                        videoCollectionsData[collectionIndex].videos.length >
                          0 && (
                          <img
                            className="opacity-25 z-[501] w-[100%] h-[140%] absolute object-cover"
                            src={
                              videoCollectionsData[collectionIndex].videos[0]
                                .snippet.thumbnails.high.url
                            }
                            alt="collection thumbnails"
                          />
                        )}
                    </div>

                    <div className="opacity-50 max-w-[85%] text-[14px] leading-[14px] font-[300] truncate overflow-hidden">
                      {collection.collection_name}
                    </div>
                  </div>
                );
              } else {
                return (
                  <div
                    key={index}
                    className="hover:brightness-75 dim cursor-pointer flex flex-col gap-[6px] overflow-hidden items-center justify-center aspect-square"
                    onClick={() => {
                      handleCollectionClick(collection);
                    }}
                  >
                    <div
                      style={{
                        backgroundColor:
                          appTheme[currentUser.theme].background_2,
                      }}
                      className="relative aspect-[1/1] rounded-[5px] w-[65%] flex justify-center items-center overflow-hidden"
                    >
                      <FaPlus
                        className="w-[25px] h-[25px]"
                        style={{ color: appTheme[currentUser.theme].text_4 }}
                      />
                      {collectionIndex !== -1 &&
                        videoCollectionsData[collectionIndex].videos &&
                        videoCollectionsData[collectionIndex].videos.length >
                          0 && (
                          <img
                            className="opacity-25 z-[501] w-[100%] h-[140%] absolute object-cover"
                            src={
                              videoCollectionsData[collectionIndex].videos[0]
                                .snippet.thumbnails.high.url
                            }
                            alt="collection thumbnails"
                          />
                        )}
                    </div>
                    <div className="max-w-[85%] text-[14px] leading-[14px] font-[300] truncate overflow-hidden">
                      {collection.collection_name}
                    </div>
                  </div>
                );
              }
            })}
        </div>
      </div>

      <div className="flex justify-center mt-[10px]">
        <div
          style={{
            backgroundColor: appTheme[currentUser.theme].background_2,
            color: appTheme[currentUser.theme].text_1,
          }}
          className="flex items-center justify-center cursor-pointer hover:brightness-75 dim w-[100px] h-[30px] rounded-[20px] text-[15px] leading-[15px] font-[400]"
          onClick={handleAddCollection}
        >
          Add
        </div>
      </div>
    </div>
  );
}

const YoutubePlayerData = () => {
  const { currentUser } = useContext(AuthContext);
  const {
    currentVideo,
    theaterMode,
    setTheaterMode,
    addToLibraryVisible,
    setAddToLibraryVisible,
  } = useVideo();
  const modal2 = useModal2Store((state: any) => state.modal2);
  const setModal2 = useModal2Store((state: any) => state.setModal2);

  const [loading, setLoading] = useState<boolean>(false);
  const [start, setStart] = useState<string>("00:00");
  const [end, setEnd] = useState<string>("00:40");

  const libraryButtonRef = useRef<HTMLButtonElement>(null);

  // const handleDownload = async () => {
  //   if (!currentVideo) return;
  //   setLoading(true);
  //   showToast("Downloading...", "success");
  //   const video_name = `video-${Date.now()}.mp4`;
  //   try {
  //     const response = await fetch(`${BACKEND_URL}/create-video`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         link: `https://www.youtube.com/watch?v=${currentVideo.id}`,
  //         start: start,
  //         end: end,
  //         video_name: video_name,
  //       }),
  //     });
  //     const responseData = await response.json();
  //     if (response.status === 200) {
  //       showToast("Downloaded!", "success");

  //       const res = await fetch(
  //         `${BACKEND_URL}/get-download-link?videoName=${encodeURIComponent(
  //           video_name
  //         )}`
  //       );
  //       const data = await res.json();
  //       if (data.url) {
  //         console.log(data.url);
  //         openWindow(data.url);
  //       } else {
  //         console.error("Failed to get download URL");
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Error downloading the video:", error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const handleDownload = async () => {
  //   if (!currentVideo) return;
  //   setLoading(true);
  //   showToast("Processing video...", "success");

  //   const video_name = `video-${Date.now()}.mp4`;

  //   try {
  //     const response = await fetch(`${BACKEND_URL}/create-video`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         link: `https://www.youtube.com/watch?v=${currentVideo.id}`,
  //         start,
  //         end,
  //         video_name,
  //       }),
  //     });

  //     const responseData = await response.json();
  //     if (response.status === 202) {
  //       const { video_name } = responseData;

  //       // Polling
  //       let attempts = 0;
  //       const maxAttempts = 30; // e.g., try for 30 seconds
  //       const pollInterval = 1000; // 1 second

  //       const poll = setInterval(async () => {
  //         attempts++;

  //         const checkRes = await fetch(
  //           `${BACKEND_URL}/check-video-status?videoName=${encodeURIComponent(
  //             video_name
  //           )}`
  //         );
  //         const checkData = await checkRes.json();

  //         if (checkData.ready) {
  //           clearInterval(poll);

  //           const res = await fetch(
  //             `${BACKEND_URL}/get-download-link?videoName=${encodeURIComponent(
  //               video_name
  //             )}`
  //           );
  //           const data = await res.json();
  //           if (data.url) {
  //             // openWindow(data.url);
  //             const link = document.createElement("a");
  //             link.href = data.url;
  //             link.download = video_name;
  //             document.body.appendChild(link);
  //             link.click();
  //             document.body.removeChild(link);

  //             showToast("Download Ready!", "success");

  //             const deleteVideo = await fetch(
  //               `${BACKEND_URL}/delete-download?videoName=${encodeURIComponent(
  //                 video_name
  //               )}`,
  //               {
  //                 method: "GET",
  //               }
  //             );

  //             const deletionData = await deleteVideo.json();

  //             if (deletionData.success) {
  //               console.log("Video deleted successfully");
  //             } else {
  //               console.error("Failed to delete video");
  //             }
  //           } else {
  //             showToast("Failed to get download URL", "error");
  //           }
  //         } else if (attempts >= maxAttempts) {
  //           clearInterval(poll);
  //           showToast("Video processing timed out", "error");
  //         }
  //       }, pollInterval);
  //     }
  //   } catch (error) {
  //     console.error("Error downloading the video:", error);
  //     showToast("Error processing video", "error");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const handleDownload = async () => {
  //   if (!currentVideo) return;
  //   setLoading(true);
  //   showToast("Processing video...", "success");

  //   const video_name = `video-${Date.now()}.mp4`;

  //   // Listen for the 'video-ready' event once
  //   socket.once("video-ready", async (data) => {
  //     console.log("Received video-ready event:", data);

  //     const link = document.createElement("a");
  //     link.href = data.download_url;
  //     link.download = data.video_name;
  //     document.body.appendChild(link);
  //     link.click();
  //     document.body.removeChild(link);

  //     showToast("Download Ready!", "success");

  //     // Optionally: Tell backend to delete file after download
  //     await fetch(
  //       `${BACKEND_URL}/delete-download?videoName=${encodeURIComponent(
  //         data.video_name
  //       )}`,
  //       {
  //         method: "GET",
  //       }
  //     );
  //   });

  //   try {
  //     const response = await fetch(`${BACKEND_URL}/create-video`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         link: `https://www.youtube.com/watch?v=${currentVideo.id}`,
  //         start,
  //         end,
  //         video_name,
  //         socketId: socket.id,
  //       }),
  //     });

  //     const responseData = await response.json();
  //     if (response.status === 202) {
  //       console.log("Waiting for video to be ready...");
  //     }
  //   } catch (error) {
  //     console.error("Error downloading the video:", error);
  //     showToast("Error processing video", "error");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleDownload = async () => {
    if (!currentVideo) return;
    setLoading(true);
    showToast("Processing video...", "success");

    const video_name = `video-${Date.now()}-${Math.floor(
      Math.random() * 10000
    )}.mp4`;

    // Make sure socket is connected before using socket.id
    if (!socket.connected) {
      await new Promise<void>((resolve) => {
        socket.once("connect", resolve);
      });
    }

    socket.once("video-ready", async (data) => {
      console.log(data.download_url)
      const link = document.createElement("a");
      link.href = data.download_url;
      link.download = data.video_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast("Download Ready!", "success");

      await fetch(
        `${BACKEND_URL}/delete-download?videoName=${encodeURIComponent(
          data.video_name
        )}`,
        {
          method: "GET",
        }
      );
    });

    try {
      const response = await fetch(`${BACKEND_URL}/create-video`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          link: `https://www.youtube.com/watch?v=${currentVideo.id}`,
          start,
          end,
          video_name,
          socketId: socket.id,
        }),
      });

      const responseData = await response.json();
      if (response.status === 202) {
        console.log("Waiting for video to be ready...");
      }
    } catch (error) {
      console.error("Error downloading the video:", error);
      showToast("Error processing video", "error");
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
    <div className="w-[100%] px-[16px] pt-[12px] pb-[18px] md:pb-[2px]">
      <div className={`font-[600] ${appTextSizes.textHead1}`}>
        {currentVideo.snippet.title}
      </div>

      <div className="w-[100%] flex flex-row justify-between items-start mt-[10px] relative">
        {addToLibraryVisible && (
          <CollectionsPopup libraryButtonRef={libraryButtonRef} />
        )}
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
        <div className="flex flex-col gap-[8px] items-end">
          <div className="flex flex-row gap-[8px]">
            <button
              ref={libraryButtonRef}
              disabled={loading}
              onClick={() => {
                setAddToLibraryVisible(true);
              }}
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
              <LuLibrary className="w-[19px] h-[19px]" />
            </button>

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
              <FaLink className="w-[18px] h-[18px] opacity-[91%] mt-[0.5px]" />
            </div>
          </div>
          <button
            disabled={loading}
            onClick={() => {
              setTheaterMode((prev) => !prev);
            }}
            className="hidden md:flex flex-col h-[34px] pb-[1px] w-[65px] rounded-[11px] cursor-pointer hover:brightness-75 dim text-[15px] leading-[15px] items-center justify-center"
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
            {theaterMode ? (
              <div
                style={{
                  border: `${
                    currentUser.theme === "dark" ? "0.5px" : "1px"
                  } solid ${appTheme[currentUser.theme].text_3}`,
                  borderBottom: `${
                    currentUser.theme === "dark" ? "0.5px" : "1px"
                  } solid ${appTheme[currentUser.theme].text_3}`,
                }}
                className="w-[33px] h-[18px] rounded-[2px] mt-[0.5px] relative"
              >
                <div
                  style={{
                    backgroundColor: appTheme[currentUser.theme].text_3,
                  }}
                  className={`opacity-90 ${
                    currentUser.theme === "dark"
                      ? "w-[0.5px] h-[12px] "
                      : "w-[1px] h-[11px]"
                  } absolute right-[6px]`}
                />
                <div
                  style={{
                    backgroundColor: appTheme[currentUser.theme].text_3,
                  }}
                  className={`opacity-90 ${
                    currentUser.theme === "dark"
                      ? "h-[0.5px] w-[26px]"
                      : "h-[1px] w-[25px]"
                  } absolute left-0 bottom-[5px]`}
                />
              </div>
            ) : (
              <div
                style={{
                  border: `${
                    currentUser.theme === "dark" ? "0.5px" : "1px"
                  } solid ${appTheme[currentUser.theme].text_3}`,
                  borderBottom: `${
                    currentUser.theme === "dark" ? "1.5px" : "2px"
                  } solid ${appTheme[currentUser.theme].text_3}`,
                }}
                className="w-[33px] h-[18px] rounded-[2px] mt-[0.5px]"
              />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default YoutubePlayerData;
