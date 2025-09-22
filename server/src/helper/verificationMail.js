import { mailer } from "../config/nodemailer.js";


export const sendVerificationMail = async (email,code) => {
     await mailer(email,"Verification Mail",code)
}