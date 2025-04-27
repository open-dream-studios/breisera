"use client";
import {
  ReactNode,
  RefObject,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { AuthContext, AuthContextProvider } from "@/contexts/authContext";
import { useVideo, VideoProvider } from "@/contexts/videoContext";
import Navbar from "@/components/Navbar/Navbar";
import LeftBar from "@/components/LeftBar/LeftBar";
import { appTheme } from "@/util/appTheme";
import { io, Socket } from "socket.io-client";
import { BACKEND_URL } from "@/util/config";
import { handleUpdateUser } from "@/util/functions/User";
import Modals from "@/components/Modals/Modals";
import appDetails from "@/util/appDetails.json";
import Player from "@/screens/Player/Player";
import { usePathname } from "next/navigation";
import LandingNav from "@/screens/Landing/LandingNav/LandingNav";
import LandingLeftBar from "@/screens/Landing/LandingLeftBar/LandingLeftBar";
import {
  useLeftBarOpenStore,
  useLeftBarRefStore,
} from "@/store/useLeftBarOpenStore";
import { QueryProvider } from "@/contexts/queryContext";
import CustomToast from "@/components/CustomToast";
import { usePageLayoutRefStore } from "@/store/usePageLayoutStore";

export default function AppLayout({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContextProvider>
        <QueryProvider>
          <VideoProvider>
            <CustomToast />
            <AppRoot>{children}</AppRoot>
          </VideoProvider>
        </QueryProvider>
      </AuthContextProvider>
    </QueryClientProvider>
  );
}

const AppRoot = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const queryClientRef = useRef(queryClient);
  const { currentUser } = useContext(AuthContext);
  const socketRef = useRef<Socket | null>(null);
  const pathname = usePathname();
  const leftBarRef = useLeftBarRefStore((state) => state.leftBarRef);
  const setLeftBarOpen = useLeftBarOpenStore(
    (state: any) => state.setLeftBarOpen
  );

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
    localStorage.setItem("user", JSON.stringify(currentUser));
  }, [currentUser]);

  return currentUser ? (
    <ProtectedLayout>{children}</ProtectedLayout>
  ) : (
    <UnprotectedLayout />
  );
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
      <Modals landing={false} />
      <Navbar />
      <LeftBar />
      <PageLayout>
        <div
          className={`z-[600] ${
            playerState === "screen" && "w-[100%] h-[100%]"
          } ${
            playerState === "sm" &&
            "fixed w-[400px] h-[225px] bottom-0 right-0 mr-[-1px]"
          } ${playerState === "hidden" && "hidden"}`}
        >
          <Player />
        </div>
        <div
          className={`z-[500] w-[100%] h-[100%] ${
            playerState === "screen" && "hidden"
          }`}
        >
          {children}
        </div>
      </PageLayout>
    </>
  );
};

const PageLayout = ({ children }: { children: ReactNode }) => {
  const { currentUser } = useContext(AuthContext);
  const leftBarOpen = useLeftBarOpenStore((state: any) => state.leftBarOpen);

  const pageLayoutRef = useRef<HTMLDivElement>(null);
  const setPageLayoutRef = usePageLayoutRefStore(
    (state) => state.setPageLayoutRef
  );

  useEffect(() => {
    setPageLayoutRef(pageLayoutRef as RefObject<HTMLDivElement>);
  }, [setPageLayoutRef, pageLayoutRef]);

  if (!currentUser) return;

  return (
    <div
      ref={pageLayoutRef}
      style={
        {
          "--nav-height": `${appDetails.nav_height}px`,
          "--left-bar-width": appDetails.left_bar_width,
          backgroundColor: appTheme[currentUser.theme].background_1,
          color: appTheme[currentUser.theme].text_1,
        } as React.CSSProperties
      }
      className={`absolute left-0 ${
        leftBarOpen && "lg:left-[calc(var(--left-bar-width))]"
      } top-[var(--nav-height)] w-[100vw] ${
        leftBarOpen && "lg:w-[calc(100vw-(var(--left-bar-width)))]"
      } flex h-[calc(100vh-var(--nav-height))] overflow-scroll`}
    >
      <div className="relative w-[100%] h-[100%]">{children}</div>
    </div>
  );
};
