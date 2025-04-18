import axios from "axios";
import dotenv from "dotenv";
import { YoutubeTranscript } from "youtube-transcript";

import { OpenAI } from "openai";
import ytdl from "@distube/ytdl-core";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

import { createClient } from "@supabase/supabase-js";

dotenv.config();

export const youtubeSearch = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not authenticated!");

  try {
    // Step 1: Search for video IDs
    const searchRes = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: {
          part: "snippet",
          maxResults: 1,
          order: "viewCount",
          q: req.body.query,
          type: "video",
          regionCode: "US",
          key: process.env.YOUTUBE_PUBLIC_KEY,
        },
      }
    );

    const videoItems = searchRes.data.items;
    const videoIds = videoItems.map((item) => item.id.videoId).join(",");

    // Step 2: Get video details
    const detailsRes = await axios.get(
      "https://www.googleapis.com/youtube/v3/videos",
      {
        params: {
          part: "snippet,statistics,contentDetails",
          id: videoIds,
          key: process.env.YOUTUBE_PUBLIC_KEY,
        },
      }
    );

    const videos = detailsRes.data.items;

    // Step 3: Get channel info (batch by unique channelIds)
    const uniqueChannelIds = [
      ...new Set(videos.map((video) => video.snippet.channelId)),
    ].join(",");

    const channelsRes = await axios.get(
      "https://www.googleapis.com/youtube/v3/channels",
      {
        params: {
          part: "snippet,statistics",
          id: uniqueChannelIds,
          key: process.env.YOUTUBE_PUBLIC_KEY,
        },
      }
    );

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

export const getYoutubeTranscript = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not authenticated!");

  const { videoId } = req.body;
  if (!videoId) return res.status(400).json("Missing video ID");

  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    storeTranscriptEmbeddings(videoId, transcript);
    
    res.json({ transcript });
  } catch (error) {
    console.error("Transcript error:", error.message);
    res.status(404).json({ error: "Transcript not available" });
  }
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateYoutubeTranscript = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not authenticated!");

  const { videoId } = req.body;
  if (!videoId) return res.status(400).json("Missing video ID");

  const tempFileName = `audio-${uuidv4()}.mp3`;
  const tempFilePath = path.join("/tmp", tempFileName);

  try {
    // 1. Download and convert YouTube audio to MP3
    await new Promise((resolve, reject) => {
      const stream = ytdl(`https://www.youtube.com/watch?v=${videoId}`, {
        quality: "highestaudio",
      });

      ffmpeg(stream)
        .audioBitrate(128)
        .format("mp3")
        .save(tempFilePath)
        .on("end", resolve)
        .on("error", reject);
    });

    // 2. Send audio to Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempFilePath),
      model: "whisper-1",
      response_format: "verbose_json",
      timestamp_granularities: ["segment"],
    });

    fs.unlinkSync(tempFilePath); // clean up

    const segments = transcription.segments || [];

    // 3. Format to match your required output
    const formatted = segments.map((seg) => ({
      text: seg.text.trim(),
      offset: Number(seg.start.toFixed(2)),
      duration: Number((seg.end - seg.start).toFixed(2)),
      lang: "en",
    }));

    // 4. Chunk the results in groups of 100
    res.json(formatted)
    // const chunked = [];
    // for (let i = 0; i < formatted.length; i += 100) {
    //   chunked.push(formatted.slice(i, i + 100));
    // }

    // res.json(chunked);
  } catch (error) {
    console.error("Whisper error:", error.message);
    res.status(500).json({ error: "Whisper transcription failed" });
  }
};

// 1) How to handle long transcripts with token limits?

// Whisper transcripts for long videos can easily exceed 100k tokens — way beyond the limits of GPT-4 (which is ~128k with the turbo variant, but still limited and expensive). Here are strategies:

// ✅ Chunking + Smart Summarization

// Step 1: Chunk the transcript into manageable pieces (which you’re already doing — nice!).

// Step 2: Summarize each chunk individually using GPT. Then summarize those summaries into a final one — this is called map-reduce summarization.
// 	•	Map step: Summarize each chunk (100 items or ~3–5 min of content).
// 	•	Reduce step: Combine those summaries into a global summary.

// You can use the same idea for semantic embedding, flashcard generation, or context retrieval later.

// ⸻

// 2) How to answer dynamic questions about a long video (with timestamps)?

// This is where retrieval-augmented generation (RAG) comes in.

// ✅ Use embeddings + vector search

// Here’s how:
// 	1.	Embed the transcript segments (chunks of ~100 tokens) using OpenAI Embeddings or something like all-MiniLM if you’re budget-conscious.
// 	2.	Store them in a vector database (e.g. Pinecone, Weaviate, Supabase pgvector, or Qdrant).
// 	3.	When a user asks a question, you:
// 	•	Embed their question
// 	•	Search your vector DB for the most relevant segments
// 	•	Grab those relevant chunks (with timestamps!)
// 	•	Feed those as context into the GPT prompt (plus the user’s question)

// 💡 Bonus: In your response, you can show “Referenced at 1:32:45” by using the offset from the matched transcript chunks.

// ⸻

// ✅ Optional: Add context window smarts

// If the query is about a specific time range (e.g. “What happened between 20:00 and 40:00?”), you can pre-filter the chunks by offset and then do semantic search. Mix time and meaning.

// ⸻

// 🔁 Reusability

// You’ll want to cache all this:
// 	•	Store transcript chunks + embeddings on first load
// 	•	Store generated summaries and flashcards per video
// 	•	Let AI chat retrieve from those dynamically

// ⸻

// Want a quick roadmap?
// 	1.	✅ You already have transcript chunking and Whisper support.
// 	2.	🔜 Embed each chunk + store in vector DB.
// 	3.	🔜 Build an endpoint for search by embedding similarity.
// 	4.	🔜 Create a GPT prompt like:
// “Answer the question using the transcript chunks below. Be concise. Include timestamps where possible.”
// 	5.	🔜 Use this for chat, summary, and flashcard prompts.

// ⸻

// Let me know if you want help wiring up:
// 	•	Embeddings with Supabase or Pinecone
// 	•	GPT prompt examples for summarizing or QA
// 	•	Frontend flow ideas

// You’re really close to something amazing.

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function storeTranscriptEmbeddings(videoId, chunks) {
  console.log("embedding...");

  // 1. Prepare inputs for batch
  const inputs = chunks.map(chunk => chunk.text.slice(0, 1000));

  // 2. Batch embed all inputs
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: inputs,
  });

  // 3. Prepare all rows for bulk insert
  const rows = chunks.map((chunk, i) => ({
    video_id: videoId,
    text: chunk.text,
    time_offset: chunk.offset,
    duration: chunk.duration,
    embedding: response.data[i].embedding,
  }));

  // 4. Bulk insert into Supabase
  const { error } = await supabase
    .from("transcript_chunks")
    .insert(rows);

  if (error) {
    console.error("❌ Supabase insert error:", error);
    throw error;
  }

  console.log("✅ All chunks embedded and stored for", videoId);
}

// async function searchTranscript(videoId: string, query: string, topK = 5) {
//   const embeddingResponse = await openai.embeddings.create({
//     model: "text-embedding-3-small",
//     input: query,
//   });

//   const [{ embedding }] = embeddingResponse.data;

//   const { data, error } = await supabase.rpc("match_transcript_chunks", {
//     query_embedding: embedding,
//     match_threshold: 0.75, // cosine similarity
//     match_count: topK,
//     video_id: videoId,
//   });

//   if (error) throw error;
//   return data;
// }
