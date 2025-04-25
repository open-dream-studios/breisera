import { AuthContext } from "@/contexts/authContext";
import { useVideo } from "@/contexts/videoContext";
import { appTheme } from "@/util/appTheme";
import { timeStampInjectionAndFormatting } from "@/util/functions/YouTubeData";
import React, { useContext, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const SummaryDisplay = () => {
  const { currentUser } = useContext(AuthContext);
  const { currentSummary, loadingCurrentSummary } = useVideo();
  if (!currentUser) return <></>;
  return (
    <div className="flex flex-col pb-[60px]">
      <p className="text-[23px] mb-[18px] font-[600]">Summary</p>
      {loadingCurrentSummary && !currentSummary ? (
        <>
          {[1, 2, 3, 4, 5].map((item: number, index: number) => {
            return (
              <div className="flex flex-col gap-[11px] mt-[2px]" key={index}>
                <Skeleton
                  className={`w-[40%] h-[30px] ${
                    currentUser.theme === "dark"
                      ? "brightness-25"
                      : "brightness-[90%]"
                  }`}
                />
                <Skeleton
                  className={`w-[80%] h-[30px] ${
                    currentUser.theme === "dark"
                      ? "brightness-25"
                      : "brightness-[90%]"
                  }`}
                />
                <Skeleton
                  className={`w-[100%] h-[100px] mb-[35px] ${
                    currentUser.theme === "dark"
                      ? "brightness-25"
                      : "brightness-[90%]"
                  }`}
                />
              </div>
            );
          })}
        </>
      ) : !currentSummary ? (
        <div style={{ color: appTheme[currentUser.theme].text_4 }}>
          Captions are not available for this video
        </div>
      ) : (
        <div>
          {timeStampInjectionAndFormatting(currentSummary, currentUser.theme)}
        </div>
      )}
    </div>
  );
};

export default SummaryDisplay;
