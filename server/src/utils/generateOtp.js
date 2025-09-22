
const generateOtp = async (email) => {
  try {

     // Generate OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000; // 60 min expiry


    return {
    code,
    expires,
    lastOtpSentAt: new Date(),
    };
  } catch (error) {
    throw error;
  }
};


export default generateOtp;