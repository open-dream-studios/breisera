"use client";
import React, { createContext, useState, useContext, useEffect } from "react";
import { StudyToolTypes } from "@/screens/Player/StudyTools/StudyTools";
import { QueryObserverResult, useQuery } from "@tanstack/react-query";
import { AuthContext } from "./authContext";
import { makeRequest } from "@/util/axios";

export type YouTubePlayerVideo = {
  id: string;
  last_timestamp?: number;
  [key: string]: any;
};

export type GPTMessage = {
  isBot: boolean;
  text: string;
};

export type PlayerStates = "screen" | "sm" | "hidden";

export type ExploreVideos = {
  recommended_1: any[];
};

export type Note = {
  note_id: string | null;
  title: string;
  content: string;
  video_id: string | null;
};

export type VideoTranscriptBit = {
  text: string;
  offset?: number;
  duration?: number;
  lang?: string;
};
export type VideoTranscript = null | VideoTranscriptBit[];

export type Summary = null | string;
export type KeyConcepts = null | string;

export type FlashCard = {
  question: string;
  answer: string;
  timeStamp?: string;
  [key: string]: any;
};
export type FlashCards = {
  flashcard_id: string | null;
  title: string;
  content: FlashCard[];
  video_id: string | null;
};

type VideoContextType = {
  currentVideo: YouTubePlayerVideo | null;
  setCurrentVideo: React.Dispatch<
    React.SetStateAction<YouTubePlayerVideo | null>
  >;
  messages: GPTMessage[];
  setMessages: React.Dispatch<React.SetStateAction<GPTMessage[]>>;
  userMessage: string;
  setUserMessage: React.Dispatch<React.SetStateAction<string>>;
  playerState: PlayerStates;
  setPlayerState: React.Dispatch<React.SetStateAction<PlayerStates>>;
  windowWidth: number | null;
  currentNote: Note;
  setCurrentNote: React.Dispatch<React.SetStateAction<Note>>;
  exploreVideos: ExploreVideos;
  setExploreVideos: React.Dispatch<React.SetStateAction<ExploreVideos>>;
  currentVideoTranscript: VideoTranscript;
  setCurrentVideoTranscript: React.Dispatch<
    React.SetStateAction<VideoTranscript>
  >;
  loadingCurrentVideoTranscript: boolean;
  setLoadingCurrentVideoTranscript: React.Dispatch<
    React.SetStateAction<boolean>
  >;
  currentWhisperTranscript: VideoTranscript;
  setCurrentWhisperTranscript: React.Dispatch<
    React.SetStateAction<VideoTranscript>
  >;
  loadingCurrentWhisperTranscript: boolean;
  setLoadingCurrentWhisperTranscript: React.Dispatch<
    React.SetStateAction<boolean>
  >;
  currentKeyConcepts: KeyConcepts;
  setCurrentKeyConcepts: React.Dispatch<React.SetStateAction<KeyConcepts>>;
  currentSummary: Summary;
  setCurrentSummary: React.Dispatch<React.SetStateAction<Summary>>;
  loadingCurrentSummaries: boolean;
  setLoadingCurrentSummaries: React.Dispatch<React.SetStateAction<boolean>>;
  currentStudyTool: StudyToolTypes;
  setCurrentStudyTool: React.Dispatch<React.SetStateAction<StudyToolTypes>>;
  currentFlashCards: FlashCards;
  setCurrentFlashCards: React.Dispatch<React.SetStateAction<FlashCards>>;
  loadingCurrentFlashCards: boolean;
  setLoadingCurrentFlashCards: React.Dispatch<React.SetStateAction<boolean>>;
  currentIndex: number;
  setCurrentIndex: React.Dispatch<React.SetStateAction<number>>;
  flipped: boolean;
  setFlipped: React.Dispatch<React.SetStateAction<boolean>>;
  isAnimating: boolean;
  setIsAnimating: React.Dispatch<React.SetStateAction<boolean>>;
  disableAnimation: boolean;
  setDisableAnimation: React.Dispatch<React.SetStateAction<boolean>>;
  generateSummaries: (transcript: VideoTranscript) => void;
  handleVideoClick: (video: YouTubePlayerVideo) => void;
  theaterMode: boolean;
  setTheaterMode: React.Dispatch<React.SetStateAction<boolean>>;
  addToLibraryVisible: boolean;
  setAddToLibraryVisible: React.Dispatch<React.SetStateAction<boolean>>;
};

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export const VideoProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { currentUser } = useContext(AuthContext);
  const [currentVideo, setCurrentVideo] = useState<YouTubePlayerVideo | null>(
    null
  );
  const [messages, setMessages] = useState<GPTMessage[]>([]);
  const [userMessage, setUserMessage] = useState<string>("");
  const [playerState, setPlayerState] = useState<PlayerStates>("hidden");
  const [windowWidth, setWindowWidth] = useState<number | null>(null);
  const [currentNote, setCurrentNote] = useState<Note>({
    note_id: null,
    title: "",
    content: "",
    video_id: null,
  });
  const [exploreVideos, setExploreVideos] = useState<ExploreVideos>({
    recommended_1: [],
  });

  const [currentStudyTool, setCurrentStudyTool] =
    useState<StudyToolTypes>("Chat");

  const [currentVideoTranscript, setCurrentVideoTranscript] =
    useState<VideoTranscript>(null);
  const [loadingCurrentVideoTranscript, setLoadingCurrentVideoTranscript] =
    useState<boolean>(true);

  const [currentWhisperTranscript, setCurrentWhisperTranscript] =
    useState<VideoTranscript>(null);
  const [loadingCurrentWhisperTranscript, setLoadingCurrentWhisperTranscript] =
    useState<boolean>(true);

  const [currentKeyConcepts, setCurrentKeyConcepts] =
    useState<KeyConcepts>(null);

  const [currentSummary, setCurrentSummary] = useState<Summary>(null);
  const [loadingCurrentSummaries, setLoadingCurrentSummaries] =
    useState<boolean>(true);

  const [currentFlashCards, setCurrentFlashCards] = useState<FlashCards>({
    flashcard_id: null,
    title: "",
    content: [],
    video_id: null,
  });
  const [loadingCurrentFlashCards, setLoadingCurrentFlashCards] =
    useState<boolean>(false);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [flipped, setFlipped] = useState<boolean>(false);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [disableAnimation, setDisableAnimation] = useState<boolean>(false);

  const [theaterMode, setTheaterMode] = useState<boolean>(false);
  const [addToLibraryVisible, setAddToLibraryVisible] =
    useState<boolean>(false);

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

  const generateSummaries = async (transcript: VideoTranscript) => {
    try {
      const res = await makeRequest.post("/api/youtube/gemini-summaries", {
        transcript,
        video: currentVideo,
      });
      if (res.status === 200) {
        setCurrentSummary(res.data.summary);
        setCurrentKeyConcepts(res.data.keyConcepts);
      }
    } catch (error) {
      setCurrentSummary(null);
      console.error("Failed to fetch videos:", error);
    } finally {
      setLoadingCurrentSummaries(false);
    }
  };

  const handleVideoClick = (video: YouTubePlayerVideo) => {
    setCurrentVideo(video);
    setPlayerState("screen");
  };

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
        setCurrentNote,
        exploreVideos,
        setExploreVideos,
        currentVideoTranscript,
        setCurrentVideoTranscript,
        loadingCurrentVideoTranscript,
        setLoadingCurrentVideoTranscript,
        currentWhisperTranscript,
        setCurrentWhisperTranscript,
        loadingCurrentWhisperTranscript,
        setLoadingCurrentWhisperTranscript,
        currentKeyConcepts,
        setCurrentKeyConcepts,
        currentSummary,
        setCurrentSummary,
        loadingCurrentSummaries,
        setLoadingCurrentSummaries,
        currentStudyTool,
        setCurrentStudyTool,
        currentFlashCards,
        setCurrentFlashCards,
        loadingCurrentFlashCards,
        setLoadingCurrentFlashCards,
        currentIndex,
        setCurrentIndex,
        flipped,
        setFlipped,
        isAnimating,
        setIsAnimating,
        disableAnimation,
        setDisableAnimation,
        generateSummaries,
        handleVideoClick,
        theaterMode,
        setTheaterMode,
        addToLibraryVisible,
        setAddToLibraryVisible,
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
