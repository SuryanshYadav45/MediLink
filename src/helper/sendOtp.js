import { mailer } from "../utils/nodemailer.js";
const sendOtp = async (email) => {
  try {

     // Generate OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 60 * 60 * 1000; // 60 min expiry

     await mailer(email,"Verification Mail",code)

    return {
    code,
    expires,
    lastOtpSentAt: new Date(),
    };
  } catch (error) {
    throw error;
  }
};


export default sendOtp;