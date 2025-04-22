import { AuthContext } from "@/contexts/authContext";
import { useVideo } from "@/contexts/videoContext";
import { appTheme } from "@/util/appTheme";
import { formatTimeStamp } from "@/util/functions/YouTubeData";
import React, { useContext, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const KeyConceptsDisplay = () => {
  const { currentUser } = useContext(AuthContext);
  const { currentKeyConcepts, loadingCurrentKeyConcepts } = useVideo();
  if (!currentUser) return <></>;
  return (
    <div className="flex flex-col pb-[60px]">
      <p className="text-[20px] mb-[10px] font-[600]"style={{
        
      }}>Key Concepts</p>
      {!loadingCurrentKeyConcepts &&
      currentKeyConcepts &&
      Array.isArray(currentKeyConcepts) ? (
        currentKeyConcepts.map((transcriptItem: any, index: number) => {
          return (
            <div key={index} className="flex flex-col gap-[7px] mb-[20px]">
              <p
                className="text-[15px] leading-[15px]"
                style={{
                  color: appTheme[currentUser.theme].text_3,
                }}
              >
                {formatTimeStamp(transcriptItem.offset)}
              </p>
              <p
                className="text-[15px] leading-[15px]"
                style={{
                  color: appTheme[currentUser.theme].text_1,
                }}
              >
                {transcriptItem.text}
              </p>
            </div>
          );
        })
      ) : (
        <>
          {[1, 2, 3, 4, 5].map((item: number, index: number) => {
            return (
              <div className="flex flex-col gap-[9px]" key={index}>
                <Skeleton className={`w-[30%] h-[25px] ${currentUser.theme === "dark" ? "brightness-25" : "brightness-[90%]"}`} />
                <Skeleton className={`w-[100%] h-[80px] mb-[20px] ${currentUser.theme === "dark" ? "brightness-25" : "brightness-[90%]"}`} />
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};

export default KeyConceptsDisplay;
