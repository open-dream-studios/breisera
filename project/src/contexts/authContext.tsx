"use client";
import { createContext, ReactNode, useEffect } from "react";
import { makeRequest } from "../util/axios";
import { ThemeType } from "../util/appTheme";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useModal1Store, useModal2Store } from "@/store/useModalStore";
import { useLeftBarOpenStore } from "@/store/useLeftBarOpenStore";

export interface User {
  id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_img_src: string | null;
  theme: ThemeType;
  credits: string;
  auth_provider: string;
  created_at: string;
}

interface AuthContextType {
  currentUser: User | null;
  currentUserSubscription: any;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  currentUserSubscription: null,
  logout: () => {},
});

interface AuthContextProviderProps {
  children: ReactNode;
}

export const AuthContextProvider = ({ children }: AuthContextProviderProps) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const modal1 = useModal1Store((state: any) => state.modal1);
  const setModal1 = useModal1Store((state: any) => state.setModal1);
  const modal2 = useModal2Store((state: any) => state.modal2);
  const setModal2 = useModal2Store((state: any) => state.setModal2);
  const setLeftBarOpen = useLeftBarOpenStore(
    (state: any) => state.setLeftBarOpen
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (
        storedUser &&
        storedUser !== "undefined" &&
        storedUser !== "null" &&
        JSON.parse(storedUser).id
      ) {
        queryClient.setQueryData(["currentUser"], JSON.parse(storedUser));
      }
    }
  }, [queryClient]);

  const { data: currentUserData } = useQuery<User | null>({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const res = await makeRequest.get("/api/users/current");
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
  });
  const currentUser = currentUserData ?? null;

  const { data: currentUserSubscriptionData } = useQuery<any>({
    queryKey: ["currentUserSubscription"],
    queryFn: async () => {
      const res = await makeRequest.get("/api/users/current-subscription");
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
  });
  const currentUserSubscription = currentUserSubscriptionData ?? null;

  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      document.cookie =
        "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
    queryClient.clear();
    router.push("/");

    setModal1({
      ...modal1,
      open: false,
    });
    setModal2({
      ...modal2,
      open: false,
    });
    setLeftBarOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentUserSubscription,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
