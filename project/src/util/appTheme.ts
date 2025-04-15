export type ThemeType = "light" | "dark";
export const appTheme = {
  light: {
    // Backgrounds
    background_stark: "#FFFFFF",
    background_1: "#FFFFFF",
    background_2: "#E9E9E9",
    background_3: "#BBBBBB",
    background_4: "#AAAAAA",
    background_1_2: "#FFFFFF",
    background_2_2: "#E9E9E9",

    // Texts
    text_1: "#000000",
    text_2: "#1F1F1F",
    text_3: "#555555",
    text_4: "#999999",

    // Globals
    app_color_1: "#A796D5",
    app_text_color_1: "#A796D5",
  },
  dark: {
    // Backgrounds
    background_stark: "#131313",
    background_1: "#161616",
    background_2: "#282828",
    background_3: "#333333",
    background_4: "#666666",
    background_1_2: "#252525",
    background_2_2: "#343434",

    // Texts
    text_1: "#FFFFFF",
    text_2: "#DDDDDD",
    text_3: "#BBBBBB",
    text_4: "#888888",

    // Globals
    app_color_1: "#A796D5",
    app_text_color_1: "#A796D5",
  },
};

export const appTextSizes = {
  textHead1: "text-[16px] sm:text-[18px] md:text-[19px] lg:text-[21px] leading-[23px] sm:leading-[25px] md:leading-[26px] lg:leading-[28px]",
  textHead3: "text-[14px] sm:text-[16px] md:text-[17px] lg:text-[19px] leading-[21px] sm:leading-[23px] md:leading-[24px] lg:leading-[26px]",
  textHead5: "text-[14px] sm:text-[14px] md:text-[15px] lg:text-[17px] leading-[19px] sm:leading-[21px] md:leading-[22px] lg:leading-[24px]",
  
  textSub1: "text-[11px] sm:text-[11px] md:text-[12px] lg:text-[13px] leading-[11px] sm:leading-[11px] md:leading-[12px] lg:leading-[13px]"
}
