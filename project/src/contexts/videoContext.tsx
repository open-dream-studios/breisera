"use client"
import React, { createContext, useState, useContext, useEffect } from "react";

export type YouTubePlayerVideo = {
  id: string;
  [key: string]: any;
};

export type GPTMessage = {
  isBot: boolean;
  text: string;
};

export type PlayerStates = "screen" | "sm" | "hidden"


type VideoContextType = {
  currentVideo: YouTubePlayerVideo | null;
  setCurrentVideo: (video: YouTubePlayerVideo) => void;
  messages: GPTMessage[],
  setMessages: React.Dispatch<React.SetStateAction<GPTMessage[]>>;
  userMessage: string;
  setUserMessage: (message: string) => void
  playerState: PlayerStates,
  setPlayerState: (newState: PlayerStates) => void;
};

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export const VideoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentVideo, setCurrentVideo] = useState<YouTubePlayerVideo | null>(null);
  const [messages, setMessages] = useState<GPTMessage[]>([]);
  const [userMessage, setUserMessage] = useState<string>("");
  const [playerState, setPlayerState] = useState<PlayerStates>("hidden")

  useEffect(()=>{
    setMessages([])
    setUserMessage("")
  },[currentVideo])

  return (
    <VideoContext.Provider value={{ currentVideo, setCurrentVideo, messages, setMessages, userMessage, setUserMessage, playerState, setPlayerState }}>
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