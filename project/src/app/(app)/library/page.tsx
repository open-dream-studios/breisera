"use client";
import { useContext } from "react";
import { appTheme } from "../../../util/appTheme";
import { AuthContext } from "../../../contexts/authContext";
import React, { useEffect, useState } from "react";

const LibraryPage = () => {
  const { currentUser } = useContext(AuthContext);
  if (!currentUser) return <></>;

  return <div>LibraryPage</div>;
};

export default LibraryPage;
