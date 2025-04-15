"use client";
import { useContext } from "react";
import { appTheme } from "../../../util/appTheme";
import { AuthContext } from "../../../contexts/authContext";
import React, { useEffect, useState } from "react";

const Explore = () => {
  const { currentUser } = useContext(AuthContext);
  if (!currentUser) return <></>;

  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_PUBLIC_KEY;

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=50&order=viewCount&q=education&type=video&regionCode=US&key=${apiKey}`
        );
        const data = await res.json();
        console.log("Raw Data:", data);
        const videoIds = data.items
          .map((item: any) => item.id.videoId)
          .join(",");

        const videoDetailsRes = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${apiKey}`
        );
        const videoDetails = await videoDetailsRes.json();
        console.log("Video Details:", videoDetails);

        setVideos(videoDetails.items);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch videos:", error);
        setLoading(false);
      }
    };

    fetchVideos();
  }, [apiKey]);

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
        <a
          key={video.id}
          href={`https://www.youtube.com/watch?v=${video.id}`}
          target="_blank"
          rel="noopener noreferrer"
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
          <img
            src={video.snippet.thumbnails.medium.url}
            alt={video.snippet.title}
            style={{ width: "100%", height: "auto" }}
          />
          <div style={{ padding: "8px" }}>
            <h4 style={{ fontSize: "14px", marginBottom: "4px" }}>
              {video.snippet.title}
            </h4>
            <p style={{ fontSize: "12px", color: "#666" }}>
              {video.snippet.channelTitle}
            </p>
          </div>
        </a>
      ))}
    </div>
  );
};

export default Explore;
