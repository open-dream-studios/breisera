"use client";
import { AuthContext } from "@/contexts/authContext";
import { useVideo } from "@/contexts/videoContext";
import { appTheme } from "@/util/appTheme";
import React, { useContext, useEffect, useRef, useState } from "react";
import { FaPlus } from "react-icons/fa6";

const NotesDisplay = () => {
  const { currentUser } = useContext(AuthContext);
  const { currentNote, setCurrentNote } = useVideo();

  const handleNewNoteClick = () => {
    setCurrentNote("");
  };

  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && currentNote !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = currentNote;
    }
  }, [currentNote]);

  const handleInputChange = () => {
    if (editorRef.current) {
      setCurrentNote(editorRef.current.innerHTML);
    }
  };

  if (!currentUser) return;

  return (
    <div className="w-[100%] h-[100%] flex flex-col gap-[11px]">
      <div
        style={{ backgroundColor: appTheme[currentUser.theme].background_2 }}
        className="w-[100%] h-[100px] rounded-[5px] px-[15px] pt-[8px]"
      >
        <div
          className="font-[600] text-[20px]"
          style={{
            color: appTheme[currentUser.theme].text_1,
          }}
        >
          Notes
        </div>
      </div>

      <div
        style={{
          backgroundColor: appTheme[currentUser.theme].background_2,
          color: appTheme[currentUser.theme].text_1,
        }}
        className="w-[100%] h-[100%] pt-[15px] px-[17px] rounded-[5px] relative"
      >
        <div
          onClick={handleNewNoteClick}
          style={{
            backgroundColor: appTheme[currentUser.theme].background_1,
            color: appTheme[currentUser.theme].text_1,
          }}
          className="absolute shadow-lg right-[10px] top-[10px] h-[30px] w-[30px] dim cursor-pointer hover:brightness-75 rounded-full flex items-center justify-center"
        >
          <FaPlus className="w-[15px] h-[15px]" />
        </div>

        {(currentNote === "<br>" || currentNote === "") && <div
          style={{
            color: appTheme[currentUser.theme].text_3,
          }}
          className="text-[15px] leading-[16px] absolute left-[17px] top-[15px]"
        >
          New Note...
        </div>}

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInputChange}
          className="pb-[15px] w-full pr-[7px] h-[100%] text-[15px] leading-[16px] outline-0 border-0 overflow-scroll break-words whitespace-pre-wrap"
          style={{
            resize: "none",
          }}
        />
      </div>
    </div>
  );
};

export default NotesDisplay;
