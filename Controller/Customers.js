import { getAllOrdersDetails } from "../Model/OrdersModel.js";
import { Get_API_KEY } from "../helper/GetApiKey.js";
import path from "path";
import fs from "fs";
import ExcelJS from "exceljs";
import puppeteer from "puppeteer";
import handlebars from "handlebars";
import moment from "moment";
import sgMail from "@sendgrid/mail";

/* global Verifyuser */

const __dirname = path.resolve();

export const GetCustomers = async (req, res) => {
  try {
    let request = req.body;
    let options = { sort: { createdAt: -1 } };

    // Fetch all orders from the orders collection
    const orders = await getAllOrdersDetails({}, {}, options);

    // Keep track of the oldest order and count of orders for each email
    const emailData = {};

    orders.forEach((order) => {
      const email = order.email;
      if (!(email in emailData)) {
        emailData[email] = {
          oldestOrder: order,
          totalOrders: 1,
        };
      } else {
        emailData[email].totalOrders += 1;
        if (order.createdAt < emailData[email].oldestOrder.createdAt) {
          emailData[email].oldestOrder = order;
        }
      }
    });

    // Prepare the response with the oldest orders and total orders count
    let filteredOrders = Object.values(emailData).map((data) => ({
      customername: `${data.oldestOrder.first_name} ${data.oldestOrder.last_name}`,
      email: data.oldestOrder.email,
      phone: data.oldestOrder.phone,
      booking_type:
        data.oldestOrder.type === 'home-tab'
          ? `By Hours - ${data.oldestOrder?.hour || ''}`
          : 'By-Transfer',
      register_date: data.oldestOrder.createdAt,
      update_date: data.oldestOrder.updatedAt,
      total_orders: data.totalOrders,
    }));

    const searchQuery = request.search;
    if (searchQuery) {
      filteredOrders = filteredOrders.filter(
        (order) =>
          order.customername.match(new RegExp(searchQuery, 'i')) ||
          order.email.match(new RegExp(searchQuery, 'i'))
      );
    }

    if (request.start_date && request.end_date) {
      const startDate = moment(request.start_date).startOf('day').utc();
      const endDate = moment(request.end_date).endOf('day').utc();

      filteredOrders = filteredOrders.filter((order) => {
        const orderDate = moment(order.register_date);
        return orderDate >= startDate && orderDate <= endDate;
      });
    }

    filteredOrders.sort((a, b) => b.register_date - a.register_date);
    return res.json({ status: 200, data: filteredOrders });
  } catch (error) {
    console.error(`Failed to get Customers data: ${error.message}`);
    return res.send({ status: 500, message: 'Failed to get Customers data' });
  }
};



