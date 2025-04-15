"use client";
import { useCurrentPlayerVideoStore } from "@/store/useCurrentPlayerVideoStore";

const YouTubePlayer = () => {
  const currentPlayerVideo = useCurrentPlayerVideoStore(
    (state: any) => state.currentPlayerVideo
  );
  if (currentPlayerVideo === null) return;

  return (
    <div className="aspect-[16/9] w-full bg-black flex items-center justify-center">
      <iframe
        src={`https://www.youtube.com/embed/${currentPlayerVideo.id}?start=${currentPlayerVideo.startTime}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ width: "100%", height: "100%", border: "none" }}
      />
    </div>
  );
};

export default YouTubePlayer;
