import { ThemeType } from "../../../util/appTheme";
import { appTheme } from "../../../util/appTheme";
import appDetails from "../../../util/appDetails.json";
import PageLayout from "@/layouts/pageLayout";

const LandingPage = async () => {
  const currentTheme = appDetails.default_theme as ThemeType
  return (
    <PageLayout>
      <div
        style={{
          backgroundColor: appTheme[currentTheme].background_1,
          color: appTheme[currentTheme].text_1,
        }}
        className="w-[100%] h-[100%]"
      >
        Landing Page
      </div>
    </PageLayout>
  );
};

export default LandingPage;
