import {getAllOrdersDetails } from '../Model/OrdersModel.js';
import {UpdateOrdesDetails } from '../Model/OrdersModel.js';
import { Get_API_KEY } from "../helper/GetApiKey.js";
import twilio from 'twilio';
import sgMail from "@sendgrid/mail";
import { forEachAsync } from 'foreachasync';


const SendOrdersMailFunction = async () => {
  try {
      let orders = await getAllOrdersDetails({ createdAt: { $gte: new Date(Date.now() - 10 * 60000) } }); // 10 minutes ago
      if (orders.length > 0) { 
      await forEachAsync(orders, async (element) => {  
        let msg = {
          to: element?.email,
          from: 'ThriveBlack Car <admin@thriveblackcar.com>',
          subject: `Exclusive 10% Offer Awaits! Dont Miss Out ${element?.first_name} ${element?.last_name}! `,
          html: `<p>Dear Developer ${element?.first_name} ${element?.last_name},</p></br><p>We noticed you started a booking with Thrive Black Car but didn't complete it. Don't Worry we've got a special offer just for you! Get 10% off using promocode:</p></br><p style="font-weight:bold;">THRIVEBLACK10</p></br><p>Book now and travel in style with Thrive Black Car, Offer ends soon!</p></br><span style="background-color:#FFD700;"><a href="${process.env.PHP_URL}/${element?.order_id}">Book Now With 10% Discount</a></span></br></br><p>Best regards,</p></br><p>Team Thrive Black Car</p>`,
        };
        await Get_API_KEY();
        sgMail.setApiKey(global.SendGridApiKey);
        await sgMail.send(msg);
      // Update mail_status to 1 after successfully sending the mail
        await UpdateOrdesDetails({ _id: element._id },{ mail_status: 1 });
    });
      }   
    } catch (error) {
      console.error(`Failed to send mail: ${error.message}`); 
      res.send({status:500,message:"Failed to send mail"})
    }
    return;
}


const SendSms = async () => {
  try {
    let orders = await getAllOrdersDetails({ createdAt: { $gte: new Date(Date.now() - 10 * 60000) } }); // 10 minutes ago
    if (orders.length > 0) {
      forEachAsync(orders, async (element) => {  
        let message = "Get 10% off! Use code THRIVEBLACK10";
        let Tonumber=element?.phone
    // Create a Twilio client
    const accountSid = global.TwilioAccountSid;
    const authToken = global.TwilioAuthToken;
    const client = twilio(accountSid, authToken);

        await client.messages.create({
          body: message,
          to: Tonumber,
          from: '+18632266171' 
        });
      });
    }
  } catch (error) {
    console.error(`Failed to send sms: ${error.message}`);
    res.json({status:500,message:"Failed to send sms"})
  }
};

export const SendOrdersMail = async (req, res) => {
  await SendOrdersMailFunction();
  await SendSms();
  res.json({status:200, message: 'Mail & Sms sent successfully' });
};
