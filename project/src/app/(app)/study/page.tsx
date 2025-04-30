"use client";
import { useContext } from "react";
import { AuthContext } from "../../../contexts/authContext";
import React from "react";

const StudyPage = () => {
  const { currentUser } = useContext(AuthContext);
  if (!currentUser) return <></>;
  return <>StudyPage</>
};

export default StudyPage;