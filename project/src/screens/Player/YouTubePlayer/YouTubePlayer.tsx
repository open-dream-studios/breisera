"use client";
import { useVideo } from "@/contexts/videoContext";
import YouTube, { YouTubePlayer as YTPlayerType } from "react-youtube";
import { useEffect, useRef, useState } from "react";
import { useContextQueries } from "@/contexts/queryContext";
import { useParams, useSearchParams } from "next/navigation";

let playerRef: YTPlayerType | null = null;

export const setVideoTime = (time: number) => {
  if (playerRef) {
    playerRef.seekTo(time, true);
  }
};

export const getVideoTime = () => {
  if (playerRef) {
    return playerRef.getCurrentTime();
  }
  return null;
};

export const pauseVideo = () => {
  if (playerRef) {
    playerRef.pauseVideo();
  }
};
const YouTubePlayer = () => {
  const { currentVideo } = useVideo();
  const { updateRecentVideo } = useContextQueries();
  const playerWrapperRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const searchParams = useSearchParams();
  const startTime = Number(searchParams.get("start")) || 0;

  const startInterval = () => {
    if (!intervalRef.current) {
      intervalRef.current = setInterval(() => {
        if (playerRef && currentVideo) {
          const currentVideoCopy = currentVideo;
          currentVideoCopy.last_timestamp = playerRef.getCurrentTime().toFixed(2);
          updateRecentVideo(currentVideoCopy);
        }
      }, 5000);
    }
  };

  const stopInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    if (isPlaying) {
      startInterval();
    } else {
      stopInterval();
    }

    return () => stopInterval(); // clean up when unmounting
  }, [isPlaying]);

  if (!currentVideo) return null;

  return (
    <div className="relative aspect-[16/9] bg-black flex items-center justify-center">
      <div ref={playerWrapperRef} className="relative w-full h-full">
        <YouTube
          videoId={currentVideo.id}
          className="w-full h-full"
          iframeClassName="w-full h-full"
          opts={{
            width: "100%",
            height: "100%",
            playerVars: {
              autoplay: 1,
              controls: 1,
              start: startTime
            },
          }}
          onReady={(event) => {
            playerRef = event.target;
          }}
          onStateChange={(event) => {
            const playerState = event.data;
            if (playerState === 1) {
              setIsPlaying(true);
            } else if (playerState === 2) {
              setIsPlaying(false);
            }
          }}
        />
      </div>
    </div>
  );
};

export default YouTubePlayer;
