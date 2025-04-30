import dotenv from "dotenv";
import { db } from "../connection/connect.js";
import { extractJsonArray, formatTimeStamp, generateId } from "../functions/data.js";
import fetch from "node-fetch";
dotenv.config();

import { createClient } from "@supabase/supabase-js";
import { decodeToken } from "../functions/auth.js";
import { saveFlashCards } from "./user.js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function checkVideoStorage(videoId) {
  const { data, error } = await supabase
    .from("video_summaries")
    .select("video_summary, video_key_concept")
    .eq("video_id", videoId)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = No rows found
    console.error("Error fetching video summary:", error);
    throw error;
  }

  return [data?.video_summary ?? null, data?.video_key_concept ?? null];
}

async function upsertVideoStorage(
  videoId,
  storedSummary,
  generatedSummary,
  storedKeyConcepts,
  generatedKeyConcepts
) {
  if (storedSummary && storedKeyConcepts) {
    return;
  }

  const updateData = { video_id: videoId };

  if (!storedSummary) {
    updateData.video_summary = generatedSummary;
  }
  if (!storedKeyConcepts) {
    updateData.video_key_concept = generatedKeyConcepts;
  }

  updateData.process_version = 1.1;

  const { error } = await supabase
    .from("video_summaries")
    .upsert(updateData, { onConflict: "video_id" });

  if (error) {
    console.error("Error upserting video summary:", error);
    throw error;
  }
}

// TO DO: SEND VIDEO LENGTH
export const geminiQuery = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not authenticated!");

  const { messages, transcript, video } = req.body;
  if (!video) return res.status(404).json("No video sent");

  const conversation = messages
    .slice(0, -1)
    .map((msg) => `${msg.isBot ? "Bot" : "User"}: ${msg.text}`)
    .join("\n");
  const question = messages[messages.length - 1].text;
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

              Here is the information about the video to help you answer questions:
              The video title is: ${video.snippet.title}
              
              The video description is: ${video.snippet.description}

              The date this video was published: ${video.snippet.publishedAt}
              The YouTube channel that made this video: ${
                video.snippet.channelTitle
              }
              The vidoe's default language: ${
                video.snippet.defaultAudioLanguage
              }

              TRANSCRIPT:
              ${formattedTranscript}`,
        },
        {
          text: `Here is the chat history of the current conversation:\n
          ${conversation}
          `,
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

const generateSummary = async (transcript, video) => {
  const geminiModel = "gemini-1.5-flash";

  const minutes = 20;
  const summaryLength =
    minutes > 20
      ? 400
      : minutes > 10
      ? 300
      : minutes > 5
      ? 200
      : minutes > 2
      ? 150
      : 50;

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


              Here is the information about the video you will create a summary for:
              The video title is: ${video.snippet.title}
              
              The video description is: ${video.snippet.description}

              The date this video was published: ${video.snippet.publishedAt}
              The YouTube channel that made this video: ${
                video.snippet.channelTitle
              }
              The vidoe's default language: ${
                video.snippet.defaultAudioLanguage
              }

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
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
    return content;
  } catch (err) {
    console.error(err.response?.data || err.message);
    return null;
  }
};

const generateKeyConcepts = async (transcript, video) => {
  const geminiModel = "gemini-1.5-flash";

  const minutes = 21;
  const summaryLength =
    minutes > 20
      ? 250
      : minutes > 10
      ? 180
      : minutes > 5
      ? 150
      : minutes > 2
      ? 100
      : 50;

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


              Here is the information about the video you will create key concepts for:
              The video title is: ${video.snippet.title}
              
              The video description is: ${video.snippet.description}

              The date this video was published: ${video.snippet.publishedAt}
              The YouTube channel that made this video: ${
                video.snippet.channelTitle
              }
              The vidoe's default language: ${
                video.snippet.defaultAudioLanguage
              }

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
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
    return content;
  } catch (err) {
    console.error(err.response?.data || err.message);
    return null;
  }
};

// TO DO: SEND VIDEO LENGTH
export const geminiSummariesQuery = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not authenticated!");

  const { transcript, video } = req.body;
  if (!video) return res.status(404).json("No video sent");

  const [storedSummary, storedKeyConcepts] = await checkVideoStorage(video.id);

  let summaryPromise = null;
  let keyConceptsPromise = null;

  if (!storedSummary) {
    summaryPromise = generateSummary(transcript, video);
  }
  if (!storedKeyConcepts) {
    keyConceptsPromise = generateKeyConcepts(transcript, video);
  }

  const [generatedSummary, generatedKeyConcepts] = await Promise.all([
    summaryPromise ?? Promise.resolve(storedSummary),
    keyConceptsPromise ?? Promise.resolve(storedKeyConcepts),
  ]);

  await upsertVideoStorage(
    video.id,
    storedSummary,
    generatedSummary,
    storedKeyConcepts,
    generatedKeyConcepts
  );

  return res.status(200).json({
    success: true,
    summary: generatedSummary,
    keyConcepts: generatedKeyConcepts,
  });
};

// TO DO: SEND VIDEO LENGTH
export const geminiFlashcardsQuery = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not authenticated!");
  const user_id = decodeToken(token);

  const { number, topic, transcript, video } = req.body;
  if (!number || !transcript || !video) {
    return res.status(500).json("Invalid data sent");
  }
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

              Here is the information about the video you will create flashcards for:
              The video title is: ${video.snippet.title}
              
              The video description is: ${video.snippet.description}

              The date this video was published: ${video.snippet.publishedAt}
              The YouTube channel that made this video: ${
                video.snippet.channelTitle
              }
              The vidoe's default language: ${
                video.snippet.defaultAudioLanguage
              }

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
    // Make sure the user doesn't have more than 100 flash card sets already
    const userFlashCards = await new Promise((resolve, reject) => {
      db.query(
        "SELECT * FROM flashcards WHERE user_id = ?",
        [user_id],
        (err, data) => {
          if (err) {
            console.error(
              "DB Query Error: Could not fetch any existing flashcard sets",
              err
            );
            return reject(err);
          }
          resolve(data.length);
        }
      );
    });

    if (userFlashCards.length > 100) {
      return res.status(500).json("User flash card limit reached")
    }
    const title = `Flashcard Set ${userFlashCards + 1}`;

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

    // Save Set
    const flashcard_id = generateId(15)
    const cleanedContent = extractJsonArray(content)
    const result = await saveFlashCards(
      user_id,
      flashcard_id,
      null,
      title,
      JSON.stringify(cleanedContent),
      video.id,
      JSON.stringify(video)
    );

    if (result) {
      return res.status(200).json({ content: cleanedContent, flashcard_id, title, videoId: video.id });
    } else {
      return res.status(500).json({ error: "Error saving flashcards" });
    }
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Gemini API request failed" });
  }
};
