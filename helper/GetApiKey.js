import { getAllCredentials } from '../Model/CredentialsModel.js';


export const Get_API_KEY = async (req, res) => {
  try {
    let credentialsData = await getAllCredentials({});

    if (Array.isArray(credentialsData) && credentialsData.length > 0) {
      let firstCredentialsObject = credentialsData[0];

      let sendGridCredentials = firstCredentialsObject.sendgrid;
      let twilioCredentials = firstCredentialsObject.twilio;

      global.SendGridApiKey = sendGridCredentials.api_key;
      global.TwilioAccountSid = twilioCredentials.account_sid;
      global.TwilioAuthToken = twilioCredentials.auth_token;
    } else {
      console.log('No credentials data found');
    }
  } catch (error) {
    console.error(`Failed to get api key: ${error.message}`);
    throw new Error('Failed to get api key');
  }
};
