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
import he from "he";
import { usePython } from "../functions/python.js";
import { formatTimeStamp } from "../functions/data.js";
import fetch from "node-fetch";
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export const getVideoById = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not authenticated!");

  const { videoId } = req.body;
  if (!videoId) return res.status(400).json({ error: "No video ID provided" });

  try {
    const videoRes = await axios.get("https://www.googleapis.com/youtube/v3/videos", {
      params: {
        part: "snippet,statistics,contentDetails",
        id: videoId,
        key: process.env.YOUTUBE_PUBLIC_KEY,
      },
    });

    const video = videoRes.data.items[0];
    if (!video) return res.status(404).json({ error: "Video not found" });
    const channelId = video.snippet.channelId;
    const channelRes = await axios.get("https://www.googleapis.com/youtube/v3/channels", {
      params: {
        part: "snippet,statistics",
        id: channelId,
        key: process.env.YOUTUBE_PUBLIC_KEY,
      },
    });

    const channel = channelRes.data.items[0];

    const enrichedVideo = {
      ...video,
      channelInfo: channel
        ? {
            title: channel.snippet.title,
            thumbnail: channel.snippet.thumbnails.default.url,
            subs: channel.statistics.subscriberCount,
          }
        : {},
    };

    res.json(enrichedVideo);
  } catch (err) {
    console.error("Error fetching video by ID:", err.message);
    res.status(500).json({ error: "Failed to fetch video by ID" });
  }
};

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
          maxResults: 20,
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
  if (!token)
    return res
      .status(401)
      .json({ success: false, content: "Not authenticated!" });

  const { videoId } = req.body;
  if (!videoId)
    return res
      .status(400)
      .json({ success: false, content: "Missing video ID" });

  try {
    let transcript = await YoutubeTranscript.fetchTranscript(videoId);

    function cleanTranscript(text) {
      let cleanedText = he.decode(he.decode(text));
      // cleanedText = cleanedText
      // .replace(/\[Music\]/gi, '')                      // remove music markers
      // .replace(/\s+/g, ' ')                            // normalize whitespace
      // .replace(/(oh|dude|bro|nah|yeah|well)[,.]*/gi, '$1.')  // add breaks after common interjections
      // .replace(/([!?])\s*/g, '$1 ')
      // .replace(/([a-z])([A-Z])/g, '$1. $2')

      // cleanedText = cleanedText.replace(/\[Music\]/gi, "");
      // cleanedText = cleanedText.replace(/\[\s*__\s*\]/g, "[ __ ]");
      // cleanedText = cleanedText.replace(/\[\u00a0__\u00a0\]/g, "[ __ ]");
      return cleanedText;
    }

    transcript = transcript.map((item) => ({
      ...item,
      text: cleanTranscript(item.text),
    }));

    return res.status(200).json({ success: true, content: transcript });
  } catch (error) {
    res
      .status(200)
      .json({ success: false, content: null });
  }
};

const storeEmbeddings = async (videoId) => {
  // Check if embeddings are already stored for this video
  const { data, error } = await supabase
    .from("transcript_chunks")
    .select("video_id")
    .eq("video_id", videoId)
    .limit(1);

  if (error) {
    console.error("Supabase query error:", error.message);
    res.status(417).json({ success: false, content: "Database query error" });
  } else {
    if (data && data.length > 0) {
      // Video is in the database
      res.status(200).json({ success: true, content: "Video already in DB" });
      return;
    } else {
      // Video is not in the DB  -> Being processing
      const success = await chunkTranscriptWithSentences(transcript);
      if (success) {
        // await storeTranscriptEmbeddings(videoId, transcript);
        res.status(200).json({ success: true, content: success });
      } else {
        res.status(417).json({ success: false, error: "Processing error" });
      }
    }
  }
};

const chunkTranscriptWithSentences = async (transcriptArray) => {
  const fullTranscript = transcriptArray.map((t) => t.text).join(" ");
  // const result = await usePython(fullTranscript, "string", "transcript-processing.py");
  // console.log(result);
  // return result
  console.log(fullTranscript);

  try {
    const formattedMessage = [
      {
        role: "user",
        content:
          "Please return me a summary of what you assert takes place in this youtube video. This is a video from Extessy, playing a game of APEX Legends:" +
          fullTranscript,
      },
    ];
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      store: true,
      messages: formattedMessage,
    });
    console.log(completion.choices[0].message.content);
    return completion.choices[0].message.content;
  } catch (error) {
    console.error(error);
    return "Something went wrong...";
  }
};

