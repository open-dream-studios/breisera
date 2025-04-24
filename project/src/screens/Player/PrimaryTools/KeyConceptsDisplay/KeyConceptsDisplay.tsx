import { AuthContext } from "@/contexts/authContext";
import { useVideo } from "@/contexts/videoContext";
import { appTheme } from "@/util/appTheme";
import {
  timeStampInjectionAndFormatting,
} from "@/util/functions/YouTubeData";
import React, { useContext, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const KeyConceptsDisplay = () => {
  const { currentUser } = useContext(AuthContext);
  const { currentKeyConcepts, loadingCurrentKeyConcepts } = useVideo();
  if (!currentUser) return <></>;
  return (
    <div className="flex flex-col pb-[60px]">
      <p className="text-[23px] mb-[18px] font-[600]">Key Concepts</p>
      {!loadingCurrentKeyConcepts && currentKeyConcepts ? (
        <div>
          {timeStampInjectionAndFormatting(
            currentKeyConcepts,
            currentUser.theme
          )}
        </div>
      ) : (
        <>
          {[1, 2, 3, 4, 5].map((item: number, index: number) => {
            return (
              <div className="flex flex-col gap-[10px] mt-[2px]" key={index}>
                <Skeleton
                  className={`w-[37%] h-[28px] ${
                    currentUser.theme === "dark"
                      ? "brightness-25"
                      : "brightness-[90%]"
                  }`}
                />
                <Skeleton
                  className={`w-[100%] h-[80px] mb-[20px] ${
                    currentUser.theme === "dark"
                      ? "brightness-25"
                      : "brightness-[90%]"
                  }`}
                />
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};

export default KeyConceptsDisplay;
