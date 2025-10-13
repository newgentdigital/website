import { sendEmail } from "./sendEmail.actions";
import { signupEmailList } from "./signupEmailList.action";
import { verifyCaptcha } from "./verifyCaptcha.actions";

export const server = {
  sendEmail,
  signupEmailList,
  verifyCaptcha,
};