// function chunkTranscriptWithSentences_old(transcriptItems) {
//   const fullText = transcriptItems.map((t) => t.text).join(" ");
//   const enc = encoding_for_model("gpt-3.5-turbo");
//   const countTokens = (text) => enc.encode(text).length;

//   const splitIntoSentences = (text) => {
//     return text
//       .replace(/\s+/g, " ")
//       .split(/(?<=[.?!])\s+(?=[A-Z])/)
//       .map((s) => s.trim())
//       .filter((s) => s.length > 0);
//   };

//   const chunkSentences = (sentences, maxTokens = 500) => {
//     const chunks = [];
//     let currentChunk = [];
//     let currentTokenCount = 0;

//     for (let sentence of sentences) {
//       const tokenCount = encode(sentence).length;

//       if (currentTokenCount + tokenCount > maxTokens) {
//         chunks.push(currentChunk.join(" "));
//         currentChunk = [sentence];
//         currentTokenCount = tokenCount;
//       } else {
//         currentChunk.push(sentence);
//         currentTokenCount += tokenCount;
//       }
//     }

//     if (currentChunk.length > 0) {
//       chunks.push(currentChunk.join(" "));
//     }

//     return chunks;
//   };

//   const sentences = splitIntoSentences(fullText);
//   const segments = chunkSentences(sentences);

//   console.log(
//     segments.map((s, i) => ({
//       segment: s,
//       index: i,
//       tokenCount: encode(s).length,
//     }))
//   );

//   // Map from sentence character indices to original transcript pieces
//   // let currentCharIndex = 0;
//   // let pointer = 0;
//   // const sentenceChunks = [];

//   // for (const segment of sentences) {
//   //   const sentenceText = segment.segment.trim();
//   //   const sentenceStart = segment.index;
//   //   const sentenceEnd = sentenceStart + sentenceText.length;

//   //   const wordsInSentence = [];
//   //   let sentenceOffset = null;
//   //   let sentenceDuration = 0;

//   //   // Gather transcript items that fall within this sentence
//   //   while (pointer < transcriptItems.length && currentCharIndex < sentenceEnd) {
//   //     const item = transcriptItems[pointer];
//   //     const itemText = item.text;
//   //     currentCharIndex += itemText.length + 1; // +1 for space

//   //     if (sentenceOffset === null) sentenceOffset = item.offset;
//   //     sentenceDuration += parseFloat(item.duration);
//   //     wordsInSentence.push(item);

//   //     pointer++;
//   //   }

//   //   sentenceChunks.push({
//   //     sentenceText,
//   //     offset: parseFloat(sentenceOffset),
//   //     duration: sentenceDuration,
//   //     originalItems: wordsInSentence,
//   //   });
//   // }

//   // // Now create 2–3 sentence sliding windows
//   // const finalChunks = [];
//   // for (let i = 0; i < sentenceChunks.length; i++) {
//   //   const window = sentenceChunks.slice(i, i + 3); // max 3 sentences
//   //   if (window.length < 2) continue; // skip if too small

//   //   const chunkText = window.map(s => s.sentenceText).join(" ");
//   //   const offset = window[0].offset;
//   //   const duration = window.reduce((sum, s) => sum + s.duration, 0);

//   //   finalChunks.push({ text: chunkText, offset, duration });
//   // }

//   // return finalChunks;
// }

export const generateYoutubeTranscript = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not authenticated!");

  const { videoId, video } = req.body;
  if (!videoId || !video) return res.status(400).json("Missing video ID");

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
    const video_prompt = `Video title: "${video.snippet.title}". Channel: "${video.snippet.channelTitle}". Description: "${video.snippet.description}}".`.slice(0, 400);
    console.log(video_prompt)
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempFilePath),
      model: "whisper-1",
      response_format: "verbose_json",
      timestamp_granularities: ["segment"],
      prompt: video_prompt
    });

    fs.unlinkSync(tempFilePath); 

    const segments = transcription.segments || [];

    // 3. Format to match your required output
    const formatted = segments.map((seg) => ({
      text: seg.text.trim(),
      offset: Number(seg.start.toFixed(2)),
      duration: Number((seg.end - seg.start).toFixed(2)),
      lang: "en",
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error("Whisper error:", error.message);
    res.status(500).json({ error: "Whisper transcription failed" });
  }
};

async function storeTranscriptEmbeddings(videoId, chunks) {
  console.log("Embedding transcript...");
  const inputs = chunks.map((chunk) => chunk.text.slice(0, 1000));
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: inputs,
  });

  // 3. Insert one-by-one using cast-friendly Supabase RPC
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = response.data[i].embedding;

    const { error } = await supabase.rpc("insert_transcript_chunk", {
      vid: videoId,
      chunk_text: chunk.text,
      time_offset: chunk.offset,
      dur: chunk.duration,
      embed: embedding, // JS array, gets cast to `vector` inside SQL function
    });

    if (error) {
      console.error(`❌ Error inserting chunk ${i}:`, error);
      throw error;
    }
  }

  console.log("✅ All chunks embedded and stored for", videoId);
}

