import { getOrdersById } from "../Model/OrdersModel.js";
import { OrdersInvoice } from "../Controller/Invoice.js";
import { UpdateOrdesDetails } from "../Model/OrdersModel.js";
import { Get_API_KEY } from "../helper/GetApiKey.js";
import path from "path";
import moment from "moment";
import twilio from "twilio";
import fs from "fs";
import sgMail from "@sendgrid/mail";


const __dirname = path.resolve();

export const SendMail = async (req, res) => {
  try {

    let request = req.body;

    let message = {
      to: request?.to,
      from: "ThriveBlack Car <admin@thriveblackcar.com>",
      subject: request?.subject,
      html: `<p>${request?.message}</p>`,
    };
    // Set the SendGrid API key
    await Get_API_KEY();
    sgMail.setApiKey(global.SendGridApiKey);

    await sgMail.send(message);
    res.json({ status: 200, message: "Successfully Sent Mail!" });
  } catch (error) {
    console.error(`Failed to Send mail: ${error.message}`);
    return res.send({ status: 500, message: "Failed to Send mail" });
  }
};


export const PayMail = async (req, res) => {
  try {
    let request = req.body;
    let ordersdata = await getOrdersById({
      order_id: request?.id,
      transcation_id: { $ne: "" },
      pay_mail_status: 0,
    });
    if (ordersdata) {
      let result = await OrdersInvoice({
        body: { id: ordersdata?.order_id, callType: "InLine" },
      });
      if (result?.status == 200) {
        let pickupdate = moment(ordersdata?.pikup_date, "YY-MM-DD").format("YYYY-MM-DD");

        let pathToAttachment = `${__dirname}/public/${result?.file}`;
        let attachment = fs.readFileSync(pathToAttachment).toString("base64");
        let msg = {
          to: ordersdata?.email,
          from: "ThriveBlack Car <admin@thriveblackcar.com>",
          cc: "vishalnagar.hawkscode@gmail.com",
          subject: `Booking Confirmation: ${ordersdata?.first_name} ${ordersdata?.last_name},Pickup on: ${pickupdate} at ${ordersdata?.time}`,
          attachments: [
            {
              content: attachment,
              filename: "invoice.pdf",
              type: "application/pdf",
              disposition: "attachment",
            },
          ],
          html: `<p>Dear ${ordersdata?.first_name} ${ordersdata?.last_name}</p></br><p>We are delighted to inform you that your booking with Thrive Black Car has been successfully confirmed! Your pickup is scheduled for ${pickupdate} at ${ordersdata.time}. We appreciate your trust in our services</p></br><p>To assist you in managing your records, we have attached the invoice for your booking to this email. If you have any questions or require any assistance, please do not hesitate to reach out to our dedicated support team at 855-554-3674. We are always here to ensure a smooth and pleasant experience for you.</p></br><p>Thank you for choosing Thrive Black Car for your transportation needs. We look forward to serving you and providing an exceptional journey.</p></br><p>Best regards,</p></br><p>Team Thrive Black Car</p>`,
        };
        await Get_API_KEY();
        sgMail.setApiKey(global.SendGridApiKey);
        try {
          await sgMail.send(msg);
        } catch (sendGridError) {
          console.error("SendGrid Error:", sendGridError);
          return res.json({ status: 500, message: "Failed to send email with SendGrid" });
        }

        // // Create a Twilio client
        // // let accountSid = global.TwilioAccountSid;
        // // let authToken =  global.TwilioAuthToken;
        // // let client = twilio(accountSid, authToken);
        // // // Send the SMS
        // // let messageResponse = await client.messages.create({
        // //   body: `New Booking confirmed:${ordersdata.first_name} ${ordersdata.last_name} from ${ordersdata.from_location_name} To ${ordersdata.to_location_name} Price:$${ordersdata.amount}`,
        // //   to: "+919983845366",
        // //   from: "+18632266171",
        // // });

        // if (messageResponse.error) {
        //   console.error(`Failed to send SMS: ${messageResponse.error.message}`);
        // }
        let currentdate = new Date();
        await UpdateOrdesDetails(
          { order_id: ordersdata?.order_id },
          {
            pay_mail_status: 1,
            transaction_date: currentdate
          }
        );
        return res.json({ status: 200, message: "Email and sms is sent with Invoice", file: result?.file });
      } else {
        return res.json({ status: 500, message: "Failed to generate invoice" });
      }
    } else {
      res.json({ status: 500, message: "orders not found" });
    }
  } catch (error) {
    console.error(`Failed to find orders: ${error.message}`);
    return res.send({ status: 500, message: "Failed to find orders" });
  }
};
