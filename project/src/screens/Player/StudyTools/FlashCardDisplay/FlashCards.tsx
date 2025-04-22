"use client";
import { useContext, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { AuthContext } from "@/contexts/authContext";
import { appTheme } from "@/util/appTheme";

const flashcards = [
  { question: "What is the capital of France?", answer: "Paris" },
  { question: "What is 2 + 2?", answer: "4" },
  { question: "What is minimum the boiling point of water?", answer: "100°C" },
];

const FlashCards = () => {
  const { currentUser } = useContext(AuthContext);
  if (!currentUser) return;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [disableAnimation, setDisableAnimation] = useState(false);

  const card = flashcards[currentIndex];

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
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
  };

  const goBack = () => {
    if (flipped) instantReset(); // avoid animation if showing answer
    setCurrentIndex(
      (prev) => (prev - 1 + flashcards.length) % flashcards.length
    );
  };

  return (
    <div className="h-[100%] flex flex-col items-center justify-start pt-[20px] px-[20px]">
      {/* <motion.div
        className="w-full max-w-md aspect-[2/1.5] relative"
        onClick={handleFlip}
        initial={false}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={
          disableAnimation
            ? { duration: 0 }
            : { duration: 0.6, ease: "easeInOut" }
        }
        style={{ transformStyle: "preserve-3d", cursor: "pointer" }}
      > */}
      <motion.div
        className="w-full max-w-md aspect-[2/1.5] relative"
        onClick={handleClick} // <-- updated here
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
          className="absolute text-center w-full h-full rounded-2xl shadow-xl flex items-center justify-center text-2xl font-semibold p-6 select-text"
          style={{
            backfaceVisibility: "hidden",
            rotateY: 0,
            backgroundColor: appTheme[currentUser.theme].background_2,
            userSelect: "text",
            cursor: "pointer",
          }}
        >
          {card.question}
        </motion.div>

        <motion.div
          className="absolute w-full h-full rounded-2xl shadow-xl flex items-center justify-center text-2xl font-semibold p-6 select-text"
          style={{
            backfaceVisibility: "hidden",
            rotateY: 180,
            backgroundColor: appTheme[currentUser.theme].background_2_2,
            userSelect: "text",
            cursor: "pointer",
          }}
        >
          {card.answer}
        </motion.div>
      </motion.div>

      <div className="mt-8 flex gap-8 mb-[50px]">
        <button
          onClick={goBack}
          style={{
            backgroundColor: appTheme[currentUser.theme].background_2,
          }}
          className="w-14 h-14 rounded-full shadow-lg dim cursor-pointer hover:brightness-75 flex items-center justify-center"
        >
          <ArrowLeft />
        </button>
        <button
          onClick={goNext}
          style={{
            backgroundColor: appTheme[currentUser.theme].background_2,
          }}
          className="w-14 h-14 rounded-full shadow-lg dim cursor-pointer hover:brightness-75 flex items-center justify-center"
        >
          <ArrowRight />
        </button>
      </div>
    </div>
  );
};

export default FlashCards;
