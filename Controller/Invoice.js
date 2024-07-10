import { getOrdersById } from "../Model/OrdersModel.js";
import { Get_API_KEY } from "../helper/GetApiKey.js";
import path from "path";
import fs from "fs";
import puppeteer from "puppeteer";
import handlebars from "handlebars";
import moment from "moment";
import sgMail from "@sendgrid/mail";

/* global Verifyuser */

const __dirname = path.resolve();


const getCurrentDate = () => {
  const currentDate = new Date();
  const day = currentDate.getDate();
  const month = currentDate.toLocaleString("default", { month: "long" });
  const year = currentDate.getFullYear();
  return `${month} ${day}, ${year}`;
};

export const OrdersInvoice = async (req, res) => {
  let request = req.body;
  try {
    let Ordersdata = await getOrdersById({ order_id: request.id });
    if (!Ordersdata.transcation_id) {
      return res.json({ status: 400, message: "Transaction ID is empty. PDF generation aborted." });
    }

    const ordersDir = path.join(__dirname, 'public', 'orders');
    if (!fs.existsSync(ordersDir)) {
      fs.mkdirSync(ordersDir, { recursive: true });
    }

    let browser = await puppeteer.launch({
      headless: "new",
      timeout: 0,
    });
    const page = await browser.newPage();

    const htmlFilePath = path.join(__dirname, "views", "Ordersinvoice-pdf.html");
    let html = fs.readFileSync(htmlFilePath, "utf-8");
    const template = handlebars.compile(html);

    const data = {
      firstName: Ordersdata.first_name,
      lastName: Ordersdata.last_name,
      email: Ordersdata.email,
      phoneNumber: Ordersdata.phone,
      pickupDate: moment(Ordersdata.pikup_date, "YY-MM-DD").format("DD MMMM YYYY"),
      pickupTime: Ordersdata.time,
      fromLocationName: Ordersdata.from_location_name,
      toLocationName: Ordersdata.to_location_name,
      hour: Ordersdata.hour,
      passenger: Ordersdata.num_passengers || "-",
      luggage: Ordersdata.num_luggage || "-",
      gratuity: Ordersdata.gratuity,
      tax: Ordersdata.tax,
      amount: Ordersdata.amount,
      Baseamount: Ordersdata.base_amount,
      Car_type: Ordersdata.car_type,
      isPassenger: Ordersdata.is_passenger !== undefined && Ordersdata.is_passenger !== null ? parseInt(Ordersdata.is_passenger, 10) : null,
      passName: Ordersdata.other_pass_name || null,
      passPhone: Ordersdata.other_pass_phone || null,
      getCurrentDate: getCurrentDate(),
      showPromoRow: Ordersdata.promo !== undefined && Ordersdata.promo !== null && Ordersdata.promo !== "0" && Ordersdata.promo !== 0,
      PromoCode: Ordersdata.promo !== undefined && Ordersdata.promo !== null && Ordersdata.promo !== "0" && Ordersdata.promo !== 0 ? Ordersdata.promo_code.toUpperCase() : null,
      PromoAmount: Ordersdata.promo !== undefined && Ordersdata.promo !== null && Ordersdata.promo !== "0" && Ordersdata.promo !== 0 ? Ordersdata.promo : null,
      meetAndGreet: Ordersdata.meetandgreet !== undefined && Ordersdata.meetandgreet !== null && Ordersdata.meetandgreet !== "0" && Ordersdata.meetandgreet !== 0 ? Ordersdata.meetandgreet : null,
      flightNumber: Ordersdata.flight_number ? Ordersdata.flight_number : null,
      returDate: Ordersdata.book_return && Ordersdata.returndate ? Ordersdata.returndate : null,
      returnTime: Ordersdata.book_return && Ordersdata.returntime ? Ordersdata.returntime : null,
      returnFlight: Ordersdata.book_return && Ordersdata.returnflight ? Ordersdata.returnflight : null,
      surgecharges: Ordersdata.surgecharges ? Ordersdata.surgecharges : null,
      timesurgecharge: (Ordersdata.timesurgecharge !== undefined && Ordersdata.timesurgecharge !== null && Ordersdata.timesurgecharge !== "0" && Ordersdata.timesurgecharge !== 0),
      timesurgechargeValue: Ordersdata.timesurgecharge,
      homeTabExists: Ordersdata.type === "home-tab",
    };

    const compiledHtml = template(data);

    const headerFilePath = path.join(__dirname, "views", "partials", "Header.html");
    const headerHtml = fs.readFileSync(headerFilePath, "utf-8");

    const headerTemplate = handlebars.compile(headerHtml);
    const headerData = {

      OrderId: Ordersdata.order_id,
      getCurrentDate: getCurrentDate(),
    };
    const compiledHeaderHtml = headerTemplate(headerData);

    const footerFilePath = path.join(__dirname, "views", "partials", "Footer.html");
    const footerHtml = fs.readFileSync(footerFilePath, "utf-8");

    html = compiledHeaderHtml + compiledHtml + footerHtml;

    await page.setContent(html, { waitUntil: "domcontentloaded" });

    let pdfPath = "/orders/orders-invoice.pdf";

    await page.pdf({
      path: `public${pdfPath}`,
      format: "A4",
      margin: {
        top: "15px",
        bottom: "25px",
        left: "30px",
        right: "30px",
      },
      printBackground: true,
    });

    await browser.close();

    if (request?.callType && request?.callType == "InLine") {
      return { status: 200, message: "Orders Invoice PDF is successfully generated", file: pdfPath };
    } else {
      return res.json({ status: 200, message: "Orders Invoice PDF is successfully generated", file: pdfPath });
    }
  } catch (error) {
    console.error(`Failed to generate invoice: ${error.message}`);
    if (request?.callType && request?.callType == "InLine") {
      return { status: 500, message: "Failed to generate invoice" };
    } else {
      return res.send({ status: 500, message: "Failed to generate invoice" });
    }
  }
};


