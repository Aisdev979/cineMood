import { BrevoClient } from '@getbrevo/brevo';
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templateContent = fs.readFileSync(
  path.join(__dirname, "../utilis/otp-email.html"),
  "utf-8"
);

console.log("Loaded email template content:", templateContent);
const brevo = new BrevoClient({ apiKey: process.env.BREVO_API_KEY });


export const sendOTPEmail = async (to, otp, name) => {
  try {
    const response = await brevo.transactionalEmails.sendTransacEmail({
      subject: "Your OTP Code",
      htmlContent: templateContent.replace(/{{OTP_CODE}}/g, otp).replace(/{{USER_NAME}}/g, name).replace(/{{YEAR}}/g, new Date().getFullYear()),
      sender: { name: 'CineMood.ai', email: 'aisosamatthew247@gmail.com' },
      to: [{ email: to }],
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