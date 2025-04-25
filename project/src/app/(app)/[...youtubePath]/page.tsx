"use client";
import { useVideo, YouTubePlayerVideo } from "@/contexts/videoContext";
import { makeRequest } from "@/util/axios";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

const YouTubePlayerPage = () => {
  const searchParams = useSearchParams();
  const { setPlayerState, setCurrentVideo } = useVideo();

  useEffect(() => {
    const fetchVideoById = async (
      videoId: string
    ): Promise<YouTubePlayerVideo | null> => {
      try {
        const res = await makeRequest.post("/api/youtube/get-video", {
          videoId,
        });
        return res.data as YouTubePlayerVideo;
      } catch (error) {
        console.error("Error fetching video by ID:", error);
        return null;
      }
    };

    const loadVideo = async () => {
      const videoId = searchParams.get("v");
      if (videoId) {
        const newVideo = await fetchVideoById(videoId);
        setCurrentVideo(newVideo);
        setPlayerState("screen");
      }
    };

    loadVideo();
  }, []);

  return <></>;
};

export default YouTubePlayerPage;
