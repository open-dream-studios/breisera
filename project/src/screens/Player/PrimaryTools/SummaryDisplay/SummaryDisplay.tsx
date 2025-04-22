import { AuthContext } from "@/contexts/authContext";
import { useVideo } from "@/contexts/videoContext";
import { appTheme } from "@/util/appTheme";
import { formatTimeStamp } from "@/util/functions/YouTubeData";
import React, { useContext, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const SummaryDisplay = () => {
  const { currentUser } = useContext(AuthContext);
  const { currentSummary, loadingCurrentSummary } = useVideo();
  if (!currentUser) return <></>;
  return (
    <div className="flex flex-col pb-[60px]">
      <p className="text-[20px] mb-[10px] font-[600]"style={{
        
      }}>Summary</p>
      {!loadingCurrentSummary &&
      currentSummary &&
      Array.isArray(currentSummary) ? (
        currentSummary.map((transcriptItem: any, index: number) => {
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
              <div className="flex flex-col gap-[11px] mt-[2px]" key={index}>
                <Skeleton className={`w-[40%] h-[30px] ${currentUser.theme === "dark" ? "brightness-25" : "brightness-[90%]"}`} />
                <Skeleton className={`w-[80%] h-[30px] ${currentUser.theme === "dark" ? "brightness-25" : "brightness-[90%]"}`} />
                <Skeleton className={`w-[100%] h-[100px] mb-[35px] ${currentUser.theme === "dark" ? "brightness-25" : "brightness-[90%]"}`} />
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};

export default SummaryDisplay;
