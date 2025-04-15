"use client";
import { useContext } from "react";
import { AuthContext } from "../../../contexts/authContext";
import React from "react";

const Study = () => {
  const { currentUser } = useContext(AuthContext);
  if (!currentUser) return <></>;
  return <>Study</>
};

export default Study;
