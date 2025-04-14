"use client"
import { useContext } from "react";
import { appTheme } from "../../util/appTheme";
import {
  capitalizeFirstLetter,
  formatDate,
  formatStripeAmount,
  formatStripeDate,
} from "../../util/functions/Data";
import { AuthContext } from "../../contexts/authContext";

const Billing = ({ currentUserBilling }: { currentUserBilling: any }) => {
  const { currentUser } = useContext(AuthContext)
  if (!currentUser || !currentUserBilling || currentUserBilling.length === 0) return;
  return (
    <div className="w-full h-full flex flex-col pt-[50px]">
      <div className="w-[90%] ml-[1%] md:ml-[2%] flex flex-col items-center justify-center">
        <p className="font-[600] lg:mb-[18px] mb-[15px] text-[29px] leading-[29px] md:text-[32px] md:leading-[32px] w-[100%] items-start">
          Billing
        </p>
      </div>
      <div className="flex h-[calc(100%-55px)] pl-[20px] w-full flex-col gap-[10px] mt-[15px] overflow-auto pb-[40px] pr-[50px]">
        {[...currentUserBilling].map((billingItem: any, index: number) => {
          const billingDate = formatStripeDate(billingItem.stripe_created_at);
          return (
            <div
              key={index}
              className="w-full min-h-[40px] px-[10px] rounded-[5px] flex flex-row justify-between items-center" style={{
                backgroundColor: appTheme[currentUser.theme].background_2_2,
                color: appTheme[currentUser.theme].text_1,
              }}
            >
              <div>
                {capitalizeFirstLetter(billingItem.payment_mode)} |{" "}
                {billingDate && formatDate(billingDate)}
              </div>
              <div>
                <>${formatStripeAmount(billingItem.stripe_amount)} | </>
                <>
                  {capitalizeFirstLetter(
                    billingItem.stripe_latest_payment_status
                  )}
                </>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Billing;
