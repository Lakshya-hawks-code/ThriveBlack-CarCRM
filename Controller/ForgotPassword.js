import { getUserById } from "../Model/AdminModel.js";
import { UpdateUserDetails } from "../Model/AdminModel.js";
import { Get_API_KEY } from "../helper/GetApiKey.js";
import crypto from "crypto";
import sgMail from "@sendgrid/mail";


/* global Verifyuser */

export const AdminsForgotPassword = async (req, res) => {
  try {
    let emailAddress = req.body.email;
    let admin = await getUserById({ email: emailAddress });
    if (!admin) {
      return res.json({ status:400, message: "Admin not found" });
    }

    let forgottoken = crypto.randomBytes(32).toString("hex");

    // Send the email
    let msg = {
      to: emailAddress,
      from: "ThriveBlack Car <admin@thriveblackcar.com>",
      subject: "Reset Password Link",
      html: `Hello, ${admin?.name}</br>
        <p>Sorry to hear you're having trouble logging into ThriveBlack Car</br>.
        We got a message that you forgot your password.</p></br>
        <p>If this was you ,you can reset your password
        <a href="${process.env.FRONTEND_URL}changepassword/${forgottoken}"> Click for reset Password</a></p> </br>
        Best regards,</br>
        The ThriveBlackCar Team`,
    };
    await Get_API_KEY();
    sgMail.setApiKey(global.SendGridApiKey);

    await sgMail.send(msg);

    // Save the forgottoken to the database
    let updateData = {
      forgottoken,
    };

    await admin.updateOne(updateData);

    return res.json({
        message: "Email Successfully Sent Please Check!",
        status:200
      });
  } catch (error) {
    console.error(`Failed to send mail: ${error.message}`);
    return res.json({ status: 400, message: "Failed to Sent Email" });
  }
};



export const VerifyForgotToken = async (req, res) => {
  try {
    let userToken = req.body.token;
    let Verify = await getUserById({ forgottoken: userToken });
    if (!Verify) {
      return res.json({status:400, message: "Forgot Token is not matched" });
    }
    else{
        return res.json({status:200, message:"Forgot Token has been Successfully Verified" });
    }
  } catch (error) {
    console.error(`Failed to verify Token: ${error.message}`);
    return res.json({status:500, message: "Failed to update password" });
  }
};



export const AdminsPasswordUpdate = async (req, res) => {
  try {
    let userToken = req.body.token;
    let newpassword = req.body.password;
    let admin = await getUserById({ forgottoken: userToken });

    if (!admin) {
      return res.json({ status: 400, message: "Forgot Token not matched" });
    } else {

      let salt = crypto.randomBytes(16).toString("hex");

      let hashedPassword = crypto
        .pbkdf2Sync(newpassword, salt, 10000, 64, "sha512")
        .toString("hex");

      let changepassword = await UpdateUserDetails(
        { _id: admin._id },
        { password: hashedPassword, forgottoken: null,salt:salt }
      );

      if (changepassword) {
        return res.json({ status: 200, message: "Password successfully changed" });
      } else {
        return res.json({ status: 500, message: "Failed to change password" });
      }
    }
  } catch (error) {
    console.error(`Failed to change password: ${error.message}`);
    return res.json({ status: 500, message: "Failed to change password" });
  }
};



export const UpdatePassword = async (req, res) => {
  try {
    let { oldpassword, newpassword } = req.body;
    let user = await getUserById({ _id: Verifyuser._id });

    if (!user) {
      return res.json({ status: 400, message: "Record not found" });
    }

    let usersalt = user.salt;

    let hashedOldPassword = crypto.pbkdf2Sync(oldpassword, usersalt, 10000, 64, "sha512").toString("hex");

    if (hashedOldPassword !== user.password) {
      return res.json({ status: 400, message: "Old password does not match" });
    }

    let salt = crypto.randomBytes(16).toString("hex");
    
    let hashedNewPassword = crypto.pbkdf2Sync(newpassword,salt, 10000, 64, "sha512").toString("hex");

    let updatePasswordResult = await UpdateUserDetails({ _id: user._id }, { password: hashedNewPassword, salt: salt });

    if (updatePasswordResult) {
      return res.json({ status: 200, message: "Password Successfully updated" });
    } else {
      return res.json({ status: 500, message: "Failed to update Password" });
    }
  } catch (error) {
    console.error(`Failed to update: ${error.message}`);
    return res.json({ status: 500, message: "Failed to update" });
  }
};
