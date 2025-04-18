"use  client"
import React, { useContext } from "react";
import FlashCards from "./FlashCards";
import { BsLightningChargeFill } from "react-icons/bs";
import { AuthContext } from "@/contexts/authContext";
import { appTheme } from "@/util/appTheme";

const FlashCardDisplay = () => {
   const { currentUser } = useContext(AuthContext);
   if (!currentUser) return

  return (
    <div className="w-[100%] h-[100%]" style={{
      backgroundColor: appTheme[currentUser.theme].component_bg_1,
    }}>
      <div className="w-[100%] flex justify-end pt-[20px] px-[20px]">
        <div className="dim hover:brightness-75 cursor-pointer font-[600] text-[16px] py-[5px] px-[13px] rounded-[5px] flex flex-row items-center justify-center gap-[5px]" style={{
          backgroundColor: appTheme[currentUser.theme].text_1,
          color: appTheme[currentUser.theme].background_1
        }}>
          <BsLightningChargeFill className="w-[16px] h-[16px] mt-[-2px]"/>
          Generate
        </div>
      </div>
      <FlashCards />
    </div>
  );
};

export default FlashCardDisplay;
