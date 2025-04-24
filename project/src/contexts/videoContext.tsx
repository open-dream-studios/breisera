"use client";
import React, { createContext, useState, useContext, useEffect } from "react";
import { vid } from "../../video_db";
import { StudyToolTypes } from "@/screens/Player/StudyTools/StudyTools";
import {
  QueryObserverResult,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";
import { AuthContext } from "./authContext";
import { makeRequest } from "@/util/axios";

export type YouTubePlayerVideo = {
  id: string;
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
  currentNote: Note;
  setCurrentNote: (newCurrentNote: Note) => void;
  exploreVideos: ExploreVideos;
  setExploreVideos: (newExploreVideos: ExploreVideos) => void;
  currentVideoTranscript: VideoTranscript;
  setCurrentVideoTranscript: (newVideoTranscript: VideoTranscript) => void;
  loadingCurrentVideoTranscript: boolean;
  setLoadingCurrentVideoTranscript: (
    newLoadingCurrentVideoTranscript: boolean
  ) => void;
  currentKeyConcepts: KeyConcepts;
  setCurrentKeyConcepts: (newKeyConcepts: KeyConcepts) => void;
  loadingCurrentKeyConcepts: boolean;
  setLoadingCurrentKeyConcepts: (newLoadingCurrentKeyConcepts: boolean) => void;
  currentSummary: Summary;
  setCurrentSummary: (newSummary: Summary) => void;
  loadingCurrentSummary: boolean;
  setLoadingCurrentSummary: (newLoadingCurrentSummary: boolean) => void;
  currentStudyTool: StudyToolTypes;
  setCurrentStudyTool: (newCurrentStudyTool: StudyToolTypes) => void;
  notesData: any[];
  isLoadingNotesData: boolean;
  refetchNotesData: () => Promise<QueryObserverResult<any[], Error>>;
  currentFlashCards: FlashCard[];
  setCurrentFlashCards: (newCurrentFlashCards: FlashCard[]) => void;
};

export type VideoTranscriptBit = {
  text: string;
  offset: number;
  duration: number;
  lang?: string;
};
export type VideoTranscript = null | VideoTranscriptBit[];

export type KeyConcept = {
  key: string;
  concept: string;
};
export type KeyConcepts = null | KeyConcept[];

export type Summary = null | string;

export type FlashCard = {
  question: string;
  answer: string;
};

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export const VideoProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { currentUser } = useContext(AuthContext);
  const {
    data: notesData,
    isLoading: isLoadingNotesData,
    refetch: refetchNotesData,
  } = useQuery<any>({
    queryKey: ["notes", currentUser?.user_id],
    queryFn: async () => {
      const res = await makeRequest.post("/api/users/get-notes", {
        user_id: currentUser?.user_id,
      });
      return res.data.notes;
    },
    enabled: !!currentUser?.user_id,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    // refetchOnMount: true,
  });

  const [currentVideo, setCurrentVideo] = useState<YouTubePlayerVideo | null>(
    vid
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
  const [currentKeyConcepts, setCurrentKeyConcepts] =
    useState<KeyConcepts>(null);
  const [loadingCurrentKeyConcepts, setLoadingCurrentKeyConcepts] =
    useState<boolean>(true);

  const [currentSummary, setCurrentSummary] = useState<Summary>(null);
  const [loadingCurrentSummary, setLoadingCurrentSummary] =
    useState<boolean>(true);

  const [currentFlashCards, setCurrentFlashCards] = useState<FlashCard[]>([
    { question: "What is the capital of France?", answer: "Paris" },
    { question: "What is 2 + 2?", answer: "4" },
    {
      question: "What is minimum the boiling point of water?",
      answer: "100°C",
    },
  ]);

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
        setCurrentNote,
        exploreVideos,
        setExploreVideos,
        currentVideoTranscript,
        setCurrentVideoTranscript,
        loadingCurrentVideoTranscript,
        setLoadingCurrentVideoTranscript,
        currentKeyConcepts,
        setCurrentKeyConcepts,
        loadingCurrentKeyConcepts,
        setLoadingCurrentKeyConcepts,
        currentSummary,
        setCurrentSummary,
        loadingCurrentSummary,
        setLoadingCurrentSummary,
        currentStudyTool,
        setCurrentStudyTool,
        notesData,
        isLoadingNotesData,
        refetchNotesData,
        currentFlashCards,
        setCurrentFlashCards,
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
