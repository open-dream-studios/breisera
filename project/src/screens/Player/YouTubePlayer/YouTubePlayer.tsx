"use client";
import { useVideo } from "@/contexts/videoContext";

const YouTubePlayer = () => {
  const { currentVideo } = useVideo();
  if (currentVideo === null) return;

  return (
    <div className="aspect-[16/9] w-full bg-black flex items-center justify-center">
      <iframe
        src={`https://www.youtube.com/embed/${currentVideo.id}?start=0`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ width: "100%", height: "100%", border: "none" }}
      />
    </div>
  );
};

export default YouTubePlayer;
