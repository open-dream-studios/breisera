"use client";
import React, { createContext, useState, useContext, useEffect } from "react";
import { vid } from "../../video_db";
import { StudyToolTypes } from "@/screens/Player/StudyTools/StudyTools";
import {
  QueryObserverResult,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
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

export type VideoTranscriptBit = {
  text: string;
  offset: number;
  duration: number;
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
  currentKeyConcepts: KeyConcepts;
  setCurrentKeyConcepts: React.Dispatch<React.SetStateAction<KeyConcepts>>;
  loadingCurrentKeyConcepts: boolean;
  setLoadingCurrentKeyConcepts: React.Dispatch<React.SetStateAction<boolean>>;
  currentSummary: Summary;
  setCurrentSummary: React.Dispatch<React.SetStateAction<Summary>>;
  loadingCurrentSummary: boolean;
  setLoadingCurrentSummary: React.Dispatch<React.SetStateAction<boolean>>;
  currentStudyTool: StudyToolTypes;
  setCurrentStudyTool: React.Dispatch<React.SetStateAction<StudyToolTypes>>;
  notesData: any[];
  isLoadingNotesData: boolean;
  refetchNotesData: () => Promise<QueryObserverResult<any[], Error>>;
  currentFlashCards: FlashCards;
  setCurrentFlashCards: React.Dispatch<React.SetStateAction<FlashCards>>;
  loadingCurrentFlashCards: boolean;
  setLoadingCurrentFlashCards: React.Dispatch<React.SetStateAction<boolean>>;
  flashCardData: any[];
  isLoadingFlashCardData: boolean;
  refetchFlashCardData: () => Promise<QueryObserverResult<any[], Error>>;
  currentIndex: number;
  setCurrentIndex: React.Dispatch<React.SetStateAction<number>>;
  flipped: boolean;
  setFlipped: React.Dispatch<React.SetStateAction<boolean>>;
  isAnimating: boolean;
  setIsAnimating: React.Dispatch<React.SetStateAction<boolean>>;
  disableAnimation: boolean;
  setDisableAnimation: React.Dispatch<React.SetStateAction<boolean>>;
};

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export const VideoProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { currentUser } = useContext(AuthContext);
  const queryClient = useQueryClient();

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

  const {
    data: flashCardData,
    isLoading: isLoadingFlashCardData,
    refetch: refetchFlashCardData,
  } = useQuery<any>({
    queryKey: ["flashcards", currentUser?.user_id],
    queryFn: async () => {
      const res = await makeRequest.post("/api/users/get-flashcards", {
        user_id: currentUser?.user_id,
      });
      return res.data.flashcards;
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
        loadingCurrentFlashCards,
        setLoadingCurrentFlashCards,
        flashCardData,
        isLoadingFlashCardData,
        refetchFlashCardData,
        currentIndex,
        setCurrentIndex,
        flipped,
        setFlipped,
        isAnimating,
        setIsAnimating,
        disableAnimation,
        setDisableAnimation,
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
