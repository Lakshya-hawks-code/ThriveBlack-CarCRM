import { getAllCredentials } from "../Model/CredentialsModel.js";
import { UpdateCredentialsDetails } from "../Model/CredentialsModel.js";

export const GetApiKey = async (req, res) => {
  try {
    let request = req.body;
    let credentialsArray = await getAllCredentials({});

    if (credentialsArray && credentialsArray.length > 0) {
      let CredentialsData = credentialsArray[0]; 
      let apiKey;

      if (request?.name === "sendgrid") {
        apiKey = CredentialsData.sendgrid ? CredentialsData.sendgrid.api_key : null;
      } else if (request?.name === "twilio") {
        apiKey = CredentialsData.twilio
          ? {
              account_sid: CredentialsData.twilio.account_sid,
              auth_token: CredentialsData.twilio.auth_token,
            }
          : null;
      } else {
        return res.json({ status: 400, message: "Invalid request name" });
      }

      res.json({ status: 200, key: apiKey });
    } else {
      res.json({ status: 400, message: "Failed to retrieve credentials" });
    }
  } catch (error) {
    console.error(`Failed to get Apikey: ${error.message}`);
    res.json({ status: 400, message: error.message });
  }
};


export const UpdateApiKey = async (req, res) => {
  try {
    let request = req.body;
    let credentialsArray = await getAllCredentials({});

    if (credentialsArray?.length > 0) {
      const credentialsData = credentialsArray[0];

      if (request?.name === "sendgrid") {
        if (credentialsData.sendgrid) {
          credentialsData.sendgrid.api_key = request?.key;
          await UpdateCredentialsDetails({ _id: credentialsData._id }, { sendgrid: credentialsData.sendgrid });
        } else {
          return res.json({ status: 400, message: "SendGrid credentials not found" });
        }
      } else if (request?.name === "twilio") {
        if (credentialsData.twilio) {
          credentialsData.twilio.account_sid = request?.key;
          credentialsData.twilio.auth_token = request?.token;
          await UpdateCredentialsDetails({ _id: credentialsData._id }, { twilio: credentialsData.twilio });
        } else {
          return res.json({ status: 400, message: "Twilio credentials not found" });
        }
      } else {
        return res.json({ status: 400, message: "Invalid request name" });
      }
      res.json({ status: 200, message: "API key updated successfully" });
    } else {
      res.json({ status: 400, message: "Failed to retrieve credentials" });
    }
  } catch (error) {
    console.error(`Failed to update API key: ${error.message}`);
    res.json({ status: 400, message: error.message });
  }
};

