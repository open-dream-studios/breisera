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

    return res.status(200).json({ content: transcript });
  } catch (error) {
    console.error("Error:", error.message);
    res
      .status(404)
      .json({ success: false, content: "Error getting transcript" });
  }
};


// TO DO: SEND VIDEO LENGTH
export const geminiQuery = async (req, res) => {
  const messages = req.body.messages;
  const conversation = messages.slice(0, -1)
  .map((msg) => `${msg.isBot ? "Bot" : "User"}: ${msg.text}`)
  .join("\n");
  const question = messages[messages.length - 1].text;
  const transcript = req.body.transcript;
  const geminiModel = "gemini-1.5-flash";

  const formattedTranscript = transcript
    .map((item) => `${formatTimeStamp(item.offset) + " " + item.text}`)
    .join("\n");

  const prompt = [
    {
      role: "user",
      parts: [
        {
          text: `You are a helpful assistant. You are answering questions about a YouTube video.
              Here is the full transcript, with timestamps at the beginning of each line given in the format HH:MM:SS.

              Please, whenever possible, include timestamps in your answers in the exact format HH:MM:SS.
              The video is approximately ${21} minutes and ${34} seconds long. 
              Do not reference timestamps beyond this range.
              Always use the format HH:MM:SS for timestamps. example: 4 minutes = 00:04:00
              \n
              TRANSCRIPT:
              ${formattedTranscript}`,
        },
        {
          text: `Here is the chat history of the current conversation:\n
          ${conversation}
          `
        },
        {
          text: `
          Here is the user's question, please provide an answer:
          QUESTION: ${question}
          ANSWER:`,
        },
      ],
    },
  ];

  try {
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`;
    const geminiResponse = await fetch(
      `${GEMINI_API_URL}?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: prompt,
        }),
      }
    );

    const data = await geminiResponse.json();
    const content =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "No answer.";
    res.status(200).json({ content });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Gemini API request failed" });
  }
};

// TO DO: SEND VIDEO LENGTH
export const geminiSummaryQuery = async (req, res) => {
  const transcript = req.body.transcript;
  const geminiModel = "gemini-1.5-flash";
  
  const minutes = 20
  const summaryLength = minutes > 20? 400 : minutes > 10 ? 300 : minutes > 5 ? 200 : minutes > 2 ? 150 : 50

  const formattedTranscript = transcript
    .map((item) => `${formatTimeStamp(item.offset) + " " + item.text}`)
    .join("\n");

  const prompt = [
    {
      role: "user",
      parts: [
        {
          text: `You are a helpful assistant. You must create a detailed summary a YouTube video using the video transcript.
              The summary you return should be roughly ${summaryLength} words long, and should be broken into several small paragraphs. 
              The summary should use unique headers for each section, and each section can be one or two small paragraphs depending on the significance and length of the section. 
              Separate all headers and paragraphs by new lines.

              Please style this summary by referencing the topics of the video, rather than the video itself.
              For example, avoid phrases like: "This video describes" or "The video tells us"
              And instead describe directly what it was covering. 

              Here is an example summary from a video that was 13 minutes long: 
              EXAMPLE: 
              What Founder Mode Really Means

              Late-stage founders often face the challenge of losing touch with their company's inner workings due to expanding bureaucracy and layers of management. This disconnect hinders their ability to understand what's happening on the ground level, impacting their decision-making.
              Dunbar's Number and Communication Breakdown
              As companies grow, founders quickly surpass Dunbar's number, making it difficult to maintain close relationships and effective communication with all employees, especially those directly interacting with customers or developing the product. 00:02:30
              
              The Illusion of Delegation

              Investors often encourage delegation to hired executives, creating a situation where founders become detached from the details and lose direct involvement in the company's operations. This is a significant shift from the hands-on approach of early-stage startups. 00:04:10
              
              Cutting Through Bureaucracy

              Founder mode involves actively combating this bureaucratic inertia. It requires developing techniques to bypass layers of management and regain direct insight into the company's performance and customer feedback. 00:06:40
              
              Practical Strategies

              Examples include reducing management layers, directly engaging with individual contributors to understand problems, and actively seeking out first-hand information about user needs and product failures. Ignoring these crucial aspects can lead to a disconnect from the core business. 00:08:00
              
              The Importance of Hiring Great Executives

              While hiring strong executives is essential for growth, it's crucial to select individuals who understand the founder's authority and work collaboratively to achieve company goals, rather than creating barriers to communication and decision-making. 00:10:20
              
              The Viral Nature of "Founder Mode"

              The concept of "founder mode" has become a viral topic, leading to various interpretations and projections. It's important to consider the original context and avoid falling into clickbait-driven discussions. 00:12:10
              END OF EXAMPLE



              Here is the full transcript of the video, with timestamps at the beginning of each line given in the format HH:MM:SS.

              Please, whenever it makes sense, include timestamps in your answers in the exact format HH:MM:SS.
              The video is approximately ${21} minutes and ${34} seconds long. 
              Do not reference timestamps beyond this range.
              Always use the format HH:MM:SS for timestamps. example: 4 minutes = 00:04:00
              \n
              TRANSCRIPT:
              ${formattedTranscript}`,
        },
        {
          text: `
          Return a detailed summary of this video.
          SUMMARY:`,
        },
      ],
    },
  ];

  try {
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`;
    const geminiResponse = await fetch(
      `${GEMINI_API_URL}?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: prompt,
        }),
      }
    );

    const data = await geminiResponse.json();
    const content =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "No answer.";
    res.status(200).json({ content });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Gemini API request failed" });
  }
};

