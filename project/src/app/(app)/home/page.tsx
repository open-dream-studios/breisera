"use client"
import { useContext } from "react";
import { appTheme } from "../../../util/appTheme";
import { AuthContext } from "../../../contexts/authContext";
import Player from "@/screens/Player/Player";

const Home = () => {
  const { currentUser } = useContext(AuthContext);
  if (!currentUser) return <></>;

  return (
    <div
      className="w-[100%] h-[100%] overflow-scroll relative"
      style={{
        backgroundColor: appTheme[currentUser.theme].background_1,
      }}
    >
      <div
        className="absolute top-0 left-0 w-[100%] h-[2000px]"
        style={{
          backgroundColor: appTheme[currentUser.theme].background_1,
          color: appTheme[currentUser.theme].text_1,
        }}
      >
        <Player />
      </div>
    </div>
  );
};

export default Home;