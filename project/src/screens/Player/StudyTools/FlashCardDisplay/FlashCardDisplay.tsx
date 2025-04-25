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
import { LiaTrashAltSolid } from "react-icons/lia";
import { generateUniqueId } from "@/util/functions/Data";

type FlashCardsListProps = {
  flashCardsOpen: boolean;
  setFlashCardsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleDeleteFlashCards: (flashcard_id: string) => void;
  smallScreen: boolean;
};

const FlashCardsList = ({
  flashCardsOpen,
  setFlashCardsOpen,
  handleDeleteFlashCards,
  smallScreen,
}: FlashCardsListProps) => {
  const { currentUser } = useContext(AuthContext);
  const {
    currentFlashCards,
    setCurrentFlashCards,
    flashCardData,
    setCurrentIndex,
    setIsAnimating,
    setFlipped,
    setDisableAnimation,
  } = useVideo();

  if (!currentUser || !flashCardData) return <></>;

  return (
    <div
      style={{
        backgroundColor: appTheme[currentUser.theme].background_2,
        color: appTheme[currentUser.theme].text_3,
      }}
      className={`${
        smallScreen
          ? !flashCardsOpen
            ? "hidden"
            : "flex sm:hidden"
          : "flex mt-[5px]"
      } z-[502] relative w-[calc(100%+10px)] pr-[10px] h-[100%] flex-col overflow-scroll`}
    >
      <div
        onClick={() => {
          if (!smallScreen && flashCardsOpen) {
            setFlashCardsOpen(false);
          }
        }}
        className={`${
          !smallScreen &&
          flashCardsOpen &&
          "cursor-pointer dim hover:brightness-75"
        } font-[600] text-[20px] leading-[20px] mb-[8px] flex flex-row justify-between`}
        style={{
          color: appTheme[currentUser.theme].text_1,
        }}
      >
        {smallScreen ? "Saved Flash Cards" : "Flash Cards"}
        <FaChevronDown
          style={{ color: appTheme[currentUser.theme].text_2 }}
          className={`w-[22px] h-[22px] transition-all duration-0.3 ease-in-out ${
            flashCardsOpen && "rotate-180"
          }`}
        />
      </div>
      {flashCardsOpen && flashCardData.length === 0 && (
        <div className="mt-[5px] w-[100%]">You have no saved flash cards</div>
      )}
      {flashCardsOpen && (
        <div
          className="flex flex-col mb-[20px]"
          style={{ color: appTheme[currentUser.theme].text_3 }}
        >
          {flashCardData.map((flashcards: any, index: number) => {
            return (
              <div className="" key={index}>
                <div
                  className="w-[100%] h-[1px] my-[10px] rounded-[2px] opacity-75"
                  style={{
                    backgroundColor: appTheme[currentUser.theme].text_3,
                  }}
                />
                <div className="w-[100%] flex flex-row justify-between">
                  <div
                    onClick={() => {
                      setFlashCardsOpen(false);
                      setCurrentIndex(0);
                      setIsAnimating(false);
                      setFlipped(false);
                      setDisableAnimation(false);
                      setCurrentFlashCards({
                        ...currentFlashCards,
                        flashcard_id: flashcards.flashcard_id,
                        title: flashcards.title,
                        content: extractJsonArray(flashcards.content),
                        video_id: flashcards.video_id,
                      });
                    }}
                    className="cursor-pointer dim hover:brightness-75 truncate w-[calc(100%-40px)] font-[600] text-[15px]"
                  >
                    {flashcards.title}
                  </div>
                  <LiaTrashAltSolid
                    onClick={() =>
                      handleDeleteFlashCards(flashcards.flashcard_id)
                    }
                    className="w-[25px] h-[25px] mr-[5px] cursor-pointer dim hover:brightness-75"
                    style={{}}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const FlashCardDisplay = () => {
  const { currentUser } = useContext(AuthContext);
  const {
    currentFlashCards,
    setCurrentFlashCards,
    currentVideo,
    currentVideoTranscript,
    loadingCurrentFlashCards,
    setLoadingCurrentFlashCards,
    flashCardData,
    isLoadingFlashCardData,
    refetchFlashCardData,
    setCurrentIndex,
    setIsAnimating,
    setFlipped,
    setDisableAnimation,
  } = useVideo();

  const [flashcardSetsOpen, setFlashcardSetsOpen] = useState<boolean>(false);

  const generateFlashcards = async () => {
    const topic = "How will Taiwan defend itself";
    if (currentVideo && currentVideoTranscript) {
      setLoadingCurrentFlashCards(true);
      setCurrentIndex(0);
      setIsAnimating(false);
      setFlipped(false);
      setDisableAnimation(false);
      const res = await makeRequest.post(
        BACKEND_URL + "/api/youtube/gemini-flashcards",
        {
          number: 10,
          topic: topic,
          transcript: currentVideoTranscript,
          video: currentVideo
        }
      );
      if (res.status === 200) {
        const geminiResponse = extractJsonArray(res.data.content);
        setCurrentFlashCards({
          flashcard_id: generateUniqueId(),
          title: "",
          content: geminiResponse,
          video_id: currentVideo.id,
        });
      }
      setLoadingCurrentFlashCards(false);
    }
    return "Something went wrong...";
  };

  const writeFlashCards = async () => {
    if (!currentUser) return;
    const flashcardId = currentFlashCards.flashcard_id
      ? currentFlashCards.flashcard_id
      : generateUniqueId();
    setCurrentFlashCards({ ...currentFlashCards, flashcard_id: flashcardId });
    try {
      const res = await makeRequest.post("/api/users/write-flashcards", {
        user_id: currentUser.user_id,
        flashcard_id: flashcardId,
        title: currentFlashCards.title,
        content: JSON.stringify(currentFlashCards.content),
        video_id: currentVideo ? currentVideo.id : null,
      });
      refetchFlashCardData();
    } catch (error) {
      console.error("Failed to update flashcard:", error);
    }
  };

  const handleOpenFlashCards = async () => {
    refetchFlashCardData();
    if (!flashcardSetsOpen) {
      setFlashcardSetsOpen(true);
    }
  };

  const handleDeleteFlashCards = async (flashcard_id: string) => {
    try {
      const res = await makeRequest.post("/api/users/delete-flashcards", {
        user_id: currentUser?.user_id,
        flashcard_id: flashcard_id,
      });
      if (flashcard_id === currentFlashCards.flashcard_id) {
        setCurrentFlashCards({
          ...currentFlashCards,
          flashcard_id: null,
          title: "",
          content: [],
        });
        setCurrentIndex(0);
        setIsAnimating(false);
        setFlipped(false);
        setDisableAnimation(false);
      }
      refetchFlashCardData();
    } catch (error) {
      console.error("Failed to delete flash card set:", error);
    }
  };

  if (!currentUser) return;

  return (
    <div className="w-[100%] h-[100%] flex flex-col gap-[8px]">
      <div
        style={{ backgroundColor: appTheme[currentUser.theme].background_2 }}
        className={`sm:flex flex-col hidden w-[100%] ${
          flashcardSetsOpen
            ? "h-[200px] max-h-[200px] overflow-scroll"
            : "h-[50px] cursor-pointer dim hover:brightness-75"
        } rounded-[5px] px-[15px] pt-[8px] relative`}
        onClick={handleOpenFlashCards}
      >
        <FlashCardsList
          flashCardsOpen={flashcardSetsOpen}
          setFlashCardsOpen={setFlashcardSetsOpen}
          handleDeleteFlashCards={handleDeleteFlashCards}
          smallScreen={false}
        />
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

            <div
              onClick={writeFlashCards}
              className="ml-[10px] dim hover:brightness-75 cursor-pointer font-[600] text-[16px] py-[5px] px-[13px] rounded-[5px] flex flex-row items-center justify-center gap-[5px]"
              style={{
                backgroundColor: appTheme[currentUser.theme].text_1,
                color: appTheme[currentUser.theme].background_1,
              }}
            >
              <BsLightningChargeFill className="w-[16px] h-[16px] mt-[-2px]" />
              Save
            </div>
          </div>
          <FlashCards />
        </div>
      </div>
    </div>
  );
};

export default FlashCardDisplay;
