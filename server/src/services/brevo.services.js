import { BrevoClient } from '@getbrevo/brevo';
import dotenv from "dotenv";

dotenv.config();

const brevo = new BrevoClient({ apiKey: process.env.BREVO_API_KEY });


export const sendOTPEmail = async (to, otp) => {
  try {
    const response = await brevo.transactionalEmails.sendTransacEmail({
      subject: "Your OTP Code",
      htmlContent: `
        <div>
          <h2>Verify Your Account</h2>
          <p>Your OTP is:</p>
          <h1>${otp}</h1>
        </div>
      `,
      sender: { name: 'CineMood.ai', email: 'aisosamatthew247@gmail.com' },
      to: [{ email: to}],
    });

    console.log("EMAIL SENT:", response);
    console.log('Email sent. Message ID:', response.messageId);
  } catch (error) {
    console.error(
      "BREVO ERROR:",
      error.response?.body || error.message || error
    );

    throw new Error("Failed to send OTP email");
  }
};



// SEND RESET PASSWORD EMAIL
export const sendResetPasswordEmail = async (to, resetLink) => {
  try {
    await apiInstance.sendTransacEmail({
      sender,
      to: [{ email: to }],
      subject: "Reset Your Password",
      htmlContent: `
        <div style="font-family:sans-serif">
          <h2>Password Reset</h2>

          <p>Click the button below to reset your password:</p>

          <a href="${resetLink}"
             style="
               display:inline-block;
               padding:12px 20px;
               background:black;
               color:white;
               text-decoration:none;
               border-radius:6px;
             ">
             Reset Password
          </a>

          <p>This link expires in 15 minutes.</p>
        </div>
      `,
    });

    console.log("Reset password email sent");
  } catch (error) {
    console.error(error);
    throw new Error("Failed to send reset password email");
  }
};