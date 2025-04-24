"use  client";
import React, { useContext, useState } from "react";
import FlashCards from "./FlashCards";
import { BsLightningChargeFill } from "react-icons/bs";
import { AuthContext } from "@/contexts/authContext";
import { appTheme } from "@/util/appTheme";
import { FaChevronDown } from "react-icons/fa6";
import { useVideo } from "@/contexts/videoContext";
import { makeRequest } from "@/util/axios";
import { BACKEND_URL } from "@/util/config";
import { extractJsonArray } from "@/util/functions/YouTubeData";

const FlashCardDisplay = () => {
  const { currentUser } = useContext(AuthContext);
  const {
    currentVideo,
    currentVideoTranscript,
    setCurrentFlashCards,
    loadingCurrentFlashCards,
    setLoadingCurrentFlashCards,
  } = useVideo();
  const [flashcardSetsOpen, setFlashcardSetsOpen] = useState<boolean>(false);

  const generateFlashcards = async () => {
    const topic = "How will Taiwan defend itself";
    if (currentVideo && currentVideoTranscript) {
      setLoadingCurrentFlashCards(true);
      const res = await makeRequest.post(
        BACKEND_URL + "/api/youtube/gemini-flashcards",
        {
          number: 10,
          topic: topic,
          transcript: currentVideoTranscript,
        }
      );
      if (res.status === 200) {
        const geminiResponse = extractJsonArray(res.data.content);
        console.log(geminiResponse);
        setCurrentFlashCards(geminiResponse);
      }
      setLoadingCurrentFlashCards(false);
    }
    return "Something went wrong...";
  };

  if (!currentUser) return;

  return (
    <div className="w-[100%] h-[100%] flex flex-col gap-[8px]">
      <div
        style={{
          backgroundColor: appTheme[currentUser.theme].component_bg_1,
          color: appTheme[currentUser.theme].text_2,
          border: `1px solid ${appTheme[currentUser.theme].background_2}`,
        }}
        className={`w-[100%] ${
          flashcardSetsOpen
            ? "h-[200px] min-h-[200px] max-h-[200px]"
            : "h-[46px] min-h-[46px] cursor-pointer dim hover:brightness-75"
        } rounded-[5px] flex justify-between px-[15px] pt-[10px]`}
        onClick={() => {
          if (!flashcardSetsOpen) {
            setFlashcardSetsOpen(true);
          }
        }}
      >
        <div
          onClick={() => {
            if (flashcardSetsOpen) {
              setFlashcardSetsOpen(false);
            }
          }}
          className={`${
            flashcardSetsOpen && "cursor-pointer dim hover:brightness-75"
          }
             w-[100%] font-[600] text-[20px] leading-[20px] mb-[8px] flex flex-row justify-between`}
          style={{
            color: appTheme[currentUser.theme].text_1,
          }}
        >
          Saved
          <FaChevronDown
            style={{ color: appTheme[currentUser.theme].text_2 }}
            className={`w-[22px] h-[22px] transition-all duration-0.3 ease-in-out ${
              flashcardSetsOpen && "rotate-180"
            }`}
          />
        </div>
      </div>
      <div
        className="relative flex flex-col h-[100%] w-[100%] rounded-[5px]"
        style={{
          backgroundColor: appTheme[currentUser.theme].component_bg_1,
          border: `1px solid ${appTheme[currentUser.theme].background_2}`,
        }}
      >
        <div className="w-[100%] h-[100%]">
          <div className="w-[100%] flex justify-start pt-[20px] px-[20px]">
            {loadingCurrentFlashCards ? (
              <div
                className="font-[600] text-[16px] py-[5px] px-[15px] rounded-[5px] flex flex-row items-center justify-center gap-[5px]"
                style={{
                  backgroundColor: appTheme[currentUser.theme].text_1,
                  color: appTheme[currentUser.theme].background_1,
                }}
              >
                Generating...
              </div>
            ) : (
              <div
                onClick={generateFlashcards}
                className="dim hover:brightness-75 cursor-pointer font-[600] text-[16px] py-[5px] px-[13px] rounded-[5px] flex flex-row items-center justify-center gap-[5px]"
                style={{
                  backgroundColor: appTheme[currentUser.theme].text_1,
                  color: appTheme[currentUser.theme].background_1,
                }}
              >
                <BsLightningChargeFill className="w-[16px] h-[16px] mt-[-2px]" />
                Generate
              </div>
            )}
          </div>
          <FlashCards />
        </div>
      </div>
    </div>
  );
};

export default FlashCardDisplay;
