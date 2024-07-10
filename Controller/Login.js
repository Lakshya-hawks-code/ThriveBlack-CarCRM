import { getUserById } from "../Model/AdminModel.js";
import { UpdateUserDetails } from "../Model/AdminModel.js";
import { Get_API_KEY } from "../helper/GetApiKey.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import sgMail from "@sendgrid/mail";


// Function to generate a random 4-digit OTP
const generateOtp = () => {
  const min = 1000;
  const max = 9999;
  return Math.floor(Math.random() * (max - min + 1) + min);
};


export const Login = async (req, res) => {
  let request = req.body;
  let emailAddress = request.email;
  let userPassword = request.password;

  try {
    const admin = await getUserById({ email: emailAddress });

    if (!admin) {
      return res.json({ status: 404, message: "Email does not exist." });
    }

    if (admin.status !== 1) {
      return res.json({ status: 403, message: "Admin is suspended." });
    }

    let salt = admin.salt;

    let hashedPassword = crypto
      .pbkdf2Sync(userPassword, salt, 10000, 64, "sha512")
      .toString("hex");

    let adminpassword = admin.password;

    let isPasswordMatch = hashedPassword === adminpassword;

    if (!isPasswordMatch) {
      return res.json({ status: 401, message: "Incorrect password." });
    }

    const otp = generateOtp();

    // Send email with OTP to admin
    await sendOtpEmail(admin.email, otp, admin.user_type);

    await UpdateUserDetails({ email: admin.email }, { otp });

    res.json({ status: 200, message: "Otp sent to your registered mail id" });
  } catch (error) {
    console.error(`Failed to login: ${error.message}`);
    res.json({ status: 500, message: "Failed to login" });
  }
};

// Function to send OTP on email
const sendOtpEmail = async (toEmail, otp, user_type) => {
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleString();

  const isDriver = user_type === 2 || user_type === "2";
  // Determine HTML content based on user type
  const htmlContent = isDriver
    ? `<p>Hello ThriveBlackCar Driver,</p>
            <p>Your Two-Factor Authentication (2FA) One-Time Password (OTP) is: <b>${otp}</b></p>
            <p>Best regards,</p>
            <p>The ThriveBlackCar Team</p>`
    : `<p>Hello ThriveBlackCar Administrator,</p>
            <p>Your Two-Factor Authentication (2FA) One-Time Password (OTP) is: <b>${otp}</b></p>
            <p>Best regards,</p>
            <p>The ThriveBlackCar Team</p>`;

  const msg = {
    to: toEmail,
    from: 'ThriveBlack Car <admin@thriveblackcar.com>',
    subject: `Your 2FA code for login in ThriveBlackCar Lead panel - ${formattedDate}`,
    html: htmlContent,
  };
  try {
    await Get_API_KEY();
    sgMail.setApiKey(global.SendGridApiKey);
    await sgMail.send(msg);
    console.log('Email sent successfully');
  } catch (error) {
    console.error(`Failed to send email: ${error.message}`);
    throw new Error('Failed to send email');
  }
};


export const OtpVerification = async (req, res) => {
  let request = req.body;
  try {

    const admin = await getUserById({ otp: request?.otp });

    if (admin) {
      let payload = {
        id: admin._id.toString(),
      };

      let token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "15m",
      });

      let splitString = token.split(".", 3);

      await UpdateUserDetails({ _id: admin._id }, { otp: '', token: splitString[2] });

      res.json({ status: 200, message: "Successfully logged in", token: splitString[2] });
    } else {
      res.json({ status: 401, message: "Incorrect OTP" });
    }
  } catch (error) {
    console.error(`Failed to login: ${error.message}`);
    res.json({ status: 500, message: "Failed to login" });
  }
};









