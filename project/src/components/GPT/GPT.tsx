import { useRef, useState } from "react";
import "./GPT.css";
import GPTlogo from "/assets/ai.png";
import user from "/assets/user.png";
import { LuSend } from "react-icons/lu";
import axios from "axios";
import { BACKEND_URL } from "@/util/config";

// height: -webkit-fill-available

export type GPTMessage = {
  isBot: boolean;
  text: string;
};

const GPT = () => {
  const [messages, setMessages] = useState<GPTMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState("");
  const loaderRef = useRef<any>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleTextareaKeyPress = (e: any) => {
    if (formRef.current && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      formRef.current.requestSubmit();
    }
  };

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

    const form = e.target;
    const data = new FormData(form);

    const userMessage = data.get("prompt")?.toString() || "";
    setMessages((prevMessages) => [
      ...prevMessages,
      { text: userMessage, isBot: false },
    ]);
    form.reset();

    startLoadingAnimation();
    setIsLoading(true);

    try {
      const botMessage = await getMessage([
        ...messages,
        { text: userMessage, isBot: false },
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

  return (
    <div className="relative w-[100%] h-[100%] flex flex-col items-center justify-center">
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

      <form
        className="w-[100%] absolute bottom-0 flex flex-row gap-[10px] min-h-[50px] items-center justify-center"
        style={{ borderTop: "0.1px solid white" }}
        onSubmit={handleSubmit}
        ref={formRef}
      >
        <textarea
          className="w-[100%] color-white text-[16px] px-[10px] outline-0 border-0"
          onKeyPress={handleTextareaKeyPress}
          style={{ resize: "none" }}
          name="prompt"
          placeholder="Ask me something..."
        ></textarea>
        <button
          type="submit"
          className="h-[100%] w-[40px] pr-[10px] cursor-pointer justify-center items-center flex"
        >
          <LuSend
            color="white"
            fontSize={21}
            style={{ transform: "rotate(45deg)" }}
          />
        </button>
      </form>
    </div>
  );
};

export default GPT;
