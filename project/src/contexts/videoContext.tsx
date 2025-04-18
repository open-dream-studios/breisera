"use client";
import React, { createContext, useState, useContext, useEffect } from "react";

export type YouTubePlayerVideo = {
  id: string;
  [key: string]: any;
};

export type GPTMessage = {
  isBot: boolean;
  text: string;
};

export type PlayerStates = "screen" | "sm" | "hidden";

type VideoContextType = {
  currentVideo: YouTubePlayerVideo | null;
  setCurrentVideo: (video: YouTubePlayerVideo) => void;
  messages: GPTMessage[];
  setMessages: React.Dispatch<React.SetStateAction<GPTMessage[]>>;
  userMessage: string;
  setUserMessage: (message: string) => void;
  playerState: PlayerStates;
  setPlayerState: (newState: PlayerStates) => void;
  windowWidth: number | null;
  currentNote: string;
  setCurrentNote: (newCurrentNote: string) => void;
};

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export const VideoProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentVideo, setCurrentVideo] = useState<YouTubePlayerVideo | null>(
    null
  );
  const [messages, setMessages] = useState<GPTMessage[]>([]);
  const [userMessage, setUserMessage] = useState<string>("");
  const [playerState, setPlayerState] = useState<PlayerStates>("hidden");
  const [windowWidth, setWindowWidth] = useState<number | null>(null);
  const [currentNote, setCurrentNote] = useState<string>("")

  useEffect(() => {
    setMessages([]);
    setUserMessage("");
  }, [currentVideo]);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <VideoContext.Provider
      value={{
        currentVideo,
        setCurrentVideo,
        messages,
        setMessages,
        userMessage,
        setUserMessage,
        playerState,
        setPlayerState,
        windowWidth,
        currentNote,
        setCurrentNote
      }}
    >
      {children}
    </VideoContext.Provider>
  );
};

export const useVideo = (): VideoContextType => {
  const context = useContext(VideoContext);
  if (!context) {
    throw new Error("useVideo must be used within a VideoProvider");
  }
  return context;
};
