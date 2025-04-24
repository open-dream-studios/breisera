"use client";
import { useContext } from "react";
import { appTheme } from "../../../util/appTheme";
import { AuthContext } from "../../../contexts/authContext";
import React, { useState } from "react";
import SummaryDisplay from "./SummaryDisplay/SummaryDisplay";
import KeyConceptsDisplay from "./KeyConceptsDisplay/KeyConceptsDisplay";
import TranscriptDisplay from "./TranscriptDisplay/TranscriptDisplay";
export type PrimaryToolTypes = "Summary" | "Key Concepts" | "Transcript";

const PrimaryTools = () => {
  const { currentUser } = useContext(AuthContext);
  const [currentPrimaryTool, setCurrentPrimaryTool] =
    useState<PrimaryToolTypes>("Summary");
  const primaryTools: PrimaryToolTypes[] = [
    "Summary",
    "Key Concepts",
    "Transcript",
  ];

  const handlePrimaryToolClick = (tool: PrimaryToolTypes) => {
    setCurrentPrimaryTool(tool);
  };

  if (!currentUser) return <></>;

  return (
    <div className="w-[100%] px-[10px] pt-[10px] pb-[12px] flex flex-col gap-[10px]">
      <div
        className="select-none px-[4px] h-[37px] rounded-[6px] flex flex-row items-center justify-center"
        style={{ background: appTheme[currentUser.theme].background_2 }}
      >
        {primaryTools.map((tool: PrimaryToolTypes, index: number) => {
          return (
            <div
              key={index}
              className="group flex flex-row w-[33.3%] h-[30px] relative"
            >
              <div
                style={{
                  backgroundColor:
                    currentPrimaryTool === tool
                      ? appTheme[currentUser.theme].background_1
                      : appTheme[currentUser.theme].background_2,
                }}
                className={`cursor-pointer w-[100%] h-[100%] rounded-[5px] flex justify-center items-center text-[calc(10px+0.2vw)]`}
                onClick={() => handlePrimaryToolClick(tool)}
              >
                <p className="dim group-hover:brightness-75">{tool}</p>
              </div>
              {index < 2 &&
                currentPrimaryTool !== "Key Concepts" &&
                !(currentPrimaryTool === "Transcript" && index === 1) &&
                !(currentPrimaryTool === "Summary" && index === 0) && (
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
        // style={{
        //   border: `1px solid ${appTheme[currentUser.theme].background_2}`,
        // }}
        className="flex-1 rounded-[5px] overflow-hidden px-[12px] pt-[15px]"
      >
        <div
          className={`w-[100%] h-[100%] ${
            currentPrimaryTool !== "Summary" && "hidden"
          }`}
        >
          <SummaryDisplay />
        </div>
        <div
          className={`w-[100%] h-[100%] ${
            currentPrimaryTool !== "Key Concepts" && "hidden"
          }`}
        >
          <KeyConceptsDisplay />
        </div>
        <div
          className={`w-[100%] h-[100%] ${
            currentPrimaryTool !== "Transcript" && "hidden"
          }`}
        >
          <TranscriptDisplay />
        </div>
      </div>
    </div>
  );
};

export default PrimaryTools;
