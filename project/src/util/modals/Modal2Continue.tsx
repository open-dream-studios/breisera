"use client"
import { useContext } from "react";
import { appTheme } from "../appTheme";
import { AuthContext } from "../../contexts/authContext";
import { useModal2Store } from "../../store/useModalStore";

type Modal2ContinueProps = {
  text: string;
  onContinue: () => void;
};

const Modal2Continue: React.FC<Modal2ContinueProps> = ({ text, onContinue }) => {
  const modal2 = useModal2Store((state: any) => state.modal2);
  const setModal2 = useModal2Store((state: any) => state.setModal2);

  const { currentUser } = useContext(AuthContext);
  if (!currentUser) return;
  return (
    <div className="pt-[10px] w-full h-full flex items-center justify-center flex-col gap-[15px]">
      <div
        style={{ color: appTheme[currentUser.theme].text_1 }}
        className="text-center"
      >
        {text}
      </div>
      <div className="w-full h-[40px] px-[25px] flex flex-row gap-[10px]">
        <div
          className="select-none dim hover:brightness-75 cursor-pointer flex-1 h-full rounded-[10px] flex items-center justify-center"
          style={{
            color: appTheme[currentUser.theme].text_1,
            backgroundColor: appTheme[currentUser.theme].background_2_2,
          }}
          onClick={() => {
            setModal2({
              ...modal2,
              open: false,
            });
          }}
        >
          Cancel
        </div>
        <div
          className="select-none dim hover:brightness-75 cursor-pointer flex-1 h-full rounded-[10px] flex items-center justify-center"
          style={{
            color: appTheme[currentUser.theme].background_1_2,
            backgroundColor: appTheme[currentUser.theme].text_3,
          }}
          onClick={onContinue}
        >
          Continue
        </div>
      </div>
    </div>
  );
};

export default Modal2Continue;
