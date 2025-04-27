"use client";
import { useVideo, YouTubePlayerVideo } from "@/contexts/videoContext";
import YouTube, { YouTubePlayer as YTPlayerType } from "react-youtube";
import { useEffect, useRef, useState } from "react";
import { useContextQueries } from "@/contexts/queryContext";

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

export const playVideo = () => {
  if (playerRef) {
    playerRef.playVideo();
  }
};

const YouTubePlayer = () => {
  const { currentVideo, addToLibraryVisible } = useVideo();
  const { updateRecentVideo, recentVideosData } = useContextQueries();
  const playerWrapperRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);

  const onPlayerReady = (event: any) => {
    playerRef = event.target;
    if (recentVideosData && currentVideo) {
      const foundIndex = recentVideosData.findIndex(
        (video: YouTubePlayerVideo) => video.video_data.id === currentVideo.id
      );
      if (foundIndex !== -1) {
        if (recentVideosData[foundIndex].last_timestamp) {
          setStartTime(recentVideosData[foundIndex].last_timestamp);
        } else {
          setStartTime(0);
        }
      } else {
        setStartTime(0);
      }
    }
    updateRecent();
  };

  const updateRecent = () => {
    if (playerRef && currentVideo) {
      const currentVideoCopy = currentVideo;
      currentVideoCopy.last_timestamp = playerRef.getCurrentTime().toFixed(2);
      updateRecentVideo(currentVideoCopy);
    }
  };

  const startInterval = () => {
    if (!intervalRef.current) {
      intervalRef.current = setInterval(() => {
        updateRecent();
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

    return () => stopInterval();
  }, [isPlaying]);

  if (!currentVideo) return null;

  return (
    <div className="z-[500] relative aspect-[16/9] bg-black flex items-center justify-center max-h-[600px]">
      {addToLibraryVisible && (
        <div className="z-[502] absolute top-0 left-0 w-full h-full"></div>
      )}
      <div ref={playerWrapperRef} className="z-[501] relative w-full h-full">
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
              start: startTime,
            },
          }}
          onReady={onPlayerReady}
          onStateChange={(event) => {
            const playerState = event.data;
            updateRecent();
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