export const ExportCsv = async (req, res) => {
  try {
    let publicPath = path.join(process.cwd(), "public");
    let ordersFolderPath = path.join(publicPath, "customers");
    let outputPath = path.join(ordersFolderPath, "Customers.xlsx");

    if (!fs.existsSync(ordersFolderPath)) {
      fs.mkdirSync(ordersFolderPath, { recursive: true });
    }

    let options = { sort: { createdAt: -1 } };
    let orders = await getAllOrdersDetails({}, {}, options);

    // Group the orders by email address
    let ordersByEmail = {};
    orders.forEach((order) => {
      if (!ordersByEmail[order.email]) {
        ordersByEmail[order.email] = [];
      }
      ordersByEmail[order.email].push(order);
    });

    let filteredOrders = [];
    let serialNumber = 1; // Initialize the serial number
    for (let email in ordersByEmail) {
      let order = ordersByEmail[email][0];
      order.total_orders = ordersByEmail[email].length;

      const filteredOrder = {};
      filteredOrder.serialNumber = serialNumber++;
      filteredOrder.customername = `${order.first_name} ${order.last_name}`;
      filteredOrder.email = order.email;
      filteredOrder.phone = order.phone;
      filteredOrder.booking_type = order.type;
      filteredOrder.total_orders = order.total_orders;

      filteredOrders.push(filteredOrder);
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Orders");

    worksheet.columns = [
      { header: "S.No", key: "serialNumber", width: 5 },
      { header: "Cutomer Name", key: "customername" },
      { header: "Email", key: "email" },
      { header: "Phone", key: "phone" },
      { header: "Booking Type", key: "booking_type" },
      { header: "Total Orders", key: "total_orders" },
    ];

    worksheet.addRows(filteredOrders);

    worksheet.columns.forEach((column) => {
      column.width = column.header.length < 12 ? 12 : column.header.length;
    });

    worksheet.getRow(1).font = { bold: true };

    await workbook.xlsx.writeFile(outputPath);

    let filePath = outputPath.replace(process.cwd(), "").replace(/\\/g, "/");

    // Remove the `public` directory from the file path
    filePath = filePath.replace("/public", "");

    return res.json({ status: 200, message: "Customers CSV is successfully exported", file: filePath });
  } catch (error) {
    console.error(`Failed to export Customers csv: ${error.message}`);
    return res.send({ status: 500, message: "Failed to export Customers csv" });
  }
};


export const ExportPdf = async (req, res) => {
  try {
    let options = { sort: { createdAt: -1 } };
    let orders = await getAllOrdersDetails({}, {}, options);

    // Group the orders by email address
    let ordersByEmail = {};
    orders.forEach((order) => {
      if (!ordersByEmail[order.email]) {
        ordersByEmail[order.email] = [];
      }
      ordersByEmail[order.email].push(order);
    });

    let filteredOrders = [];
    let serialNumber = 1; // Initialize the serial number
    for (let email in ordersByEmail) {
      let order = ordersByEmail[email][0];
      order.total_orders = ordersByEmail[email].length;

      const filteredOrder = {};
      filteredOrder.serialNumber = serialNumber++;
      filteredOrder.customername = `${order.first_name} ${order.last_name}`;
      filteredOrder.email = order.email;
      filteredOrder.phone = order.phone;// Initialize the serial number
      filteredOrder.booking_type = order.type;
      filteredOrder.total_orders = order.total_orders;

      filteredOrders.push(filteredOrder);
    }

    const customersDir = path.join(__dirname, 'public', 'customers');
    if (!fs.existsSync(customersDir)) {
      fs.mkdirSync(customersDir, { recursive: true });
    }

    let browser = await puppeteer.launch({
      headless: "new",
      timeout: 0,
    });
    let page = await browser.newPage();

    const htmlFilePath = path.join(__dirname, "views", "Customers-pdf.html");
    const html = fs.readFileSync(htmlFilePath, "utf-8");

    let compiledHtml = handlebars.compile(html);
    let data = { filteredOrders };
    let finalHtml = compiledHtml(data);

    let headerFilePath = path.join(__dirname, 'views', 'partials', 'Finance_header.html');
    let footerFilePath = path.join(__dirname, 'views', 'partials', 'Finance_footer.html');

    let headerHtml = fs.readFileSync(headerFilePath, 'utf-8');
    let footerHtml = fs.readFileSync(footerFilePath, 'utf-8');

    let compiledHeaderHtml = handlebars.compile(headerHtml)();
    let compiledFooterHtml = handlebars.compile(footerHtml)();

    finalHtml = compiledHeaderHtml + finalHtml + compiledFooterHtml;

    await page.setContent(finalHtml, { waitUntil: "domcontentloaded" });

    let pdfPath = "public/customers/customers.pdf";
    await page.pdf({
      path: pdfPath,
      format: "A4",
      margin: {
        top: "5px",
        bottom: "5px",
        left: "10px",
        right: "10px",
      }
    });

    const toEmail = Verifyuser.email;
    const subject = 'Customers PDF Export';
    const attachmentPath = path.join(__dirname, pdfPath);
    await sendEmailWithAttachment(toEmail, subject, attachmentPath);

    // Modify the pdfPath to remove 'public' from it
    pdfPath.replace("public", "");

    return res.json({ status: 200, message: "Customers PDF is successfully exported and sent via email" });
  } catch (error) {
    console.error(`Failed to export and send Customers PDF: ${error.message}`);
    return res.json({ status: 500, message: "Failed to export and send Customers PDF" });
  }
};

// Function to send email with attachment
const sendEmailWithAttachment = async (toEmail, subject, attachmentPath) => {
  try {
    let userEmail = Verifyuser?.email;
    let currentDateTime = moment().format('YYYY-MM-DD HH:mm:ss');

    const msg = {
      to: userEmail,
      from: "ThriveBlack Car <admin@thriveblackcar.com>",
      subject: `Customer Pdf is Ready !! ${currentDateTime}`,
      html: `<p>Hello,${Verifyuser?.name} Customers pdf is ready to download and view</p>`,
      attachments: [
        {
          content: Buffer.from(fs.readFileSync(attachmentPath)).toString('base64'),
          filename: 'customers.pdf',
          type: 'application/pdf',
          disposition: 'attachment',
        },
      ],
    };
    await Get_API_KEY();
    sgMail.setApiKey(global.SendGridApiKey);

    await sgMail.send(msg);
    console.log('Email sent successfully');
  } catch (error) {
    console.error(`Failed to send email: ${error.message}`);
  }
};


export const GetOrdersByCustomers = async (req, res) => {
  try {
    let request = req.body;
    let Orders = await getAllOrdersDetails({ email: request?.customer_email });

    if (Orders) {
      Orders = Array.isArray(Orders) ? Orders : [Orders];

      let filteredOrders = Orders.map(order => {
        let newestAdminNote = order?.adminnote ? order.adminnote.reduce((latest, note) => {
          return (new Date(note.date_time) > new Date(latest.date_time)) ? note : latest;
        }) : null;

        let lastChatDateTime = newestAdminNote ? newestAdminNote.date_time : "";

        return {
          orderid: order?.order_id,
          last_chat: lastChatDateTime,
        };
      });

      return res.json({ status: 200, data: filteredOrders });
    } else {
      return res.json({ status: 400, message: "Customer not found" });
    }
  } catch (error) {
    console.error(`Failed to get Customers: ${error.message}`);
    return res.send({ status: 500, message: "Failed to get Customers" });
  }
};



