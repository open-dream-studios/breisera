"use client";
import { useVideo } from "@/contexts/videoContext";
import YouTube, { YouTubePlayer as YTPlayerType } from "react-youtube";

let playerRef: YTPlayerType | null = null;
export const setVideoTime = (time: number) => {
  if (playerRef) {
    playerRef.seekTo(time, true);
  }
};

export const getVideoTime = () => {
  if (playerRef) {
    return playerRef.getCurrentTime()
  }
  return null
};

const YouTubePlayer = () => {
  const { currentVideo } = useVideo();

  if (!currentVideo) return null;

  const onReady = (event: { target: YTPlayerType }) => {
    playerRef = event.target;
  };

  return (
    <div className="aspect-[16/9] bg-black flex items-center justify-center">
      <div className="w-full h-full">
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
            },
          }}
          onReady={onReady}
        />
      </div>
    </div>
  );
};

export default YouTubePlayer;

// const YouTubePlayer = () => {
//   const { currentVideo } = useVideo();
//   if (currentVideo === null) return;

//   return (
//     <div className="aspect-[16/9] w-full bg-black flex items-center justify-center">
//       <iframe
//         src={`https://www.youtube.com/embed/${currentVideo.id}?start=0`}
//         allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
//         allowFullScreen
//         style={{ width: "100%", height: "100%", border: "none" }}
//       />
//     </div>
//   );
// };

// export default YouTubePlayer;
