"use client"
import { useContext } from "react";
import { AuthContext, User } from "../../contexts/authContext";
import { HiBars3 } from "react-icons/hi2";
import { appTheme, ThemeType } from "../../util/appTheme";
import {
  useLeftBarOpenStore,
  useLeftBarRefStore,
} from "../../store/useLeftBarOpenStore";
import { BsSuitDiamondFill } from "react-icons/bs";
import { LuSun } from "react-icons/lu";
import { IoMoonOutline } from "react-icons/io5";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "../../util/axios";
import { useModal1Store } from "../../store/useModalStore";
import appDetails from "../../util/appDetails.json";
import Settings from "../Settings/Settings";
import {
  capitalizeFirstLetter,
  removeWhiteSpace,
} from "../../util/functions/Data";

const Navbar = () => {
  const queryClient = useQueryClient();
  const { currentUser, currentUserSubscription } = useContext(AuthContext);
  const modal1 = useModal1Store((state: any) => state.modal1);
  const setModal1 = useModal1Store((state: any) => state.setModal1);
  const leftBarOpen = useLeftBarOpenStore((state: any) => state.leftBarOpen);
  const setLeftBarOpen = useLeftBarOpenStore(
    (state: any) => state.setLeftBarOpen
  );
  const leftBarRef = useLeftBarRefStore((state) => state.leftBarRef);

  const toggleLeftBar = () => {
    if (leftBarRef && leftBarRef.current) {
      leftBarRef.current.style.transition = "right 0.3s ease-in-out";
    }
    setLeftBarOpen(!leftBarOpen);
    setTimeout(() => {
      if (leftBarRef && leftBarRef.current) {
        leftBarRef.current.style.transition = "none";
      }
    }, 300);
  };

  const handleTokensClick = () => {
    setModal1({
      ...modal1,
      open: !modal1.open,
      showClose: true,
      offClickClose: true,
      width: "w-[90vw] md:w-[80vw]",
      maxWidth: "md:max-w-[1000px]",
      aspectRatio: "aspect-[2/2.1] md:aspect-[3/2]",
      borderRadius: "rounded-[15px] md:rounded-[20px]",
      content: <Settings initialPage={"Subscription"} />,
    });
  };

  const handleProfileClick = () => {
    setModal1({
      ...modal1,
      open: !modal1.open,
      showClose: true,
      offClickClose: true,
      width: "w-[90vw] md:w-[80vw]",
      maxWidth: "md:max-w-[1000px]",
      aspectRatio: "aspect-[2/2.1] md:aspect-[3/2]",
      borderRadius: "rounded-[15px] md:rounded-[20px]",
      content: <Settings initialPage={"Account"} />,
    });
  };

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
    <div
      style={
        {
          "--nav-height": `${appDetails.nav_height}px`,
          "--left-bar-width": removeWhiteSpace(appDetails.left_bar_width),
          "--nav-ml": appDetails.left_bar_width,
          backgroundColor: appTheme[currentUser.theme].background_1,
        } as React.CSSProperties
      }
      className={`fixed z-[900] ${
        appDetails.left_bar_full
          ? "w-[100vw] lg:w-[calc(100vw-(var(--left-bar-width))] lg:ml-[calc(var(--nav-ml))]"
          : "w-[100vw]"
      } h-[var(--nav-height)]`}
    >
      <div className="w-[100%] h-[100%] absolute flex justify-between items-center">
        <div className="flex flex-row items-center px-[18px]">
          <HiBars3
            onClick={() => {
              toggleLeftBar();
            }}
            className="w-[30px] dim cursor-pointer lg:hidden hover:brightness-75"
            color={appTheme[currentUser.theme].text_1}
            fontSize={29}
          />
          <div className="flex flex-row gap-[5px] items-center">
            {currentUser.theme === "dark" ? (
              <img
                src="/assets/logo-white.png"
                alt="logo"
                className="hidden lg:block select-none ml-[3px] w-[22px] h-[22px] object-cover"
              />
            ) : (
              <img
                src="/assets/logo-black.png"
                alt="logo"
                className="hidden lg:block select-none ml-[3px] w-[22px] h-[22px] object-cover"
              />
            )}
            <p
              className="dim select-none text-[23px] font-[700] ml-[10px] hover:brightness-75"
              style={{
                color: appTheme[currentUser.theme].text_1,
              }}
            >
              {appDetails.project_name}
            </p>
          </div>
        </div>

        <div className="h-[100%] mr-[10px] pr-[2px] flex flex-row items-center gap-[18px]">
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

          {currentUserSubscription && (
            <div
              className="w-[150px]  h-[42px] flex flex-row justify-center items-center gap-[8px] dim cursor-pointer hover:brightness-75 rounded-[4px]"
              style={{
                backgroundColor: appTheme[currentUser.theme].background_2,
              }}
              title="subscription"
            >
              <p
                className="font-[500] text-[15px] rounded-[7px]"
                style={{
                  color: appTheme[currentUser.theme].text_1,
                }}
              >
                {capitalizeFirstLetter(currentUserSubscription.status)} |{" "}
                {currentUserSubscription.subscription_item}
              </p>
            </div>
          )}

          <div
            onClick={handleTokensClick}
            className="w-[75px]  h-[42px] flex flex-row justify-center items-center gap-[8px] dim cursor-pointer hover:brightness-75 rounded-[4px]"
            style={{
              backgroundColor: appTheme[currentUser.theme].background_2,
            }}
            title="tokens"
          >
            <BsSuitDiamondFill
              size={16}
              color={appTheme[currentUser.theme].text_1}
            />
            <p
              className="font-[500] text-[15px] rounded-[7px]"
              style={{
                color: appTheme[currentUser.theme].text_1,
              }}
            >
              {currentUser.credits}
            </p>
          </div>

          <div
            onClick={handleProfileClick}
            className="dim cursor-pointer flex flex-row w-[160px] h-[42px] hover:brightness-75 rounded-[4px]"
            style={{
              backgroundColor: appTheme[currentUser.theme].background_2,
            }}
          >
            <div className="ml-[3px] mr-[5px] aspect-[1/1] h-[100%] p-[6px]">
              {currentUser.profile_img_src !== null ? (
                <img
                  className="w-full h-full rounded-full"
                  src={currentUser.profile_img_src}
                />
              ) : (
                <div
                  className="w-full h-full relative overflow-hidden rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: appTheme[currentUser.theme].background_4,
                  }}
                >
                  <div className="bg-white w-[12px] h-[12px] absolute top-[7px] rounded-full"></div>
                  <div
                    className="bg-white w-[18px] h-[12px] absolute top-[21px]"
                    style={{
                      borderRadius: "20px",
                    }}
                  ></div>
                </div>
              )}
            </div>
            <div className="flex flex-col justify-center mt-[0.5px] gap-[1px] flex-1 h-[100%] overflow-hidden pr-[4px]">
              <div
                className="truncate text-[14px] leading-[17px] font-[500]"
                style={{
                  color: appTheme[currentUser.theme].text_1,
                }}
              >
                {currentUser.first_name} {currentUser.last_name}
              </div>
              <div
                className="truncate text-[12px] leading-[15px] font-[200]"
                style={{
                  color: appTheme[currentUser.theme].text_2,
                }}
              >
                {currentUser.email}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
