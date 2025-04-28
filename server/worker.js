// import { Worker } from "bullmq";
// import { spawn } from "child_process";
// import path from "path";
// import { fileURLToPath } from "url";
// import IORedis from "ioredis";
// import fs from "fs";
// import dotenv from "dotenv";
// import { uploadToS3 } from "./functions/aws.js";
// dotenv.config();

// // --- Fix __dirname and __filename for ES modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // --- Redis connection
// const connection = new IORedis(process.env.REDIS_URL, {
//   maxRetriesPerRequest: null,
// });

// // --- Worker
// const worker = new Worker(
//   "video-processing",
//   async (job) => {
//     const { link, start, end, video_name } = job.data;

//     console.log(
//       `🛠️ Starting processing for video: ${link} [${start} -> ${end}]`
//     );

//     return new Promise((resolve, reject) => {
//       console.log(`🎬 Launching Python script for ${video_name}...`);

//       const pythonScriptPath = path.resolve(__dirname, "python", "video.py");

//       const pythonProcess = spawn(
//         "python3",
//         [pythonScriptPath, link, start, end, video_name],
//         {
//           cwd: __dirname,
//           stdio: ["pipe", "pipe", "pipe"],
//         }
//       );

//       pythonProcess.stdout.on("data", (data) => {
//         console.log(`🐍 [PYTHON STDOUT]: ${data.toString()}`);
//       });

//       pythonProcess.stderr.on("data", (data) => {
//         console.error(`❌ [PYTHON STDERR]: ${data.toString()}`);
//       });

//       pythonProcess.on("close", async (code) => {
//         if (code !== 0) {
//           console.error(`🚨 Python process exited with code ${code}`);
//           return reject(new Error(`Python process exited with code ${code}`));
//         }

//         console.log(
//           `✅ Python process finished successfully for ${video_name}`
//         );

//         const filePath = path.join(__dirname, "temp", video_name);
//         console.log(`📂 Looking for processed file at ${filePath}`);

//         try {
//           const fileContent = fs.readFileSync(filePath);

//           await uploadToS3({
//             Bucket: process.env.S3_BUCKET_NAME,
//             Key: video_name,
//             Body: fileContent,
//             ContentType: "video/mp4",
//           });

//           console.log(`🏆 Uploaded ${video_name} to S3 successfully!`);
//           await connection.set(`video-ready:${video_name}`, "true", "EX", 3600);
//           resolve();
//         } catch (err) {
//           console.error(`❌ Failed to upload to S3 or read file: ${err}`);
//           reject(err);
//         }
//       });
//     });
//   },
//   { connection }
// );

import { Worker } from "bullmq";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import IORedis from "ioredis";
import dotenv from "dotenv";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getIO } from "./connection/websocket";
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
    const { link, start, end, video_name } = job.data;

    // console.log(
    //   `🛠️ Starting processing for video: ${link} [${start} -> ${end}]`
    // );

    try {
      // console.log(`🎬 Spawning yt-dlp and streaming to S3 for ${video_name}...`);

      const ytDlpProcess = spawn(
        "yt-dlp",
        [
          "-f",
          "best",
          "-o",
          "-", // output to stdout
          link,
        ],
        {
          cwd: __dirname,
          stdio: ["pipe", "pipe", "pipe"],
        }
      );

      ytDlpProcess.stderr.on("data", (data) => {
        console.error(`❌ [yt-dlp stderr]: ${data.toString()}`);
      });

      const upload = new Upload({
        client: s3,
        params: {
          Bucket: process.env.S3_BUCKET_NAME,
          Key: video_name,
          Body: ytDlpProcess.stdout,
          ContentType: "video/mp4",
        },
      });

      await upload.done();

      // console.log(`🏆 Uploaded ${video_name} to S3 successfully!`);
      console.log(`Uploaded!`);
      await connection.set(`video-ready:${video_name}`, "true", "EX", 3600);
      // const io = getIO();
      // io.to(userSocketId).emit("video-ready", {
      //   video_name,
      //   download_url: `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${video_name}`,
      // });
    } catch (error) {
      console.error(`Failed processing ${video_name}: ${error}`);
      throw error;
    }
  },
  { connection }
);
