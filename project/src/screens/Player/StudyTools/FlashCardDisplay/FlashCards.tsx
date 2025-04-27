"use client";
import { useContext, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { AuthContext } from "@/contexts/authContext";
import { appTheme } from "@/util/appTheme";
import { useVideo } from "@/contexts/videoContext";
import { Skeleton } from "@/components/ui/skeleton";
import { timeStampInjection } from "@/util/functions/YouTubeData";

const FlashCards = () => {
  const { currentUser } = useContext(AuthContext);
  const {
    currentFlashCards,
    loadingCurrentFlashCards,
    currentIndex,
    setCurrentIndex,
    isAnimating,
    setIsAnimating,
    flipped,
    setFlipped,
    disableAnimation,
    setDisableAnimation,
  } = useVideo();

  const card = currentFlashCards.content[currentIndex];

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const selection = window.getSelection();
    const isTextSelected = selection && selection.toString().length > 0;

    if (!isTextSelected) {
      handleFlip();
    }
  };

  const handleFlip = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setFlipped((prev) => !prev);
    setTimeout(() => setIsAnimating(false), 600); // sync with animation duration
  };

  const instantReset = () => {
    // disable animation for one render
    setDisableAnimation(true);
    setFlipped(false);
    setTimeout(() => setDisableAnimation(false), 0); // enable again on next tick
  };

  const goNext = () => {
    if (flipped) instantReset(); // avoid animation if showing answer
    setCurrentIndex((prev) => (prev + 1) % currentFlashCards.content.length);
  };

  const goBack = () => {
    if (flipped) instantReset(); // avoid animation if showing answer
    setCurrentIndex(
      (prev) =>
        (prev - 1 + currentFlashCards.content.length) %
        currentFlashCards.content.length
    );
  };

  if (
    !currentUser ||
    currentFlashCards.content.length === 0 ||
    !currentFlashCards.flashcard_id
  )
    return;

  return (
    <div className="h-[100%] pt-[20px] px-[20px]">
      {loadingCurrentFlashCards ? (
        <div className="w-[100%] flex flex-col items-center">
          <Skeleton
            className={`w-[100%] aspect-[2/1.5] mb-[18px] ${
              currentUser.theme === "dark"
                ? "brightness-25"
                : "brightness-[90%]"
            }`}
          />
          <Skeleton
            className={`w-[75%] h-[20px] mb-[18px] ${
              currentUser.theme === "dark"
                ? "brightness-25"
                : "brightness-[90%]"
            }`}
          />
        </div>
      ) : (
        <div className="h-[100%] flex flex-col items-center">
          <motion.div
            className="w-full max-w-md aspect-[2/1.5] relative"
            onClick={handleClick}
            initial={false}
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={
              disableAnimation
                ? { duration: 0 }
                : { duration: 0.6, ease: "easeInOut" }
            }
            style={{ transformStyle: "preserve-3d", cursor: "pointer" }}
          >
            <motion.div
              className="absolute overflow-hidden w-[100%] h-[100%] flex items-center pb-[5px] px-[20px] justify-center text-center rounded-[18px] shadow-xl text-[15px] leading-[23px] font-semibold cursor-pointer"
              style={{
                backfaceVisibility: "hidden",
                rotateY: 0,
                backgroundColor: appTheme[currentUser.theme].background_2,
              }}
            >
              <div className="">
                {timeStampInjection(currentUser.theme, card.question)}
              </div>
            </motion.div>

            <motion.div
              className="absolute overflow-hidden w-[100%] h-[100%] flex items-center pb-[5px] px-[20px] justify-center text-center rounded-[18px] shadow-xl text-[15px] leading-[23px] font-semibold cursor-pointer"
              style={{
                backfaceVisibility: "hidden",
                rotateY: 180,
                backgroundColor: appTheme[currentUser.theme].background_2,
              }}
            >
              <div className="">
                {timeStampInjection(currentUser.theme, card.answer)}
              </div>
            </motion.div>
          </motion.div>

          <div className="mt-[17px] font-[300] text-[15px] lg:text-[20px]">
            {currentIndex + 1} / {currentFlashCards.content.length}
          </div>

          <div className="mt-8 flex gap-8 mb-[50px]">
            <button
              onClick={goBack}
              style={{
                backgroundColor: appTheme[currentUser.theme].background_2,
              }}
              className={`${
                currentIndex === 0 && "opacity-50 pointer-events-none"
              } w-14 h-14 rounded-full shadow-lg dim cursor-pointer hover:brightness-75 flex items-center justify-center`}
            >
              <ArrowLeft />
            </button>
            <button
              onClick={goNext}
              style={{
                backgroundColor: appTheme[currentUser.theme].background_2,
              }}
              className={`${
                currentIndex === currentFlashCards.content.length - 1 &&
                "opacity-50 pointer-events-none"
              } w-14 h-14 rounded-full shadow-lg dim cursor-pointer hover:brightness-75 flex items-center justify-center`}
            >
              <ArrowRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlashCards;
