import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Modals from "../components/Modals/Modals";
import LandingNav from "../screens/Landing/LandingNav/LandingNav";
import LandingLeftBar from "../screens/Landing/LandingLeftBar/LandingLeftBar";
import LandingPage from "@/screens/Landing/LandingPage/LandingPage";

const Landing = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken");

  if (token?.value) {
    console.log("token");
    redirect("/home");
  }

  return (
    <>
      <Modals landing={true} />
      <LandingNav />
      <LandingLeftBar />
      <LandingPage />
    </>
  );
};

export default Landing;
