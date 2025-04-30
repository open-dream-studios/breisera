"use client";

import { AuthContext } from "@/contexts/authContext";
import { appTheme, ThemeType } from "@/util/appTheme";
import { makeRequest } from "@/util/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { User } from "firebase/auth";
import { useContext } from "react";
import { IoMoonOutline } from "react-icons/io5";
import { LuSun } from "react-icons/lu";

const UserSettings = () => {
  const { currentUser } = useContext(AuthContext);
  const queryClient = useQueryClient();

  const toggleThemeMutation = useMutation<
    void,
    Error,
    ThemeType,
    { previousUser: User | null }
  >({
    mutationFn: async (newTheme) => {
      await makeRequest.put("/api/users/update-current", { theme: newTheme });
    },
    onMutate: (newTheme) => {
      queryClient.cancelQueries({ queryKey: ["currentUser"] });
      const previousUser =
        queryClient.getQueryData<User | null>(["currentUser"]) ?? null;

      // Optimistically update UI
      queryClient.setQueryData(["currentUser"], (oldData: User | null) =>
        oldData ? { ...oldData, theme: newTheme } : oldData
      );
      return { previousUser };
    },
    onError: (_, __, context) => {
      if (context?.previousUser) {
        queryClient.setQueryData(["currentUser"], context.previousUser);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });

  const handleThemeChange = () => {
    if (!currentUser) return;
    const newTheme = currentUser.theme === "light" ? "dark" : "light";
    toggleThemeMutation.mutate(newTheme);
  };

  if (!currentUser) return;

  return (
    <div className="w-full h-full flex flex-col pt-[50px]">
      <div className="w-[90%] ml-[1%] md:ml-[2%] flex flex-col items-center justify-center">
        <p className="font-[600] lg:mb-[18px] mb-[15px] text-[29px] leading-[29px] md:text-[32px] md:leading-[32px] w-[100%] items-start">
          Settings
        </p>
      </div>

      <div
        className="dim cursor-pointer hover:brightness-75"
        onClick={handleThemeChange}
      >
        {currentUser.theme === "dark" ? (
          <LuSun
            size={23}
            title="Light Mode"
            className=""
            color={appTheme[currentUser.theme].text_1}
          />
        ) : (
          <IoMoonOutline
            size={23}
            title="Dark Mode"
            className=""
            color={appTheme[currentUser.theme].text_1}
          />
        )}
      </div>
    </div>
  );
};

export default UserSettings;
