import { getSystemStatus } from "./getSystemStatus.actions";
import { sendEmail } from "./sendEmail.actions";
import { signupEmailList } from "./signupEmailList.actions";
import { verifyCaptcha } from "./verifyCaptcha.actions";

export const server = {
  getSystemStatus,
  sendEmail,
  signupEmailList,
  verifyCaptcha,
};
