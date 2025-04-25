"use client";
import { useContext, useEffect, useRef, useState } from "react";
import "./GPT.css";
import GPTlogo from "/assets/ai.png";
import user from "/assets/user.png";
import { LuSend } from "react-icons/lu";
import axios from "axios";
import { BACKEND_URL } from "@/util/config";
import { appTheme } from "@/util/appTheme";
import { AuthContext } from "@/contexts/authContext";
import { GPTMessage, useVideo } from "@/contexts/videoContext";
import { HiOutlinePencilAlt } from "react-icons/hi";
import { makeRequest } from "@/util/axios";
import { timeStampInjection } from "@/util/functions/YouTubeData";
import { openWindow } from "@/util/functions/AppFunctions";

// height: -webkit-fill-available

const GPT = () => {
  const { currentUser } = useContext(AuthContext);
  const {
    currentVideo,
    currentVideoTranscript,
    messages,
    setMessages,
    userMessage,
    setUserMessage,
  } = useVideo();
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gptMessageDisplay = useRef<HTMLDivElement>(null);
  const [modelDisplayed, setModelDisplayed] = useState<boolean>(false);

  function startLoadingAnimation() {
    if (!isLoading) {
      setIsLoading(true);
      let count = 0;
      intervalRef.current = setInterval(() => {
        count = (count + 1) % 4;
        setLoading(".".repeat(count));
      }, 180);
    }
  }

  function stopLoadingAnimation() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsLoading(false);
    setLoading("");
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (userMessage.trim() === "" || isLoading) return;
    const newUserMessage = userMessage;
    setUserMessage("");
    setTimeout(() => {
      if (gptMessageDisplay.current) {
        gptMessageDisplay.current.scrollTop =
          gptMessageDisplay.current.scrollHeight;
      }
    }, 200);
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "20px";
    }

    startLoadingAnimation();
    setIsLoading(true);

    try {
      const oldMessages = messages;
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: newUserMessage, isBot: false },
      ]);
      
      function truncateText(text: string, text_limit: number): string {
        const words = text.split(/\s+/);
        if (words.length <= text_limit) return text;
        return (
          words.slice(0, text_limit).join(" ") +
          "... [max text limit reached, message hidden]"
        );
      }

      const MAX_MESSAGES = 10;
      const limitedMessages = oldMessages
        .slice(-MAX_MESSAGES) 
        .map((msg) => ({
          ...msg,
          text: truncateText(msg.text, 100),
        }));

      const botMessage = await getMessage([
        ...limitedMessages,
        { text: truncateText(newUserMessage, 1000), isBot: false },
      ]);

      setMessages((prevMessages) => [
        ...prevMessages,
        { text: botMessage, isBot: true },
      ]);
    } catch (error) {
      console.error(error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: "Something went wrong...", isBot: true },
      ]);
    } finally {
      stopLoadingAnimation();
      setTimeout(() => {
        if (gptMessageDisplay.current) {
          gptMessageDisplay.current.scrollTop =
            gptMessageDisplay.current.scrollHeight;
        }
      }, 200);
    }
  };

  async function getMessage(messages: GPTMessage[]) {
    if (currentVideo && currentVideoTranscript) {
      const res = await makeRequest.post(
        BACKEND_URL + "/api/youtube/gemini-query",
        {
          messages: messages,
          transcript: currentVideoTranscript,
          video: currentVideo
        }
      );
      if (res.status === 200) {
        const geminiResponse = res.data.content;
        return geminiResponse;
      }
    }
    return "Something went wrong...";
  }

  const handleTextareaKeyPress = (e: any) => {
    if (formRef.current && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      formRef.current.requestSubmit();
    }
  };

  const handleInputChange = (e: any) => {
    setUserMessage(e.target.value);
    autoResize();
  };

  const autoResize = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "20px";
      const newHeight = Math.min(textarea.scrollHeight, 100);
      textarea.style.height = `${newHeight}px`;
    }
  };

  if (!currentUser) return <></>;

  return (
    <div className="w-[100%] h-[100%] flex flex-col gap-[8px]">
      <div
        style={{
          backgroundColor: appTheme[currentUser.theme].component_bg_1,
          color: appTheme[currentUser.theme].text_2,
          border: `1px solid ${appTheme[currentUser.theme].background_2}`,
        }}
        className="w-[100%] min-h-[46px] h-[46px] rounded-[5px] flex justify-between items-center pl-[12px] pr-[8px]"
      >
        <div
          onClick={() => {
            setMessages([]);
            setUserMessage("");
            if (textareaRef.current) {
              textareaRef.current.focus();
            }
          }}
          style={{
            color: appTheme[currentUser.theme].text_3,
          }}
          className="cursor-pointer dim hover:brightness-75 w-[23px] h-[23px]"
        >
          <HiOutlinePencilAlt className="w-[100%] h-[100%]" />
        </div>

        <div
          style={{
            backgroundColor: appTheme[currentUser.theme].background_2,
          }}
          className="text-[14px] leading-[14px] font-[100] cursor-pointer dim hover:brightness-75 px-[18px] py-[6px] rounded-[15px]"
          onClick={() => {
            if (modelDisplayed) {
              openWindow(
                "https://ai.google.dev/gemini-api/docs/models#gemini-1.5-flash"
              );
            } else {
              setModelDisplayed(true);
            }
          }}
        >
          {modelDisplayed ? "gemini 1.5 flash 001" : "Model"}
        </div>
      </div>
      <div
        className="relative flex flex-col h-[100%] w-[100%] rounded-[5px]"
        style={{
          backgroundColor: appTheme[currentUser.theme].component_bg_1,
          border: `1px solid ${appTheme[currentUser.theme].background_2}`,
        }}
      >
        <div
          id="messages"
          ref={gptMessageDisplay}
          className="absolute w-[100%] h-[100%] px-[15px] overflow-y-scroll flex flex-col gap-[12px] pb-[114px]"
        >
          {messages.map((message, index) => (
            <div
              key={index}
              className={`w-full flex ${index === 0 && "mt-[15px]"} ${
                message.isBot ? "justify-start" : "justify-end"
              }`}
            >
              <div
                style={{
                  color: appTheme[currentUser.theme].text_1,
                  backgroundColor: message.isBot
                    ? appTheme[currentUser.theme].bot_message
                    : appTheme[currentUser.theme].user_message,
                }}
                className="text-[15px] leading-[21px] w-fit max-w-[92%] px-[15px] py-[7px] rounded-[18px]"
              >
                {message.isBot
                  ? timeStampInjection(currentUser.theme, message.text)
                  : message.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="h-[20px] w-full">{loading || <>&nbsp;</>}</div>
          )}
        </div>

        <div
          style={{
            backgroundColor: appTheme[currentUser.theme].component_bg_1,
          }}
          className="absolute w-[100%] bottom-0 px-[20px] flex flex-col items-end"
        >
          <div
            style={{
              backgroundColor: appTheme[currentUser.theme].component_bg_1,
            }}
            className="w-[100%] pt-[3px]"
          >
            <div
              style={{
                border: `1px solid ${appTheme[currentUser.theme].background_2}`,
              }}
              className="w-full px-[19px] rounded-[25px]"
            >
              <form
                className="relative w-full flex items-center"
                onSubmit={handleSubmit}
                ref={formRef}
              >
                <div className="w-full pt-[14px] pb-[4px] pr-[28px]">
                  <textarea
                    ref={textareaRef}
                    className="w-[calc(100%+10px)] text-[15px] leading-[16px] outline-0 border-0 overflow-scroll pr-[10px] placeholder:text-[var(--placeholder-color)]"
                    onInput={handleInputChange}
                    value={userMessage}
                    onKeyDown={handleTextareaKeyPress}
                    style={
                      {
                        resize: "none",
                        height: "20px",
                        maxHeight: "150px",
                        "--placeholder-color":
                          appTheme[currentUser.theme].text_3,
                      } as React.CSSProperties
                    }
                    name="prompt"
                    placeholder="Ask AI anything..."
                  />
                </div>
                <button
                  type="submit"
                  className={`${
                    !isLoading && "cursor-pointer dim hover:brightness-75"
                  } absolute bottom-[12.5px] right-[-4px] pr-[5px]`}
                >
                  <LuSend
                    color={appTheme[currentUser.theme].text_3}
                    fontSize={21}
                    className="w-[20px] ml-[-5px]"
                    style={{ transform: "rotate(45deg)" }}
                  />
                </button>
              </form>
            </div>
          </div>

          <p
            style={{
              color: appTheme[currentUser.theme].text_4,
            }}
            className="pb-[15px] mt-[8px] w-[100%] text-center text-[12px] leading-[16px] break-words"
          >
            AI can make mistakes. Check important information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GPT;
