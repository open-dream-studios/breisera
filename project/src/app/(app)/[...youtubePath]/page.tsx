"use client";
import { useVideo } from "@/contexts/videoContext";
import { useEffect } from "react";

const YouTubePlayerPage = () => {
  const { setPlayerState } = useVideo();
  useEffect(() => {
    setPlayerState("screen");
  }, []);
  return <></>;
};

export default YouTubePlayerPage;
