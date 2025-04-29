"use client";
import { AuthContext } from "@/contexts/authContext";
import { appTheme } from "@/util/appTheme";
import React, { useContext, useState } from "react";
import { IoCheckmarkSharp } from "react-icons/io5";

const PremiumPopup = () => {
  const { currentUser } = useContext(AuthContext);
  type SubscriptionType = "Pro" | "Unlimited";
  const subscriptionTypes: SubscriptionType[] = ["Pro", "Unlimited"];
  const [subscriptionSelected, setSubscriptionSelected] =
    useState<SubscriptionType>("Pro");

  const proOfferings = [
    "Unlimited messages with AI",
    "10 YouTube videos / week",
    "10 PDF uploads up to 25 MB / week",
    "100 AI generations / week (quizzes, flashcards, & notes)",
    "Upgraded models",
  ];

  const unlimitedOfferings = [
    "Unlimited messages with AI",
    "Unlimited YouTube videos",
    "Unlimited PDF uploads up to 25 MB",
    "Unlimited AI generations (quizzes, flashcards, & notes)",
    "Upgraded models",
  ];

  const prices = {
    Pro: {
      Annual: 8,
      Monthly: 14,
    },
    Unlimited: {
      Annual: 15,
      Monthly: 25,
    },
  };

  const offerings =
    subscriptionSelected === "Pro" ? proOfferings : unlimitedOfferings;

  type TimelineType = "Annual" | "Monthly";
  const timelineTypes: TimelineType[] = ["Annual", "Monthly"];
  const [timelineSelected, setTimelineSelected] =
    useState<TimelineType>("Annual");

  if (!currentUser) return;
  return (
    <div className="pt-[45px] px-[50px]">
      <p className="mb-[12px] font-[500] text-[19px]">Upgrade Your Plan</p>
      <p
        style={{ color: appTheme[currentUser.theme].text_3 }}
        className="text-[15px] mb-[19px]"
      >
        Choose the plan that best fits your needs.
      </p>

      <div
        className="mb-[39px] w-[100%] select-none px-[4px] h-[39px] rounded-[10px] flex flex-row items-center justify-center"
        style={{ background: appTheme[currentUser.theme].background_2 }}
      >
        {subscriptionTypes.map(
          (subscription: SubscriptionType, index: number) => {
            return (
              <div
                key={index}
                className="group flex flex-row w-[50%] h-[31px] relative"
              >
                <div
                  style={{
                    backgroundColor:
                      subscriptionSelected === subscription
                        ? appTheme[currentUser.theme].background_1
                        : appTheme[currentUser.theme].background_2,
                  }}
                  className={`cursor-pointer w-[100%] h-[100%] rounded-[8px] flex justify-center items-center text-[calc(13px+0.2vw)] font-[500]`}
                  onClick={() => setSubscriptionSelected(subscription)}
                >
                  <p className="dim group-hover:brightness-75">
                    {subscription}
                  </p>
                </div>
              </div>
            );
          }
        )}
      </div>

      <div className="flex flex-col gap-[6px] mb-[49px]">
        {offerings.map((offering: string, index: number) => {
          return (
            <div
              key={index}
              className="text-[15px] flex flex-row gap-[8px] items-start"
            >
              <IoCheckmarkSharp
                className="w-[17px] h-[17px] mt-[5px]"
                style={{ color: "blue" }}
              />
              <div>{offering}</div>
            </div>
          );
        })}
      </div>

      <div className="mb-[17px] sm:mb-[30px] w-[100%] select-none flex flex-row sm:flex-col gap-[15px] justify-center">
        {timelineTypes.map((timeline: TimelineType, index: number) => {
          return (
            <div
              key={index}
              style={
                {
                  border: timeline === "Annual"? "1px solid blue" : `1px solid ${appTheme[currentUser.theme].background_2}`,
                  "--hover-bg": appTheme[currentUser.theme].background_2,
                  transition: "background-color 0.2s ease-in-out"
                } as React.CSSProperties
              }
              className={`relative w-[100%] hover:bg-[var(--hover-bg)] aspect-[4/1] sm:aspect-[6/1] px-[25px] rounded-[11px] flex flex-row justify-center sm:justify-between items-center cursor-pointer text-[calc(13px+0.2vw)] font-[500]`}
              onClick={() => setTimelineSelected(timeline)}
            >
              <p style={{

              }} className="block sm:hidden absolute top-[-28px] left-0">{timeline}</p>
              <div className="flex flex-row gap-[12px] items-center">
                <p className="hidden sm:block">{timeline}</p>
                {timeline === "Annual" && (
                  <p
                    style={{
                      border: "1px solid blue",
                      color: "blue",
                    }}
                    className="hidden sm:flex mt-[1px] px-[9px] font-[500] text-[13px] leading-[13px] items-center pt-[6px] pb-[7px] text-blue rounded-[20px]"
                  >
                    Save 40%
                  </p>
                )}
              </div>
              <p className="dim group-hover:brightness-75">
                ${prices[subscriptionSelected][timeline]} /mo
              </p>
            </div>
          );
        })}
      </div>

      <p
        style={{ color: appTheme[currentUser.theme].text_4 }}
        className="text-[12px] mb-[15px] w-[100%] text-center"
      >
        Join 50,000+ students and lifelong learners
      </p>
    </div>
  );
};

export default PremiumPopup;
