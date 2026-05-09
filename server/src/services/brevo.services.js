import SibApiV3Sdk from "sib-api-v3-sdk";

const client = SibApiV3Sdk.ApiClient.instance;

const apiKey = client.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

console.log(process.env.BREVO_API_KEY);

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const sender = {
  email: "aisdev99@gmail.com",
  name: "CineMood",
};

export const sendOTPEmail = async (to, otp) => {
  try {
    const response = await apiInstance.sendTransacEmail({
      sender,
      to: [{ email: to }],
      subject: "Your OTP Code",
      htmlContent: `
        <div>
          <h2>Verify Your Account</h2>
          <p>Your OTP is:</p>
          <h1>${otp}</h1>
        </div>
      `,
    });

    console.log("EMAIL SENT:", response);
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