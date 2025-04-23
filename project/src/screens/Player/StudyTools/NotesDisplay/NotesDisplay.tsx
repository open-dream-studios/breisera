"use client";
import { AuthContext } from "@/contexts/authContext";
import { Note, useVideo } from "@/contexts/videoContext";
import { appTheme } from "@/util/appTheme";
import { makeRequest } from "@/util/axios";
import { BACKEND_URL } from "@/util/config";
import { generateUniqueId } from "@/util/functions/Data";
import axios from "axios";
import React, { useContext, useEffect, useRef, useState } from "react";
import { FaPlus } from "react-icons/fa6";
import { FaChevronDown } from "react-icons/fa6";

const NotesDisplay = () => {
  const { currentUser } = useContext(AuthContext);
  const {
    currentNote,
    setCurrentNote,
    currentVideo,
    notesData,
    refetchNotesData,
  } = useVideo();
  const [notesOpen, setNotesOpen] = useState(false);

  const currentNoteRef = useRef<Note>(currentNote);
  useEffect(() => {
    currentNoteRef.current = currentNote;
  }, [currentNote]);

  const handleNewNoteClick = async () => {
    setNotesOpen(false);
    cancelTimer();
    await writeNote();
    setCurrentNote({ ...currentNote, note_id: null, title: "", content: "" });
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      editorRef.current &&
      currentNote.content !== editorRef.current.innerHTML
    ) {
      editorRef.current.innerHTML = currentNote.content;
    }
  }, [currentNote]);

  const handleInputChange = () => {
    if (editorRef.current) {
      setCurrentNote({ ...currentNote, content: editorRef.current.innerHTML });
    }
    resetTimer();
  };

  const writeNote = async () => {
    if (!currentUser) return;
    const note = currentNoteRef.current;
    const noteId = note.note_id ? note.note_id : generateUniqueId();
    setCurrentNote({ ...note, note_id: noteId });
    try {
      const res = await makeRequest.post("/api/users/write-note", {
        user_id: currentUser.user_id,
        note_id: noteId,
        title: note.title,
        content: note.content,
        video_id: currentVideo ? currentVideo.id : null,
      });
      refetchNotesData();
    } catch (error) {
      console.error("Failed to update note:", error);
    }
  };

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(async () => {
      await writeNote();
    }, 3000);
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

  const handleOpenNotes = async () => {
    refetchNotesData();
    setNotesOpen((prev) => !prev);
  };

  if (!currentUser) return;

  return (
    <div className="w-[100%] h-[100%] flex flex-col gap-[11px]">
      <div
        style={{ backgroundColor: appTheme[currentUser.theme].background_2 }}
        className={`sm:flex flex-col hidden w-[100%] ${
          notesOpen
            ? "h-[200px] max-h-[200px] overflow-scroll"
            : "h-[50px] cursor-pointer dim hover:brightness-75"
        } rounded-[5px] px-[15px] pt-[8px] relative`}
        onClick={handleOpenNotes}
      >
        <div
          className="font-[600] text-[20px]"
          style={{
            color: appTheme[currentUser.theme].text_1,
          }}
        >
          Notes
        </div>
        <div className="absolute right-[16px] top-[12px]">
          <FaChevronDown
            style={{ color: appTheme[currentUser.theme].text_2 }}
            className={`w-[22px] h-[22px] transition-all duration-0.3 ease-in-out ${
              notesOpen && "rotate-180"
            }`}
          />
        </div>
        {notesOpen && (
          <div
            className="flex flex-col"
            style={{ color: appTheme[currentUser.theme].text_3 }}
          >
            {notesData.map((note: any, index: number) => {
              return (
                <div
                  className=""
                  key={index}
                  onClick={() => {
                    setNotesOpen(false);
                    setCurrentNote({
                      ...currentNote,
                      title: note.title,
                      content: note.content,
                      note_id: note.note_id,
                      video_id: note.video_id,
                    });
                  }}
                >
                  <div
                    className="w-[100%] h-[1px] my-[10px] rounded-[2px] opacity-75"
                    style={{
                      backgroundColor: appTheme[currentUser.theme].text_3,
                    }}
                  />
                  <div className="cursor-pointer dim hover:brightness-75 truncate w-[100%] font-[600] text-[15px]">
                    {note.content === "<br>" || note.content.trim() === ""
                      ? "Blank Note"
                      : note.content}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div
        style={{
          backgroundColor: appTheme[currentUser.theme].background_2,
          color: appTheme[currentUser.theme].text_1,
        }}
        className="w-[100%] h-[100%] pt-[15px] px-[17px] rounded-[5px] relative"
      >
        <div
          onClick={handleOpenNotes}
          style={{
            backgroundColor: appTheme[currentUser.theme].background_1,
            color: appTheme[currentUser.theme].text_1,
          }}
          className="text-[13px] z-[503] leading-[13px] pb-[2px] flex sm:hidden absolute shadow-lg right-[46px] top-[10px] h-[30px] w-[57px] dim cursor-pointer hover:brightness-75 rounded-full items-center justify-center"
        >
          {notesOpen ? "Close" : "Open"}
        </div>
        <div
          onClick={handleNewNoteClick}
          style={{
            backgroundColor: appTheme[currentUser.theme].background_1,
            color: appTheme[currentUser.theme].text_1,
          }}
          className="absolute z-[503] shadow-lg right-[10px] top-[10px] h-[30px] w-[30px] dim cursor-pointer hover:brightness-75 rounded-full flex items-center justify-center"
        >
          <FaPlus className="w-[15px] h-[15px]" />
        </div>

        {(currentNote.content === "<br>" || currentNote.content === "") && (
          <div
            style={{
              color: appTheme[currentUser.theme].text_3,
            }}
            className="text-[15px] leading-[16px] absolute left-[17px] top-[15px]"
          >
            New Note...
          </div>
        )}

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInputChange}
          className={`${
            notesOpen && "hidden sm:flex"
          } z-[501] pb-[15px] w-[100%] pr-[7px] h-[100%] text-[15px] leading-[16px] outline-0 border-0 overflow-scroll break-words whitespace-pre-wrap`}
          style={{
            resize: "none",
          }}
        />

        <div
          style={{
            backgroundColor: appTheme[currentUser.theme].background_2,
            color: appTheme[currentUser.theme].text_3,
          }}
          className={`${
            !notesOpen ? "hidden" : "flex sm:hidden"
          } z-[502] relative w-[100%] h-[100%] flex-col overflow-scroll`}
        >
          <div
            className="font-[600] text-[20px] leading-[20px] mb-[8px]"
            style={{
              color: appTheme[currentUser.theme].text_1,
            }}
          >
            Saved Notes
          </div>
          {notesOpen && (
            <div
              className="flex flex-col mb-[20px]"
              style={{ color: appTheme[currentUser.theme].text_3 }}
            >
              {notesData.map((note: any, index: number) => {
                return (
                  <div
                    className=""
                    key={index}
                    onClick={() => {
                      setNotesOpen(false);
                      setCurrentNote({
                        ...currentNote,
                        title: note.title,
                        content: note.content,
                        note_id: note.note_id,
                        video_id: note.video_id,
                      });
                    }}
                  >
                    <div
                      className="w-[100%] h-[1px] my-[10px] rounded-[2px] opacity-75"
                      style={{
                        backgroundColor: appTheme[currentUser.theme].text_3,
                      }}
                    />
                    <div className="cursor-pointer dim hover:brightness-75 truncate w-[100%] font-[600] text-[15px]">
                      {note.content === "<br>" || note.content.trim() === ""
                        ? "Blank Note"
                        : note.content}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotesDisplay;
