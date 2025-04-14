import { ThemeType } from "../../../util/appTheme";
import { appTheme } from "../../../util/appTheme";
import appDetails from "../../../util/appDetails.json";

const LandingPage = () => {
  const defaultTheme = appDetails.default_theme as ThemeType;

  return (
    <div
      style={
        {
          "--nav-height": `${appDetails.nav_height}px`,
          "--left-bar-width": appDetails.left_bar_width,
          backgroundColor: appTheme[defaultTheme].background_1,
          color: appTheme[defaultTheme].text_1,
        } as React.CSSProperties
      }
      className={`absolute left-0 lg:left-[calc(var(--left-bar-width))] top-[var(--nav-height)] w-[100vw] lg:w-[calc(100vw-(var(--left-bar-width)))] flex h-[calc(100vh-var(--nav-height))] overflow-scroll`}
    >
      Landing Page
    </div>
  );
};

export default LandingPage;
