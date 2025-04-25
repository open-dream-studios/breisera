import { useContext } from "react";
import { appTheme, ThemeType } from "../appTheme";
import { AuthContext } from "@/contexts/authContext";
import {
  getVideoTime,
  setVideoTime,
} from "@/screens/Player/YouTubePlayer/YouTubePlayer";
import React from "react"

export const formatSubs = (subs: string | number): string => {
  const num = typeof subs === "string" ? parseInt(subs, 10) : subs;
  if (isNaN(num)) return "0";
  if (num < 1000) return `${num}`;
  if (num < 1_000_000) return `${(num / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
};

export const formatTimeStamp = (input: number): string => {
  const totalSeconds = Math.floor(input); // ignore decimal part

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const paddedMinutes =
    hours > 0 ? String(minutes).padStart(2, "0") : String(minutes);
  const paddedSeconds = String(seconds).padStart(2, "0");

  return hours > 0
    ? `${hours}:${paddedMinutes}:${paddedSeconds}`
    : `${paddedMinutes}:${paddedSeconds}`;
};

export const convertToSeconds = (timestamp: string): number => {
  const [hours, minutes, seconds] = timestamp.split(":").map(Number);
  return hours * 3600 + minutes * 60 + seconds;
};

export const timeStampInjection = (
  currentTheme: ThemeType,
  message: string
) => {
  const parts = message.split(/(\[?\d{2}:\d{2}:\d{2}\]?)/g);
  return parts.map((part, index) => {
    const match = part.match(/\[?(\d{2}:\d{2}:\d{2})\]?/);
    if (match) {
      const time = match[1];
      return (
        <button
          key={index}
          onClick={() => {
            const currentTime = getVideoTime();
            const seconds = convertToSeconds(time);
            if (currentTime !== seconds && seconds) {
              setVideoTime(seconds);
            }
          }}
          style={{
            backgroundColor: appTheme[currentTheme].bot_time_stamp,
            color: appTheme[currentTheme].text_2,
          }}
          className="hover:brightness-75 dim cursor-pointer bg-gray-500 px-[5px] text-[14px] leading-[14px] py-[4px] ml-[2px] mr-[2px] rounded-[5px]"
        >
          {time}
        </button>
      );
    }

    return <span key={index}>{part}</span>;
  });
};

// export const timeStampInjectionAndFormatBreaks = (
//   message: string,
//   currentTheme: ThemeType
// ) => {
//   const lines = message.split("\n");

//   return lines.flatMap((line, lineIndex) => {
//     const parts = line.split(/(\[?\d{2}:\d{2}:\d{2}\]?)/g);
//     const lineElements = parts.map((part, index) => {
//       const match = part.match(/\[?(\d{2}:\d{2}:\d{2})\]?/);
//       if (match) {
//         const time = match[1];
//         return (
//           <button
//             key={`${lineIndex}-${index}`}
//             onClick={() => {
//               const currentTime = getVideoTime();
//               const seconds = convertToSeconds(time);
//               if (currentTime !== seconds && seconds) {
//                 setVideoTime(seconds);
//               }
//             }}
//             style={{
//               backgroundColor: appTheme[currentTheme].bot_time_stamp,
//               color: appTheme[currentTheme].text_2,
//             }}
//             className="hover:brightness-75 dim cursor-pointer bg-gray-500 px-[5px] text-[14px] leading-[14px] py-[4px] ml-[2px] mr-[2px] rounded-[5px]"
//           >
//             {time}
//           </button>
//         );
//       }

//       return <span key={`${lineIndex}-${index}`}>{part}</span>;
//     });

//     // Add a <br /> after each line (except the last one)
//     return [...lineElements, <br key={`br-${lineIndex}`} />];
//   });
// };

export const timeStampInjectionAndFormatting = (
  message: string,
  currentTheme: ThemeType
) => {
  // Format breaks, headers, and inject time stamps
  const lines = message.replace(/\n{3,}/g, "\n\n").split("\n");

  return lines.flatMap((line, lineIndex) => {
    const isPossibleHeader =
      !/\d{2}:\d{2}:\d{2}/.test(line) &&
      line.trim().split(/\s+/).length >= 2 &&
      line.trim().split(/\s+/).length <= 15;

    if (isPossibleHeader) {
      return [
        <h3
          key={`header-${lineIndex}`}
          className="font-semibold text-[18px] leading-[20px] mt-[15px] mb-[-10px]"
          style={{ color: appTheme[currentTheme].text_1 }}
        >
          {line.trim()}
        </h3>,
      ];
    }

    const parts = line.split(/(\[?\d{2}:\d{2}:\d{2}\]?)/g);
    const lineElements = parts.map((part, index) => {
      const match = part.match(/\[?(\d{2}:\d{2}:\d{2})\]?/);
      if (match) {
        const time = match[1];
        return (
          <button
            key={`${lineIndex}-${index}`}
            onClick={() => {
              const currentTime = getVideoTime();
              const seconds = convertToSeconds(time);
              if (currentTime !== seconds && seconds) {
                setVideoTime(seconds);
              }
            }}
            style={{
              backgroundColor: appTheme[currentTheme].bot_time_stamp,
              color: appTheme[currentTheme].text_2,
            }}
            className="hover:brightness-75 dim cursor-pointer bg-gray-500 px-[5px] text-[14px] leading-[14px] py-[4px] ml-[2px] mr-[2px] rounded-[5px]"
          >
            {time}
          </button>
        );
      }

      return <span key={`${lineIndex}-${index}`}>{part}</span>;
    });

    return [...lineElements, <br key={`br-${lineIndex}`} />];
  });
};

export const extractJsonArray = (input: string) => {
  const regex = /\[\s*{[\s\S]*?}\s*]/g; // matches from [ { ... } ] with any content between

  const match = input.match(regex);

  if (match && match.length > 0) {
    try {
      const parsed = JSON.parse(match[0]);
      return parsed;
    } catch (e) {
      // If parsing fails, return original input
      return input;
    }
  }

  // If no match is found, return original input
  return input;
};
