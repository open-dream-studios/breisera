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
import { LiaTrashAltSolid } from "react-icons/lia";

type NotesListProps = {
  notesOpen: boolean;
  setNotesOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleDeleteNote: (note_id: string) => void;
  smallScreen: boolean;
};

const NotesList = ({
  notesOpen,
  setNotesOpen,
  handleDeleteNote,
  smallScreen,
}: NotesListProps) => {
  const { currentUser } = useContext(AuthContext);
  const { currentNote, setCurrentNote, notesData } = useVideo();

  const stripHtml = (html: string) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.innerText;
  };

  if (!currentUser) return <></>;

  return (
    <div
      style={{
        backgroundColor: appTheme[currentUser.theme].background_2,
        color: appTheme[currentUser.theme].text_3,
      }}
      className={`${
        smallScreen
          ? !notesOpen
            ? "hidden"
            : "flex sm:hidden"
          : "flex mt-[5px]"
      } z-[502] relative w-[calc(100%+10px)] pr-[10px] h-[100%] flex-col overflow-scroll`}
    >
      <div
        onClick={() => {
          if (!smallScreen && notesOpen) {
            setNotesOpen(false);
          }
        }}
        className={`${
          !smallScreen && notesOpen && "cursor-pointer dim hover:brightness-75"
        } font-[600] text-[20px] leading-[20px] mb-[8px] flex flex-row justify-between`}
        style={{
          color: appTheme[currentUser.theme].text_1,
        }}
      >
        {smallScreen ? "Saved Notes" : "Notes"}
        <FaChevronDown
          style={{ color: appTheme[currentUser.theme].text_2 }}
          className={`w-[22px] h-[22px] transition-all duration-0.3 ease-in-out ${
            notesOpen && "rotate-180"
          }`}
        />
      </div>
      {notesOpen && (
        <div
          className="flex flex-col mb-[20px]"
          style={{ color: appTheme[currentUser.theme].text_3 }}
        >
          {notesData.map((note: any, index: number) => {
            return (
              <div className="" key={index}>
                <div
                  className="w-[100%] h-[1px] my-[10px] rounded-[2px] opacity-75"
                  style={{
                    backgroundColor: appTheme[currentUser.theme].text_3,
                  }}
                />
                <div className="w-[100%] flex flex-row justify-between">
                  <div
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
                    className="cursor-pointer dim hover:brightness-75 truncate w-[calc(100%-40px)] font-[600] text-[15px]"
                  >
                    {note.content === "<br>" || note.content.trim() === ""
                      ? "Blank Note"
                      : stripHtml(note.content)}
                  </div>
                  <LiaTrashAltSolid
                    onClick={() => handleDeleteNote(note.note_id)}
                    className="w-[25px] h-[25px] mr-[5px] cursor-pointer dim hover:brightness-75"
                    style={{}}
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
    cancelTimer();
    await writeNote();
    setCurrentNote({ ...currentNote, note_id: null, title: "", content: "" });
    setNotesOpen(false);
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.focus();
      }
    }, 100);
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
    if (!notesOpen) {
      setNotesOpen(true);
    }
  };

  const handleDeleteNote = async (note_id: string) => {
    try {
      const res = await makeRequest.post("/api/users/delete-note", {
        user_id: currentUser?.user_id,
        note_id: note_id,
      });
      refetchNotesData();
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
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
        <NotesList
          notesOpen={notesOpen}
          setNotesOpen={setNotesOpen}
          handleDeleteNote={handleDeleteNote}
          smallScreen={false}
        />
      </div>

      <div
        style={{
          backgroundColor: appTheme[currentUser.theme].background_2,
          color: appTheme[currentUser.theme].text_1,
        }}
        className="w-[100%] h-[100%] pt-[15px] px-[17px] rounded-[5px] relative"
      >
        <div
          onClick={() => setNotesOpen((prev) => !prev)}
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

        <NotesList
          notesOpen={notesOpen}
          setNotesOpen={setNotesOpen}
          handleDeleteNote={handleDeleteNote}
          smallScreen={true}
        />
      </div>
    </div>
  );
};

export default NotesDisplay;