async function embed(text) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small", // or "text-embedding-ada-002"
    input: text.slice(0, 1000),
  });
  return response.data[0].embedding;
}

export const youtubeGPT = async (req, res) => {
  const messages = req.body.messages;
  const question = messages[messages.length - 1].text;
  const videoId = req.body.videoId;

  // const { data: queryChunks, error } = await supabase.rpc(
  //   "match_transcript_chunks",
  //   {
  //     query_embedding: await embed(question), // your OpenAI embedding call
  //     match_threshold: 0.68,
  //     match_count: 15,
  //     video_id: videoId,
  //   }
  // );
  // console.log("🔍 Query Chunks:", queryChunks);

  //   const encoder = encoding_for_model(model); // "gpt-4", "gpt-3.5-turbo", etc
  //   const MAX_TOKENS = model === "gpt-4" ? 8000 : 4000;
  //   const TOKENS_FOR_COMPLETION = 1000; // you want to leave space for the AI to respond

  //   const chunksToInclude = [];
  //   let totalTokens = encoder.encode(question).length;

  //   for (const chunk of queryChunks) {
  //     const formatted = `[${formatTime(chunk.time_offset)}] ${chunk.text}`;
  //     const tokenLength = encoder.encode(formatted).length;
  //     if (totalTokens + tokenLength >= MAX_TOKENS - TOKENS_FOR_COMPLETION) break;
  //     chunksToInclude.push(formatted);
  //     totalTokens += tokenLength;
  //   }

  //   function formatTime(seconds) {
  //     const h = Math.floor(seconds / 3600)
  //       .toString()
  //       .padStart(2, "0");
  //     const m = Math.floor((seconds % 3600) / 60)
  //       .toString()
  //       .padStart(2, "0");
  //     const s = Math.floor(seconds % 60)
  //       .toString()
  //       .padStart(2, "0");
  //     return `${h}:${m}:${s}`;
  //   }

  //   const systemPrompt = `You are a helpful assistant answering questions about a YouTube video transcript.
  // Use the transcript chunks provided to answer the user’s question in detail.
  // When referencing parts of the video, include the timestamp in parentheses like (00:13:20).`;

  //   const messages = [
  //     { role: "system", content: systemPrompt },
  //     {
  //       role: "user",
  //       content: `Transcript Chunks:\n${chunksToInclude.join(
  //         "\n\n"
  //       )}\n\nQuestion: ${question}`,
  //     },
  //   ];

  //   const response = await openai.chat.completions.create({
  //     model: "gpt-4o-mini",
  //     messages,
  //     temperature: 0.7,
  //   });

  //   res.json({ answer: response.choices[0].message.content });

  const result = "hi";
  res.status(200).send(result);
};

// ORIGINAL GPT CALL
const youtubeTranscriptGPT = async (messages) => {
  try {
    const formattedMessages = messages.map((message) => ({
      role: message.isBot ? "assistant" : "user",
      content: message.text,
    }));
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      store: true,
      messages: formattedMessages,
    });
    return completion.choices[0].message.content;
  } catch (error) {
    console.error(error);
    return "Something went wrong...";
  }
};

// NEXT STEPS

// You’re on a super solid foundation already—this is a great direction and the fact that it’s actually retrieving relevant pieces of the transcript already is a big win. You’re thinking in the right direction with your chunk size and summarization ideas. Let’s level it up with some strategic improvements to get as close as possible to your goal: an AI that can answer any question about a video as accurately and contextually as possible.

// ⸻

