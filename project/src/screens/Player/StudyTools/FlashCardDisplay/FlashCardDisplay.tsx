"use client";
import { AuthContext } from "@/contexts/authContext";
import { useContextQueries } from "@/contexts/queryContext";
import { FlashCards, useVideo } from "@/contexts/videoContext";
import { useFlashCardsRefStore } from "@/store/useStudyToolsStore";
import { appTheme } from "@/util/appTheme";
import { makeRequest } from "@/util/axios";
import { generateUniqueId } from "@/util/functions/Data";
import React, {
  RefObject,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { FaPlus } from "react-icons/fa6";
import { GoTrash } from "react-icons/go";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";

type FlashCardsListProps = {
  handleDeleteFlashCards: (flashcard_id: string) => void;
  setFlashCardsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const FlashCardsList = ({ handleDeleteFlashCards, setFlashCardsOpen }: FlashCardsListProps) => {
  const { currentUser } = useContext(AuthContext);
  const { currentFlashCards, setCurrentFlashCards } = useVideo();
  const { flashCardData } = useContextQueries();

  const stripHtml = (html: string) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.innerText;
  };

  if (!currentUser || !flashCardData) return <></>;

  return (
    <div
      className={`pt-[9px] px-[1px] flex flex-col w-[100%] max-h-[100%] relative overflow-scroll`}
    >
      {flashCardData.length === 0 ? (
        <div className="mt-[5px]">You have no saved flash cards</div>
      ) : (
        <div
          className="flex flex-col w-[100%] h-[100%] px-[12px] pb-[14px]"
          style={{ color: appTheme[currentUser.theme].text_1 }}
        >
          {flashCardData.map((flashCardSet: any, index: number) => {
            return (
              <div key={index}>
                <div
                  className={`${
                    index === 0 && "opacity-0"
                  } w-[100%] h-[1px] mb-[10px] mt-[2px] rounded-[2px]`}
                  style={{
                    backgroundColor: appTheme[currentUser.theme].background_2,
                  }}
                />

                <div className="w-[100%] flex flex-row justify-between mb-[6px]">
                  <div
                    onClick={() => {
                      setFlashCardsOpen(false);
                      setCurrentFlashCards({
                        ...currentFlashCards,
                        flashcard_id: flashCardSet.flashcard_id,
                        title: flashCardSet.title,
                        content: flashCardSet.content,
                        video_id: flashCardSet.video_id,
                      });
                    }}
                    style={{
                      color: appTheme[currentUser.theme].text_2,
                    }}
                    className="cursor-pointer transition-opacity duration-[0.2s] ease-in-out hover:opacity-75 truncate w-[calc(100%-40px)] font-[400] text-[14px]"
                  >
                    {flashCardSet.title === "<p></p>" || flashCardSet.title.trim() === ""
                      ? "Empty Set"
                      : stripHtml(flashCardSet.title)}
                  </div>
                  <GoTrash
                    onClick={() => handleDeleteFlashCards(flashCardSet.flashcard_id)}
                    className="w-[18px] h-[18px] mr-[2px] cursor-pointer dim hover:opacity-50 opacity-[70%]"
                    style={{ color: appTheme[currentUser.theme].text_1 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const FlashCardsDisplay = () => {
  const { currentUser } = useContext(AuthContext);
  const { currentFlashCards, setCurrentFlashCards, currentVideo } = useVideo();
  const { refetchFlashCardData } = useContextQueries();
  const [flashCardsOpen, setFlashCardsOpen] = useState(false);

  const flashCardsRef = useRef<HTMLDivElement>(null);
  const setFlashCardsRef = useFlashCardsRefStore((state) => state.setFlashCardsRef);
  useEffect(() => {
    setFlashCardsRef(flashCardsRef as RefObject<HTMLDivElement>);
  }, [setFlashCardsRef, flashCardsRef]);

  const currentFlashCardsRef = useRef<FlashCards>(currentFlashCards);
  useEffect(() => {
    currentFlashCardsRef.current = currentFlashCards;
  }, [currentFlashCards]);

  const handleNewFlashCardsClick = async () => {
    cancelTimer();
    await writeFlashCards();
    setCurrentFlashCards({ ...currentFlashCards, flashcard_id: null, title: "", content: [] });
    setFlashCardsOpen(false);
  };

  const writeFlashCards = async () => {
    if (!currentUser || !currentVideo) return;
    const flashCards = currentFlashCardsRef.current;
    const flashCardsId = flashCards.flashcard_id ? flashCards.flashcard_id : generateUniqueId();
    setCurrentFlashCards({ ...flashCards, flashcard_id: flashCardsId });
    try {
      const res = await makeRequest.post("/api/users/write-flashcards", {
        user_id: currentUser.user_id,
        flashcard_id: flashCardsId,
        title: flashCards.title,
        content: flashCards.content,
        collection_id: null,
        video_id: currentVideo ? currentVideo.id : null,
        video_data: JSON.stringify(currentVideo),
      });
      refetchFlashCardData();
    } catch (error) {
      console.error("Failed to update flash cards:", error);
    }
  };

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(async () => {
      await writeFlashCards();
    }, 2000);
  };

  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    startTimer();
  };

  const cancelTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleOpenFlashCards = async () => {
    refetchFlashCardData();
    setFlashCardsOpen((prev) => !prev);
  };

  const handleDeleteFlashCards = async (flashcard_id: string) => {
    try {
      const res = await makeRequest.post("/api/users/delete-flashcards", {
        user_id: currentUser?.user_id,
        flashcard_id
      });
      if (flashcard_id== currentFlashCards.flashcard_id) {
        setCurrentFlashCards({
          ...currentFlashCards,
          flashcard_id: null,
          title: "",
          content: [],
        });
      }
      refetchFlashCardData();
    } catch (error) {
      console.error("Failed to delete flash cards:", error);
    }
  };

  // useEffect(() => {
  //   if (editor && currentNote.content !== editor.getHTML()) {
  //     editor.commands.setContent(currentNote.content || "<p></p>", false);
  //     setTimeout(() => editor.commands.focus("end"), 0);
  //   }
  // }, [currentNote.note_id]);

  // const editor = useEditor({
  //   extensions: [
  //     StarterKit.configure({
  //       heading: false,
  //       blockquote: false,
  //       codeBlock: false,
  //       listItem: false,
  //       bulletList: false,
  //       orderedList: false,
  //     }),
  //     Underline,
  //   ],
  //   content: "",
  //   onUpdate({ editor }) {
  //     const html = editor.getHTML();
  //     setCurrentNote({ ...currentNote, content: html });
  //     resetTimer();
  //   },
  //   editorProps: {
  //     handlePaste(view, event, slice) {
  //       const text = event.clipboardData?.getData("text/plain");
  //       if (text) {
  //         view.dispatch(
  //           view.state.tr.insertText(
  //             text,
  //             view.state.selection.from,
  //             view.state.selection.to
  //           )
  //         );
  //         return true;
  //       }
  //       return false;
  //     },
  //   },
  // });

  if (!currentUser) return;
  return (
    <div className="w-[100%] h-[100%] flex flex-col relative">
      <div
        style={{
          backgroundColor: appTheme[currentUser.theme].component_bg_1,
          border: `0.1px solid ${appTheme[currentUser.theme].background_2}`,
        }}
        className={`flex absolute top-0 left-0 flex-row w-[100%] h-[46px] min-h-[46px]
            rounded-[5px] px-[15px] pt-[12px] font-[600] text-[20px] leading-[20px] select-none`}
      >
        Flash Cards
      </div>

      <div
        onClick={handleOpenFlashCards}
        style={{
          backgroundColor: appTheme[currentUser.theme].background_1,
          color: appTheme[currentUser.theme].text_1,
        }}
        className="select-none text-[13px] z-[503] leading-[13px] pb-[2px] flex absolute shadow-lg right-[45px] top-[9px] h-[30px] w-[57px] dim cursor-pointer hover:brightness-75 rounded-full items-center justify-center"
      >
        {flashCardsOpen ? "Close" : "Open"}
      </div>
      <div
        onClick={handleNewFlashCardsClick}
        style={{
          backgroundColor:
            currentUser.theme === "dark"
              ? appTheme[currentUser.theme].background_2
              : appTheme[currentUser.theme].background_1,
          color: appTheme[currentUser.theme].text_1,
        }}
        className="select-none absolute z-[503] shadow-lg right-[9px] top-[9px] h-[30px] w-[30px] dim cursor-pointer hover:brightness-75 rounded-full flex items-center justify-center"
      >
        <FaPlus className="w-[15px] h-[15px]" />
      </div>

      {flashCardsOpen ? (
        <div className={`h-[calc(100%-46px)] mt-[46px]`}>
          <FlashCardsList
            handleDeleteFlashCards={handleDeleteFlashCards}
            setFlashCardsOpen={setFlashCardsOpen}
          />
        </div>
      ) : (
        <div
          style={{
            backgroundColor: appTheme[currentUser.theme].component_bg_1,
            border: `1px solid ${appTheme[currentUser.theme].background_2}`,
            color: appTheme[currentUser.theme].text_1,
          }}
          // onClick={() => {
          //   if (!editor?.isFocused) editor?.commands.focus();
          // }}
          className={`w-[100%] h-[100%] md:h-[calc(100%-54px)] md:mt-[54px]
          px-[17px] rounded-[5px] relative cursor-text`}
        >
          {/* {editor &&
            (editor.getHTML() === "" || editor.getHTML() === "<p></p>") && (
              <div
                style={{
                  color: appTheme[currentUser.theme].text_3,
                }}
                className="pointer-events-none select-none text-[15px] leading-[16px] absolute left-[17px] top-[15px]"
              >
                New Note...
              </div>
            )} */}

          {/* <EditorContent
            editor={editor}
            className="z-[501] w-[calc(100%+12px)] prose max-h-[100%] pt-[15px] pb-[20px] pr-[12px] text-[15px] leading-[16px] outline-none border-none overflow-scroll break-words "
          /> */}
        </div>
      )}
    </div>
  );
};

export default FlashCardsDisplay;
