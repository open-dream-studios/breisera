import { create } from "zustand";

export type YouTubePlayerVideo = {
  id: string;
  url: string;
  title: string;
  description: string;
  startTime: number
  channel: string;
  channel_url: string;
  channel_profile: string;
  channel_subs: string;
};

type CurrentPlayerVideoStore = {
  currentPlayerVideo: YouTubePlayerVideo | null;
  setCurrentPlayerVideo: (video: YouTubePlayerVideo | null) => void;
};

export const useCurrentPlayerVideoStore = create<CurrentPlayerVideoStore>((set) => ({
  currentPlayerVideo: {
    id: "rqhp3SYuO_U",
    url: "https://www.youtube.com/watch?t=55&v=rqhp3SYuO_U&embeds_referring_euri=http%3A%2F%2Flocalhost%3A3000%2F",
    title: "Watch: Congressman lashes out at Trump trade chief after tariff pause announced",
    description: "description1",
    startTime: 55,
    channel: "Extesyy",
    channel_url: "https://www.youtube.com/@ExtesyyTV",
    channel_profile: "https://plus.unsplash.com/premium_photo-1666277012916-1c1c7bc88122?q=80&w=1469&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    channel_subs: "6.5M"
  },
  setCurrentPlayerVideo: (video) => set({ currentPlayerVideo: video }),
}));