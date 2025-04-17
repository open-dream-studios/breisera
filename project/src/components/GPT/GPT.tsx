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

// height: -webkit-fill-available

const GPT = () => {
  const { currentUser } = useContext(AuthContext);
  const { messages, setMessages, userMessage, setUserMessage } = useVideo()
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState("");
  const loaderRef = useRef<any>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function startLoadingAnimation() {
    if (loaderRef.current && !isLoading) {
      setIsLoading(true);
      loaderRef.current = setInterval(() => {
        setLoading((prevLoading) =>
          prevLoading.length < 3 ? prevLoading + "." : ""
        );
      }, 160);
    }
  }

  function stopLoadingAnimation() {
    setIsLoading(false);
    clearInterval(loaderRef.current);
    setLoading("");
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (userMessage.trim() === "") return;
    const newUserMessage = userMessage;
    setUserMessage("");
    setMessages((prevMessages) => [
      ...prevMessages,
      { text: newUserMessage, isBot: false },
    ]);

    startLoadingAnimation();
    setIsLoading(true);

    try {
      const botMessage = await getMessage([
        ...messages,
        { text: newUserMessage, isBot: false },
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
    }
  };

  async function getMessage(messages: GPTMessage[]) {
    const proxyUrl = `${BACKEND_URL}/gpt-message`;
    try {
      const response = await axios.post(proxyUrl, { messages });
      return response.data;
    } catch (error) {
      console.error(error);
      return "Something went wrong...";
    }
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
    <div className="relative px-[15px] w-[100%] h-[100%] flex flex-col items-center justify-center">
      <div
        id="messages"
        className="flex-1 w-[100%] px-[15px] pt-[15px] h-[100%] overflow-y-scroll flex flex-col gap-[12px] pb-[20px]"
      >
        {messages.map((message, index) => (
          <div
            className={`w-[100%] flex flex-row items-start gap-[7px] justify-start ${
              message.isBot ? "ai" : ""
            }`}
            key={index}
          >
            <div className="w-[36px] h-[36px] rounded-[10px] flex items-center justify-center">
              {/* <img
                className="w-[100%] h-[100%] object-contain"
                src={message.isBot ? GPTlogo : user}
                alt={message.isBot ? "bot" : "user"}
              /> */}
            </div>
            <div className="ml-[1px] w-[10px] text-white text-[16px] flex-1 mt-[5px]">
              {message.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="w-[100%] p-[15px]">
            <div className="w-[100%] mx-auto my-0 flex flex-row items-start gap-[10px]">
              <div className="image">
                {/* <img
                  className="w-[100%] h-[100%] object-contain "
                  src={GPTlogo}
                  alt="bot"
                /> */}
              </div>
              <div className="flex-1 color-white text-[20px] max-w-[100%] overflow-x-scroll mt-[5px] ml-[3px] pb-[5px] whitespace-pre-wrap">
                {loading}
              </div>
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          backgroundColor: appTheme[currentUser.theme].background_1,
        }}
        className="w-[100%] px-[15px] absolute bottom-[40px]"
      >
        <div
          style={{
            border: `1px solid ${appTheme[currentUser.theme].background_2}`,
          }}
          className="w-[100%] px-[19px] rounded-[25px]"
        >
          <form
            className="relative w-[100%] flex items-center"
            onSubmit={handleSubmit}
            ref={formRef}
          >
            <div className="w-[100%] pt-[14px] pb-[4px] pr-[28px]">
              <textarea
                ref={textareaRef}
                className="w-[calc(100%+10px)] text-[15px] leading-[16px] outline-0 border-0 overflow-scroll pr-[10px]"
                onInput={handleInputChange}
                value={userMessage}
                onKeyDown={handleTextareaKeyPress}
                style={{ resize: "none", height: "20px", maxHeight: "150px" }}
                name="prompt"
                placeholder="Ask AI anything..."
              />
            </div>
            <button
              type="submit"
              className="cursor-pointer absolute bottom-[12.5px] right-[-4px] dim hover:brightness-75 pr-[5px]"
            >
              <LuSend
                color={appTheme[currentUser.theme].text_3}
                fontSize={21}
                className=" w-[20px] ml-[-5px]"
                style={{ transform: "rotate(45deg)" }}
              />
            </button>
          </form>
        </div>
      </div>

      <p
        style={{
          backgroundColor: appTheme[currentUser.theme].background_1,
          color: appTheme[currentUser.theme].text_4,
        }}
        className="absolute bottom-0 h-[40px] pt-[10px] w-[100%] text-center text-[12px]"
      >
        AI can make mistakes. Check important information.
      </p>
    </div>
  );
};

export default GPT;