export const ZeroInvoice = async (req, res) => {
  let request = req.body;
  try {
    let Ordersdata = await getOrdersById({ order_id: request.id });
    if (!Ordersdata) {
      return res.json({ status: 400, message: "Orders not found" });
    }
    if (!Ordersdata?.transcation_id) {
      return res.json({ status: 400, message: "Transaction ID is empty. PDF generation aborted." });
    }

    const ordersDir = path.join(__dirname, 'public', 'orders');
    if (!fs.existsSync(ordersDir)) {
      fs.mkdirSync(ordersDir, { recursive: true });
    }

    let browser = await puppeteer.launch({
      headless: "new",
      timeout: 0,
    });
    const page = await browser.newPage();

    const htmlFilePath = path.join(__dirname, "views", "Zeroinvoice.html");
    let html = fs.readFileSync(htmlFilePath, "utf-8");
    const template = handlebars.compile(html);

    const data = {
      firstName: Ordersdata.first_name,
      lastName: Ordersdata.last_name,
      email: Ordersdata.email,
      phoneNumber: Ordersdata.phone,
      pickupDate: moment(Ordersdata.pikup_date, "YY-MM-DD").format("DD MMMM YYYY"),
      pickupTime: Ordersdata.time,
      fromLocationName: Ordersdata.from_location_name,
      toLocationName: Ordersdata.to_location_name,
      hour: Ordersdata.hour,
      passenger: Ordersdata.num_passengers || "-",
      luggage: Ordersdata.num_luggage || "-",
      gratuity: Ordersdata.gratuity,
      tax: Ordersdata.tax,
      amount: Ordersdata.amount,
      Baseamount: Ordersdata.base_amount,
      Car_type: Ordersdata.car_type,
      isPassenger: Ordersdata.is_passenger !== undefined && Ordersdata.is_passenger !== null ? parseInt(Ordersdata.is_passenger, 10)
        : null,
      passName: Ordersdata.other_pass_name || null,
      passPhone: Ordersdata.other_pass_phone || null,
      getCurrentDate: getCurrentDate(),
      showPromoRow: Ordersdata.promo !== undefined && Ordersdata.promo !== null && Ordersdata.promo !== "0" && Ordersdata.promo !== 0,
      PromoCode: Ordersdata.promo !== undefined && Ordersdata.promo !== null && Ordersdata.promo !== "0" && Ordersdata.promo !== 0 ? Ordersdata.promo_code.toUpperCase() : null,
      PromoAmount: Ordersdata.promo !== undefined && Ordersdata.promo !== null && Ordersdata.promo !== "0" && Ordersdata.promo !== 0 ? Ordersdata.promo : null,
      meetAndGreet: Ordersdata.meetandgreet !== undefined && Ordersdata.meetandgreet !== null && Ordersdata.meetandgreet !== "0" && Ordersdata.meetandgreet !== 0 ? Ordersdata.meetandgreet : null,
      flightNumber: Ordersdata.flight_number ? Ordersdata.flight_number : null,
      returDate: Ordersdata.book_return && Ordersdata.returndate ? Ordersdata.returndate : null,
      returnTime: Ordersdata.book_return && Ordersdata.returntime ? Ordersdata.returntime : null,
      returnFlight: Ordersdata.book_return && Ordersdata.returnflight ? Ordersdata.returnflight : null,
      surgecharges: Ordersdata.surgecharges ? Ordersdata.surgecharges : null,
      timesurgecharge: Ordersdata.timesurgecharge ? Ordersdata.timesurgecharge : null,
      homeTabExists: Ordersdata.type === "home-tab",
    };

    const compiledHtml = template(data);

    const headerFilePath = path.join(__dirname, "views", "partials", "Header.html");
    const headerHtml = fs.readFileSync(headerFilePath, "utf-8");
    const headerTemplate = handlebars.compile(headerHtml);
    const headerData = {
      OrderId: Ordersdata.order_id,
      getCurrentDate: getCurrentDate(),
    };
    const compiledHeaderHtml = headerTemplate(headerData);

    const footerFilePath = path.join(__dirname, "views", "partials", "Footer.html");
    const footerHtml = fs.readFileSync(footerFilePath, "utf-8");

    html = compiledHeaderHtml + compiledHtml + footerHtml;

    await page.setContent(html, { waitUntil: "domcontentloaded" });

    const pdfPath = "/orders/Zeroinvoice.pdf";
    const pdfFullPath = `public${pdfPath}`;

    await page.pdf({
      path: pdfFullPath,
      format: "A4",
      margin: {
        top: "15px",
        bottom: "25px",
        left: "30px",
        right: "30px",
      },
      printBackground: true,
    });

    await browser.close();
    // Send email with the generated PDF as an attachment using SendGrid
    let userMail = Verifyuser.email;
    let Username = `${Ordersdata.first_name} ${Ordersdata.last_name}`;
    const pdfContent = fs.readFileSync(pdfFullPath, 'base64');
    const msg = {
      to: userMail,
      from: "ThriveBlack Car <admin@thriveblackcar.com>",
      subject: 'Zero Invoice PDF is Ready!!',
      html: `<p>Welcome to ThriveBlack Car</p></p><p>Hello,${Username} Invoice pdf is ready to download and view</p>`,
      attachments: [
        {
          filename: 'Zeroinvoice.pdf',
          content: pdfContent,
          encoding: 'base64',
        },
      ],
    };
    await Get_API_KEY();
    sgMail.setApiKey(global.SendGridApiKey);
    await sgMail.send(msg);
    return res.json({ status: 200, message: "Invoice is Successfully generated and sent via mail" });
  } catch (error) {
    console.error(`Failed to generate invoice: ${error.message}`);
    if (error.response) {
      console.error('SendGrid error:', error.response.body);
    }
    if (request?.callType && request?.callType == "InLine") {
      return { status: 500, message: "Failed to generate invoice" };
    } else {
      return res.send({ status: 500, message: "Failed to generate invoice" });
    }
  }
};