"use client";
import YouTubePlayer from "@/screens/Player/YouTubePlayer/YouTubePlayer";
import { useCurrentPlayerVideoStore } from "@/store/useCurrentPlayerVideoStore";
import { useParams } from "next/navigation";
import { useEffect } from "react";

export default function YouTubePlayerPage() {
  const params = useParams();
  const setCurrentPlayerVideo = useCurrentPlayerVideoStore(
    (state: any) => state.setCurrentPlayerVideo
  );

  useEffect(() => {
    if (
      params.youtubePath &&
      Array.isArray(params.youtubePath) &&
      params.youtubePath.length === 2
    ) {
      setCurrentPlayerVideo(params.youtubePath[1]);
    }
  }, []);

  if (
    !params.youtubePath ||
    !Array.isArray(params.youtubePath) ||
    params.youtubePath.length !== 2
  )
    return;

  return <YouTubePlayer />;
}
