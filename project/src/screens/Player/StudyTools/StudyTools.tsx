"use client";
import { useContext } from "react";
import { appTheme } from "../../../util/appTheme";
import { AuthContext } from "../../../contexts/authContext";
import React, { useState } from "react";
import GPT from "@/components/GPT/GPT";
import FlashCardDisplay from "@/components/StudyTools/FlashCardDisplay/FlashCardDisplay";
import NotesDisplay from "@/components/StudyTools/NotesDisplay/NotesDisplay";
export type StudyToolTypes = "Chat" | "Notes" | "Flash Cards";

const StudyTools = () => {
  const { currentUser } = useContext(AuthContext);
  const [currentStudyTool, setCurrentStudyTool] =
    useState<StudyToolTypes>("Chat");
  const studyTools: StudyToolTypes[] = ["Chat", "Notes", "Flash Cards"];

  const handleStudyToolClick = (tool: StudyToolTypes) => {
    setCurrentStudyTool(tool);
  };

  if (!currentUser) return <></>;

  return (
    <div className="w-[100%] h-[100%] px-[10px] pt-[8px] pb-[12px] flex flex-col gap-[10px]">
      <div
        className="px-[4px] h-[37px] rounded-[6px] flex flex-row items-center justify-center"
        style={{ background: appTheme[currentUser.theme].background_2 }}
      >
        {studyTools.map((tool: StudyToolTypes, index: number) => {
          return (
            <div
              key={index}
              className="group flex flex-row w-[33.3%] h-[30px] relative"
            >
              <div
                style={{
                  backgroundColor:
                    currentStudyTool === tool
                      ? appTheme[currentUser.theme].background_1
                      : appTheme[currentUser.theme].background_2,
                }}
                className={`cursor-pointer w-[100%] h-[100%] rounded-[5px] flex justify-center items-center text-[calc(10px+0.2vw)]`}
                onClick={() => handleStudyToolClick(tool)}
              >
                <p className="dim group-hover:brightness-75">{tool}</p>
              </div>
              {index < 2 &&
                currentStudyTool !== "Notes" &&
                !(currentStudyTool === "Flash Cards" && index === 1) &&
                !(currentStudyTool === "Chat" && index === 0) && (
                  <div
                    className="w-[0.5px] h-[100%] absolute right-0"
                    style={{
                      backgroundColor: appTheme[currentUser.theme].text_4,
                    }}
                  ></div>
                )}
            </div>
          );
        })}
      </div>
      <div
        style={{
          border: currentStudyTool === "Flash Cards" ? `1px solid ${appTheme[currentUser.theme].background_2}` : "none",
        }}
        className="flex-1 rounded-[5px] overflow-hidden"
      >
        <div
          className={`w-[100%] h-[100%] ${
            currentStudyTool !== "Chat" && "hidden"
          }`}
        >
          <GPT />
        </div>
        <div
          className={`w-[100%] h-[100%] ${
            currentStudyTool !== "Notes" && "hidden"
          }`}
        >
          <NotesDisplay />
        </div>
        <div
          className={`w-[100%] h-[100%] ${
            currentStudyTool !== "Flash Cards" && "hidden"
          }`}
        >
          <FlashCardDisplay />
        </div>
      </div>
    </div>
  );
};

export default StudyTools;
