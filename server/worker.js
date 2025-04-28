import { Worker } from "bullmq";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import IORedis from "ioredis";
import dotenv from "dotenv";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getIO } from "./connection/websocket.js";
import fs from "fs";

dotenv.config();

// --- Fix __dirname and __filename for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Redis connection
const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

// --- S3 Client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// --- Worker
const worker = new Worker(
  "video-processing",
  async (job) => {
    const { socketId, link, start, end, video_name } = job.data;
    try {
      const ytDlpProcess = spawn(
        "yt-dlp",
        [
          "-f",
          // "bestvideo+bestaudio/best",
          "best",
          "-o",
          "-",
          link,
        ],
        {
          cwd: __dirname,
          stdio: ["pipe", "pipe", "pipe"],
        }
      );

      ytDlpProcess.stderr.on("data", (data) => {
        console.log(`❌ [yt-dlp stderr]: ${data.toString()}`);
      });

      const upload = new Upload({
        client: s3,
        params: {
          Bucket: process.env.S3_BUCKET_NAME,
          Key: video_name,
          Body: ytDlpProcess.stdout,
          ContentType: "video/mp4",
          Metadata: {
            "Content-Disposition": `attachment; filename="${video_name}"`,
          },
        },
      });

      await upload.done();

      console.log(`Uploaded Successfully`);
      if (socketId) {
        await connection.set(`video-ready:${video_name}`, socketId, "EX", 3600);
      }
    } catch (error) {
      console.error(`Failed processing ${video_name}: ${error}`);
      throw error;
    }
  },
  { connection }
);