// TO DO: SEND VIDEO LENGTH
export const geminiKeyConceptsQuery = async (req, res) => {
  const transcript = req.body.transcript;
  const geminiModel = "gemini-1.5-flash";
  
  const minutes = 21
  const summaryLength = minutes > 20? 250 : minutes > 10 ? 180 : minutes > 5 ? 150 : minutes > 2 ? 100 : 50

  const formattedTranscript = transcript
    .map((item) => `${formatTimeStamp(item.offset) + " " + item.text}`)
    .join("\n");

  const prompt = [
    {
      role: "user",
      parts: [
        {
          text: `You are a helpful assistant. You must create a detailed set of key concepts for a YouTube video using the video transcript.
              The key concepts list you return should be roughly ${summaryLength} words long in total.
              The key concepts should use unique headers for each section, and each section can be one or more concepts written out depending on the importance and detail needed. Each concept should be very short and concise. 
              Separate all headers and sections by new lines.

              Please primarily reference the topics of the video, rather than the video itself.
              For example, avoid phrases like: "This video describes" or "The video tells us"
              And instead describe directly what it was covering. 

              Here is an example of a set of key concepts from a video that was 9 minutes long: 
              
              EXAMPLE: 
              The Democratization of Software Development

              The rise of AI-powered tools and natural language processing (NLP) has dramatically lowered the barrier to entry for software development. Building software is no longer a privilege requiring years of coding expertise. 00:00:30
              
              Key Skill Shift

              The most valuable skill is now the ability to articulate your vision clearly and create products through natural language, effectively "speaking your ideas into existence." 00:02:10
              
              Accessibility and Execution

              Idea generation is widespread, but execution is now democratized. Anyone with an idea can build software using AI tools. 00:03:00
              
              Building Software with AI

              This tutorial demonstrates building a functional application without coding, leveraging AI tools like Lovable and APIs like Fir Crawl. 00:04:50
              
              Software Components

              A basic understanding of software architecture (front-end, back-end, APIs) is helpful, but not essential for using AI to build. 00:06:10
              
              Utilizing AI Tools

              - Lovable: A no-code/low-code platform for building app front-ends and back-ends. 
              - Fir Crawl: An API for web scraping.
              - Superbase: A backend-as-a-service platform.
              00:07:20
              
              The Role of Reference Images

              Using reference images from sites like Dribbble allows for specifying the desired visual style of the application without needing design skills. 00:08:00
              END OF EXAMPLE


              Here is the full transcript of the video, with timestamps at the beginning of each line given in the format HH:MM:SS.

              Please, whenever it makes sense, include timestamps in your answers in the exact format HH:MM:SS.
              The video is approximately ${21} minutes and ${34} seconds long. 
              Do not reference timestamps beyond this range.
              Always use the format HH:MM:SS for timestamps. example: 4 minutes = 00:04:00
              \n
              TRANSCRIPT:
              ${formattedTranscript}`,
        },
        {
          text: `
          Return the most significant of key concepts from this video.
          KEY CONCEPTS:`,
        },
      ],
    },
  ];

  try {
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`;
    const geminiResponse = await fetch(
      `${GEMINI_API_URL}?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: prompt,
        }),
      }
    );

    const data = await geminiResponse.json();
    const content =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "No answer.";
    res.status(200).json({ content });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Gemini API request failed" });
  }
};

// TO DO: SEND VIDEO LENGTH
export const geminiFlashcardsQuery = async (req, res) => {
  const number = req.body.number
  const topic = req.body.topic;
  const transcript = req.body.transcript;
  const geminiModel = "gemini-1.5-flash";

  const formattedTranscript = transcript
    .map((item) => `${formatTimeStamp(item.offset) + " " + item.text}`)
    .join("\n");

  const prompt = [
    {
      role: "user",
      parts: [
        {
          text: `You are a helpful assistant. You must create a set of flash cards based on a YouTube video.
              You must return an array of objects, where each object contains a question answer pair and a timestamp. Here is an example of the format to return:
              [
                {
                  "question": "What is the primary function of the mitochondria?",
                  "answer": "To generate ATP through cellular respiration",
                  "timestamp": "00:03:45"
                },
                {
                  "question": "Why is photosynthesis important for life on Earth?",
                  "answer": "It produces oxygen and is the foundation of the food chain",
                  "timestamp": "00:05:12"
                }
              ]

              The timestamps you include, referencing the transcript, must be in the exact format HH:MM:SS
              The video is approximately ${21} minutes and ${34} seconds long. 
              Do not reference timestamps beyond this range.
              Always use the format HH:MM:SS for timestamps. Example: 4 minutes = 00:04:00

              Here is the full transcript, with timestamps listed at the beginning of each line given in the format HH:MM:SS.

              \n
              TRANSCRIPT:
              ${formattedTranscript}`,
        },
        {
          text: `
          Create these flashcards based on the video, focusing on this topic: ${topic}
          Keep the questions and answers concise and ask intelligent questions.
          Return an array of ${number} flashcard objects:`,
        },
      ],
    },
  ];

  try {
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`;
    const geminiResponse = await fetch(
      `${GEMINI_API_URL}?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: prompt,
        }),
      }
    );

    const data = await geminiResponse.json();
    const content =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "No answer.";
    res.status(200).json({ content });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Gemini API request failed" });
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
