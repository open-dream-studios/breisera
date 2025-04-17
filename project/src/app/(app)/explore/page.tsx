"use client";
import { useContext } from "react";
import { appTheme } from "../../../util/appTheme";
import { AuthContext } from "../../../contexts/authContext";
import React, { useEffect, useState } from "react";
import { BACKEND_URL, FRONTEND_URL } from "@/util/config";
import Link from "next/link";
import { YouTubePlayerVideo } from "@/store/useCurrentPlayerVideoStore";
import { useVideo } from "@/contexts/videoContext";
import { makeRequest } from "@/util/axios";

const ExplorePage = () => {
  const { currentUser } = useContext(AuthContext);
  const { setCurrentVideo } = useVideo();
  if (!currentUser) return <></>;

  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await makeRequest.post("/api/youtube/search", {
          query: "sports",
        });
        const data = res.data;
        if (Array.isArray(data)) {
          setVideos(data);
        }
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch videos:", error);
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const handleVideoClick = (video: YouTubePlayerVideo) => {
    setCurrentVideo(video);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "16px",
        padding: "16px",
      }}
    >
      {videos.map((video) => (
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
        >
          <div>
            <img
              src={video.snippet.thumbnails.medium.url}
              alt={video.snippet.title}
              className="w-[100%] h-[100px]"
            />
            <div className="p-[8px]">
              <h4 className="text-white text-[14px] mb-[5px]">
                {video.snippet.title}
              </h4>
              <p className="text-[#666] text-[12px] mb-[10px]">
                {video.snippet.channelTitle}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default ExplorePage;
