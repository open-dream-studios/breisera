"use client";
import { useContext, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AuthContext } from "@/contexts/authContext";
import { appTheme } from "@/util/appTheme";

let triggerToast: (message: string, type?: "success" | "error") => void;

export const showToast = (
  message: string,
  type: "success" | "error" = "success"
) => {
  if (triggerToast) triggerToast(message, type);
};

export default function CustomToast() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"success" | "error">("success");
  const { currentUser } = useContext(AuthContext);

  useEffect(() => {
    triggerToast = (msg, type: any) => {
      setMessage(msg);
      setType(type);
      setVisible(true);
      setTimeout(() => setVisible(false), 3500);
    };
  }, []);

  if (!currentUser) return;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={`z-[1000] px-[13px] py-[9px] rounded shadow-lg border-b-[2px]`}
            style={{
              color: appTheme[currentUser.theme].text_1,
              backgroundColor: appTheme[currentUser.theme].background_1,
              borderColor: appTheme[currentUser.theme].text_1,
            }}
          >
            <div className="flex flex-row gap-[10px] items-center text-sm text-center">
              <span className="text-xl">
                {type === "error" ? <>{"X"}</> : <>{"S"}</>}
              </span>
              <span className="mt-[3px]">{message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