// ✅ Current Good Moves
// 	•	✅ Embedding transcript chunks with text-embedding-3-small
// 	•	✅ Vector similarity search using match_transcript_chunks in Supabase
// 	•	✅ Answering questions via retrieved context chunks
// 	•	✅ Considering better chunking and summarization for context

// ⸻

// 🔁 Phase 1: Improve Embedding Quality (Pre-RAG)

// 1. Better Chunking Strategy

// Yes, absolutely increase chunk size — but smartly:
// 	•	Try sliding windows with overlap:

//   chunks = [
//   "Sentence 1. Sentence 2. Sentence 3.",
//   "Sentence 2. Sentence 3. Sentence 4.",
//   ...
// ]

// This keeps context from breaking and helps catch nuance across boundaries.

// 	•	Tune for:
// 	•	~500–750 characters or 2–3 sentences per chunk
// 	•	~20–30s of spoken content per chunk, roughly

// 2. Use Sentence-Aware Splitting

// Don’t just slice text — parse the transcript into natural sentences, then group them into paragraphs or coherent mini-stories.
// 	•	Use libraries like @nlpjs/lang-en or sbd to split sentences.

// ⸻

// 🧠 Phase 2: Boost Context at Query Time (RAG)

// 3. Summarize Video First

// Generate a video summary when the transcript is embedded.
// 	•	Store this in the DB alongside video ID.
// 	•	Then include it in the system prompt like:This keeps context from breaking and helps catch nuance across boundaries.

// 	•	Tune for:
// 	•	~500–750 characters or 2–3 sentences per chunk
// 	•	~20–30s of spoken content per chunk, roughly

// 2. Use Sentence-Aware Splitting

// Don’t just slice text — parse the transcript into natural sentences, then group them into paragraphs or coherent mini-stories.
// 	•	Use libraries like @nlpjs/lang-en or sbd to split sentences.

// ⸻

// 🧠 Phase 2: Boost Context at Query Time (RAG)

// 3. Summarize Video First

// Generate a video summary when the transcript is embedded.
// 	•	Store this in the DB alongside video ID.
// 	•	Then include it in the system prompt like:

//   "You are an expert assistant helping answer questions about the following video: [summary here]."

//   	This gives ChatGPT a head start before it even sees chunks.

// 4. Dynamic Retrieval + Prompt Injection

// Use top-N most similar chunks (you’re doing this), but also:
// 	•	Sort by time offset proximity if the question includes a timestamp or context clue.
// 	•	Deduplicate chunks with similar text (or similarity > 0.95).
// 	•	Inject the chunks in order of appearance into the prompt, as a coherent block.

// Example prompt setup:

// [Summary]
// Transcript:
// - [chunk 1]
// - [chunk 2]
// - [chunk 3]

// Question: What characters do you think these players are using?

// 🛠️ Phase 3: Add-on Techniques to Try

// 5. Extract Named Entities (NER)

// If your video includes specific names/characters (like “controller players” or “Mario”), you can:
// 	•	Run NER (Named Entity Recognition) on the full transcript at embedding time
// 	•	Store entities in a separate column/table
// 	•	Boost similarity for chunks mentioning key entities when answering entity-based questions

// 6. Tag Chunks with Metadata

// Store metadata per chunk like:
// 	•	speaker (if possible)
// 	•	scene (you can estimate based on offset)
// 	•	sentiment
// 	•	topics (basic tags using GPT classification)

// Then use this metadata to filter or boost query matches:

// ...WHERE topic LIKE '%characters%' AND similarity > 0.68

// 🧬 Phase 4: Long-Term Enhancements

// 7. Use text-embedding-3-large for Better Results

// If cost is okay, swap to text-embedding-3-large (higher quality embeddings, much better for nuanced queries).

// 8. Fine-tune a Local RAG System (if needed later)

// Eventually, consider building a RAG system with something like:
// 	•	LlamaIndex / LangChain (can run in browser or server)
// 	•	Chunk DB from Supabase or local vector store
// 	•	Multi-step reasoning or multi-hop search (for compound questions)

// ⸻

// 🔄 Summary TL;DR

// Area
// Action
// ðŸ”¢ Chunking
// Sentence-based, ~2â€“3 sentences, sliding window
// ðŸ“„ Prompt
// Include summary + ordered transcript chunks
// ðŸ“Š Embeddings
// Try text-embedding-3-large or sentence-aware input
// ðŸ“š Metadata
// Add tags/topics/entities to chunks
// ðŸ¤– RAG
// Build toward better prompting & retrieval with filtered context
