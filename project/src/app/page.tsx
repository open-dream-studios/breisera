"use client";
import React, { useContext, useEffect, useState } from "react";
import { FRONTEND_URL } from "@/util/config";
import Link from "next/link";
import { useVideo, YouTubePlayerVideo } from "@/contexts/videoContext";
import { makeRequest } from "@/util/axios";
import { useContextQueries } from "@/contexts/queryContext";
import { appTheme } from "@/util/appTheme";
import { AuthContext } from "@/contexts/authContext";

const HomePage = () => {
  const { updateRecentVideo } = useContextQueries();
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

  const handleVideoClick = (video: YouTubePlayerVideo) => {
    setCurrentVideo(video);
    updateRecentVideo(video);
  };

  if (loading) return <div>Loading...</div>;

  if (!currentUser) return;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "16px",
        padding: "16px",
      }}
    >
      {exploreVideos.recommended_1.map((video) => (
        <Link
          key={video.id}
          onClick={(e) => {
            handleVideoClick(video as YouTubePlayerVideo);
          }}
          href={`${FRONTEND_URL}/www.youtube.com/watch?v=${video.id}`}
          style={{
            display: "block",
            textDecoration: "none",
            color: "inherit",
            border: "1px solid #ddd",
            borderRadius: "8px",
            overflow: "hidden",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
          className="dim hover:brightness-75"
        >
          <div>
            <img
              src={video.snippet.thumbnails.medium.url}
              alt={video.snippet.title}
              className="w-[100%] aspect-[16/9] flex object-cover"
            />
            <div className="p-[8px]">
              <h4
                style={{ color: appTheme[currentUser.theme].text_1 }}
                className="text-[14px] mb-[5px]"
              >
                {video.snippet.title}
              </h4>
              <p
                style={{ color: appTheme[currentUser.theme].text_3 }}
                className="text-[12px] mb-[10px]"
              >
                {video.snippet.channelTitle}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default HomePage;
