"use client";
import { ReactNode, useContext, useEffect, useRef, useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { AuthContext, AuthContextProvider } from "@/contexts/authContext";
import { useVideo, VideoProvider } from "@/contexts/videoContext";
import Navbar from "@/components/Navbar/Navbar";
import LeftBar from "@/components/LeftBar/LeftBar";
import { appTheme, ThemeType } from "@/util/appTheme";
import { io, Socket } from "socket.io-client";
import { BACKEND_URL } from "@/util/config";
import { handleUpdateUser } from "@/util/functions/User";
import Modals from "@/components/Modals/Modals";
import appDetails from "@/util/appDetails.json";
import Player from "@/screens/Player/Player";
import { usePathname } from "next/navigation";
import LandingNav from "@/screens/Landing/LandingNav/LandingNav";
import LandingLeftBar from "@/screens/Landing/LandingLeftBar/LandingLeftBar";

export default function AppLayout({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContextProvider>
        <VideoProvider>
          <AppRoot>{children}</AppRoot>
        </VideoProvider>
      </AuthContextProvider>
    </QueryClientProvider>
  );
}

const AppRoot = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const queryClientRef = useRef(queryClient);
  const { currentUser } = useContext(AuthContext);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    queryClient.invalidateQueries({
      queryKey: ["currentUserSubscription"],
    });
  }, []);

  useEffect(() => {
    queryClientRef.current = queryClient;
  }, [queryClient]);

  useEffect(() => {
    if (!socketRef.current) {
      const socket = io(BACKEND_URL);
      socketRef.current = socket;
      socket.connect();
      socket.on("update-user", () => handleUpdateUser(queryClientRef.current));
      // socket.on("connect", () => console.log(`Connected: ${socket.id}`));
      // socket.on("disconnect", () => console.log("Disonnected"));
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    console.log(currentUser, "updated!!");
    localStorage.setItem("user", JSON.stringify(currentUser));
    if (currentUser) {
      document.body.style.backgroundColor =
        appTheme[currentUser.theme].background_1;
    }
  }, [currentUser]);

  if (!currentUser) {
    return <UnprotectedLayout />;
  }
  return <ProtectedLayout>{children}</ProtectedLayout>;
};

const UnprotectedLayout = () => {
  return (
    <>
      <Modals landing={true} />
      <LandingNav />
      <LandingLeftBar />
    </>
  );
};

const ProtectedLayout = ({ children }: { children: ReactNode }) => {
  const { playerState } = useVideo();
  return (
    <>
      <Modals landing={true} />
      <Navbar />
      <LeftBar />
      <PageLayout>
        <div
          className={`z-[600] absolute ${
            playerState === "screen" && "top-0 left-0 w-[100%] h-[100%]"
          } ${playerState === "sm" && "w-[400px] h-[225px] bottom-0 right-0 mr-[-1px] fixed"} ${
            playerState === "hidden" && "hidden"
          }`}
        >
          <Player />
        </div>
        <div className="z-[500] w-[100%] h-[100%]">{children}</div>
      </PageLayout>
    </>
  );
};

const PageLayout = ({ children }: { children: ReactNode }) => {
  const { currentUser } = useContext(AuthContext);
  if (!currentUser) return;

  return (
    <div
      style={
        {
          "--nav-height": `${appDetails.nav_height}px`,
          "--left-bar-width": appDetails.left_bar_width,
          backgroundColor: appTheme[currentUser.theme].background_1,
          color: appTheme[currentUser.theme].text_1,
        } as React.CSSProperties
      }
      className={`absolute left-0 lg:left-[calc(var(--left-bar-width))] top-[var(--nav-height)] w-[100vw] lg:w-[calc(100vw-(var(--left-bar-width)))] flex h-[calc(100vh-var(--nav-height))] overflow-scroll`}
    >
      {children}
    </div>
  );
};
