import axios from "axios"
import dotenv from "dotenv";
dotenv.config();

export const youtubeSearch = async (req, res) => {
  try {
    // Step 1: Search for video IDs
    const searchRes = await axios.get("https://www.googleapis.com/youtube/v3/search", {
      params: {
        part: "snippet",
        maxResults: 50,
        order: "viewCount",
        q: req.body.query,
        type: "video",
        regionCode: "US",
        key: process.env.YOUTUBE_PUBLIC_KEY,
      },
    });

    const videoItems = searchRes.data.items;
    const videoIds = videoItems.map((item) => item.id.videoId).join(",");

    // Step 2: Get video details
    const detailsRes = await axios.get("https://www.googleapis.com/youtube/v3/videos", {
      params: {
        part: "snippet,statistics,contentDetails",
        id: videoIds,
        key: process.env.YOUTUBE_PUBLIC_KEY,
      },
    });

    const videos = detailsRes.data.items;

    // Step 3: Get channel info (batch by unique channelIds)
    const uniqueChannelIds = [...new Set(videos.map((video) => video.snippet.channelId))].join(",");

    const channelsRes = await axios.get("https://www.googleapis.com/youtube/v3/channels", {
      params: {
        part: "snippet,statistics",
        id: uniqueChannelIds,
        key: process.env.YOUTUBE_PUBLIC_KEY,
      },
    });

    const channelMap = {};
    channelsRes.data.items.forEach((channel) => {
      channelMap[channel.id] = {
        title: channel.snippet.title,
        thumbnail: channel.snippet.thumbnails.default.url,
        subs: channel.statistics.subscriberCount,
      };
    });

    // Step 4: Merge channel data into videos
    const enrichedVideos = videos.map((video) => {
      const channelId = video.snippet.channelId;
      return {
        ...video,
        channelInfo: channelMap[channelId] || {},
      };
    });

    res.json(enrichedVideos);
  } catch (err) {
    console.error("Error fetching videos:", err.message);
    res.status(500).json({ error: "Failed to fetch videos" });
  }
};