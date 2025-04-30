"use client";
import React, { useContext, useEffect, useState } from "react";
import { FRONTEND_URL } from "@/util/config";
import Link from "next/link";
import { useVideo, YouTubePlayerVideo } from "@/contexts/videoContext";
import { makeRequest } from "@/util/axios";
import { AuthContext } from "@/contexts/authContext";
import CustomVideoFrame from "@/components/CustomVideoFrame/CustomVideoFrame";

const HomePage = () => {
  const {
    setCurrentVideo,
    exploreVideos,
    setExploreVideos,
    playerState,
    setPlayerState,
  } = useVideo();
  const { currentUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (playerState === "screen") {
      setPlayerState("sm");
    }
  }, []);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await makeRequest.post("/api/youtube/search", {
          query: "extessy apex",
        });
        const data = res.data;
        if (Array.isArray(data)) {
          const exploreVideosCopy = exploreVideos;
          exploreVideosCopy.recommended_1 = data;
          setExploreVideos(exploreVideosCopy);
        }
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch videos:", error);
        setLoading(false);
      }
    };

    if (exploreVideos.recommended_1.length === 0) {
      setLoading(true);
      fetchVideos();
    }
  }, []);

  if (loading) return <div>Loading...</div>;

  if (!currentUser) return;

  return (
    <div className="grid grid-cols-4 gap-[16px] p-[16px]">
      {exploreVideos.recommended_1.map((video) => (
        <div
          key={video.id}
          className="dim hover:brightness-75"
        >
          <CustomVideoFrame index={1} recentVideo={video} />
        </div>
      ))}
    </div>
  );
};

export default HomePage;
