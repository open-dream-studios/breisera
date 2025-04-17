import type { Metadata } from "next";
import { cookies } from "next/headers"
import { appTheme, ThemeType } from "@/util/appTheme";
import appDetails from "../util/appDetails.json";
import LandingPage from "@/screens/Landing/LandingPage/LandingPage";
import AppLayout from "../layouts/appLayout";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Breisera",
  description: "Breisera App",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken");
  const showLanding = !token;
  return (
    <html
      lang="en"
      style={{
        backgroundColor:
          appTheme[appDetails.default_theme as ThemeType].background_1,
      }}
    >
      <body>
        <AppLayout>{children}</AppLayout>
        {showLanding && <LandingPage />}
      </body>
    </html>
  );
}
