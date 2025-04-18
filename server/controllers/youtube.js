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
import { encoding_for_model } from "@dqbd/tiktoken";

dotenv.config();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

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
    res.json(formatted);
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

// async function storeTranscriptEmbeddings(videoId, chunks) {
//   console.log("embedding...");

//   // 1. Prepare inputs for batch
//   const inputs = chunks.map((chunk) => chunk.text.slice(0, 1000));

//   // 2. Batch embed all inputs
//   const response = await openai.embeddings.create({
//     model: "text-embedding-3-small",
//     input: inputs,
//   });

//   // 3. Prepare all rows for bulk insert
//   const rows = chunks.map((chunk, i) => ({
//     video_id: videoId,
//     text: chunk.text,
//     time_offset: chunk.offset,
//     duration: chunk.duration,
//     embedding: response.data[i].embedding,
//   }));

//   // 4. Bulk insert into Supabase
//   const { error } = await supabase.from("transcript_chunks").insert(rows);

//   if (error) {
//     console.error("❌ Supabase insert error:", error);
//     throw error;
//   }

//   console.log("✅ All chunks embedded and stored for", videoId);
// }

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

// NOW SET UP AI TO MANAGAE QUERIES

// LOG ONE VECTOR
// const response = await openai.embeddings.create({
//   model: "text-embedding-3-small",
//   input: "behind me",
// });
// console.log(JSON.stringify(response.data[0].embedding));

export const youtubeGPT = async (req, res) => {
  const messages = req.body.messages;
  const question = messages[messages.length - 1].text;
  const videoId = req.body.videoId;

  const { data: queryChunks, error } = await supabase.rpc(
    "match_transcript_chunks",
    {
      query_embedding: await embed(question), // your OpenAI embedding call
      match_threshold: 0.68, 
      match_count: 15,
      video_id: videoId,
    }
  );
  console.log("🔍 Query Chunks:", queryChunks);

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

//   // const result = await getMessage(messages);
//   try {
//     const formattedMessages = messages.map((message) => ({
//       role: message.isBot ? "assistant" : "user",
//       content: message.text,
//     }));
//     const completion = await openai.chat.completions.create({
//       model: "gpt-4o-mini",
//       store: true,
//       messages: formattedMessages,
//     });
//     return completion.choices[0].message.content;
//   } catch (error) {
//     console.error(error);
//     return "Something went wrong...";
//   }
// }

















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


// one more question. right now, the transcript is the only informaiton I'm using as an input to answer these questions. is there ANY kind of visual processing I can do easily that would give more information about the video, without a ton of time taken to do so, and high cost, giving information that might ACTUALLY help? I have no idea what that would look like and if it is even worth considering...

// Absolutely love that you’re thinking this way — going beyond just text to incorporate visual info could level up your app’s intelligence big time. While full visual understanding (like action recognition or object tracking) is heavy and expensive, there are some lightweight, affordable options that give you useful insight into the visual side of the video, even if you’re only using basic tools. Here’s the breakdown:

// ⸻

// ⚡️ LIGHTWEIGHT Visual Inputs That Might Actually Help

// 1. Extract Key Frames
// 	•	Take a frame every X seconds (e.g. every 5–10 sec).
// 	•	Optionally, filter out similar-looking frames using basic perceptual hashing.

// How it helps:
// 	•	You can use image captioning models or CLIP (see below) to describe what’s visually happening.
// 	•	These descriptions can be embedded alongside transcript chunks for richer retrieval.

// Tools:
// 	•	ffmpeg to extract frames:
//   ffmpeg -i input.mp4 -vf fps=1 frame_%04d.jpg




//   2. Use OpenAI’s CLIP or similar

// CLIP (Contrastive Language-Image Pretraining) is a zero-shot model trained to embed both images and text in the same space.

// You can:
// 	•	Generate embeddings for each key frame
// 	•	Store them in a frame_embeddings table
// 	•	Do joint searches between text queries and both transcript+visual context

// “What characters are these players using?” might match a frame with a character select screen.

// Tools:
// 	•	OpenAI CLIP via Hugging Face
// 	•	CLIP-as-service or transformers

// 3. Run a Free Image Captioning Model on Key Frames

// Generate natural-language descriptions like:
// 	•	“A player selecting a character on a game menu”
// 	•	“Two players fighting in a 2D fighting game”

// Then embed those captions and store them just like you do for transcript chunks.

// Tools:
// 	•	BLIP
// 	•	MiniGPT-4 (heavier but more capable)
// 	•	Xenova Transformers (runs in-browser)

// ⸻

// 4. OCR (Text Detection in Frames)

// Extract text from video frames:
// 	•	HUDs, scoreboards, subtitles, character names, etc.

// Could be super useful in gaming videos, for example.

// Tools:
// 	•	Tesseract.js
// 	•	ocr.space API (free tier)

// ⸻

// 🔥 Strategy Summary for You (Low-cost, High-impact)

// Technique
// What You Get
// Cost/Time
// Worth it?
// ðŸ–¼ï¸ Key Frame Extraction
// Screenshots from video
// Very fast
// âœ… Yes
// ðŸ§  CLIP Embeddings
// Searchable image representations
// Fast
// âœ… Yes
// ðŸ“ Captioning Frames
// â€œPlayer choosing characterâ€¦â€
// Moderate
// âœ… Yes
// ðŸ”¤ OCR
// Game UI text, subtitles, names
// Fast
// âœ… Yes
// ðŸŽ¥ Action/Object Recognition
// Detailed scene understanding
// Expensive
// âŒ Not worth it (yet)

// 🚀 Combine With Your Current RAG Flow

// Let’s say you add visual frame captions and embed them. Now at query time:
// 	1.	Embed user question
// 	2.	Search transcript chunks by similarity
// 	3.	Search image caption/CLIP embeddings
// 	4.	Merge and sort by similarity and time proximity
// 	5.	Inject results into prompt

// You just gave the model visual memory.

// ⸻

// If you want, I can help you wire up a basic version of this:
// 	•	Extract key frames
// 	•	Caption them
// 	•	Store + embed captions
// 	•	Use those in retrieval

// Would that be helpful to prototype this next step?