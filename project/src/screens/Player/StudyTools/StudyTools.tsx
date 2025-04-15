"use client";
import { useContext } from "react";
import { appTheme } from "../../../util/appTheme";
import { AuthContext } from "../../../contexts/authContext";
import React, { useEffect, useState } from "react";
import GPT from "@/components/GPT/GPT";
export type StudyToolTypes = "Notes" | "Quizzes" | "Flash Cards";

const StudyTools = () => {
  const { currentUser } = useContext(AuthContext);
  const [currentStudyTool, setCurrentStudyTool] =
    useState<StudyToolTypes>("Notes");

  const handleStudyToolClick = (tool: StudyToolTypes) => {
    setCurrentStudyTool(tool);
  };

  if (!currentUser) return <></>;

  return (
    <div className="w-[100%] h-[100%]">
      <div className="h-[60px] bg-gray-400 rounded-[6px] flex flex-row items-center justify-center">
        <div
          className={`cursor-pointer w-[33%] h-[40px] rounded-[5px] flex justify-center items-center text-[calc(10px+0.2vw)] ${
            currentStudyTool === "Notes"
              ? "brightness-100 bg-black"
              : "brightness-90"
          }`}
          onClick={() => handleStudyToolClick("Notes")}
        >
          Notes
        </div>
        <div
          className={`cursor-pointer w-[33%] h-[40px] rounded-[5px] flex justify-center items-center text-[calc(10px+0.2vw)] ${
            currentStudyTool === "Quizzes"
              ? "brightness-100 bg-black"
              : "brightness-90"
          }`}
          onClick={() => handleStudyToolClick("Quizzes")}
        >
          Quizzes
        </div>
        <div
          className={`cursor-pointer w-[33%] h-[40px] rounded-[5px] flex justify-center items-center text-[calc(10px+0.2vw)] ${
            currentStudyTool === "Flash Cards"
              ? "brightness-100 bg-black"
              : "brightness-90"
          }`}
          onClick={() => handleStudyToolClick("Flash Cards")}
        >
          Flash Cards
        </div>
      </div>
      <div className="h-[calc(100%-60px)]">
        {/* <GPT /> */}
      </div>
    </div>
  );
};

export default StudyTools;
