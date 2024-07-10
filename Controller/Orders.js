import { CreateAndUpdate, getAllOrdersDetails } from "../Model/OrdersModel.js";
import { getUserById } from "../Model/AdminModel.js";
import { getOrdersById } from "../Model/OrdersModel.js";
import { deleteOrdersById } from "../Model/OrdersModel.js";
import { UpdateOrdesDetails, deleteAllOrders } from "../Model/OrdersModel.js";
import { NotificationCreateAndUpdate } from "../Model/NotificationModel.js";
import { OrdersInvoice } from "../Controller/Invoice.js";
import { getAllPriceDetails } from "../Model/PriceModel.js"
import { ObjectId } from "mongodb";
import { Get_API_KEY } from "../helper/GetApiKey.js";
import ExcelJS from "exceljs";
import path from "path";
import fs from "fs";
import moment from "moment";
import twilio from 'twilio';
import sgMail from "@sendgrid/mail";

/* global Verifyuser */

const __dirname = path.resolve();

export const OrderCreateAndUpdate = async (req, res) => {
  try {
    let request = req.body;

    // Add an empty Value or default value
    request.transcation_id = request.transcation_id ? request.transcation_id : "";
    request.pay_mail_status = 0;
    request.driver_id = "";
    request.book_status = 0;
    request.driver_note = "";
    request.booking_by = "system";

    // Check if surgecharges key exists, if not, set it to an empty string
    if (!("surgecharges" in request)) {
      request.surgecharges = "";
    }
    if (!("beforesurgecharges" in request)) {
      request.beforesurgecharges = "";
    }
    if (!("billing_address" in request)) {
      request.billing_address = "";
    }
    if (!("zipcode" in request)) {
      request.zipcode = "";
    }
    if (!("city" in request)) {
      request.city = "";
    }
    if (!("state" in request)) {
      request.state = "";
    }
    if (!("tracking_id" in request)) {
      request.tracking_id = "";
    }
    if (!("base_amount" in request)) {
      request.base_amount = 0;
    }
    if (!("timesurgecharge" in request)) {
      request.timesurgecharge = 0;
    }
    request.Status = {
      isActive: request?.transcation_id === "" ? 0 : 1,
    };

    let checkCustomerId = await getUserById({ email: request?.email, user_type: 3 })
    if (checkCustomerId) {
      let checkOrdersCustomerId = await getOrdersById({ email: checkCustomerId?.email })
      if (checkOrdersCustomerId) {
        request.customer_id = checkCustomerId?.customer_id
      }
      else {
        request.customer_id = new ObjectId().toString();
      }
    }
    const settings = await CreateAndUpdate(request);

    if (settings) {
      const notificationResult = await NotificationCreateAndUpdate({
        message: `The new order is created from ${request?.from_location_name} to ${request?.to_location_name}`,
        navigate: "order",
      });

      if (notificationResult) {
        if (request?.staff_id) {
          SendOrderStaffMail(settings).then(() => {
            console.log('Staff email sent');
          }).catch((error) => {
            console.error('Error sending staff email:', error);
          });
          // SendOrderStaffSms(settings).then(() => {
          //   console.log('Staff sms sent');
          // }).catch((error) => {
          //   console.error('Error sending staff sms:', error);
          // });
        }
        res.json({ status: 200, message: "Order Successfully Added" });
      }
    } else {
      res.json({ status: 400, message: "failed to add order" });
    }
  } catch (error) {
    console.error(`Failed to Order Data: ${error.message}`);
    res.json({ status: 500, message: "Failed to Order Data" });
  }
};

const SendOrderStaffMail = async (user) => {
  const formattedPickupDate = moment(user?.pikup_date).format('DD-MM-YYYY');
  let msg = {
    to: user?.email,
    from: 'ThriveBlack Car <admin@thriveblackcar.com>',
    subject: `Booking with Thrive Black Car : ${user?.first_name} ${user?.last_name},Pickup on: ${formattedPickupDate} at ${user?.time} `,
    html: `<p>Dear ${user?.first_name} ${user?.last_name},</p></br>
    <p>We noticed you started a booking with Thrive Black Car but didn't complete payment section in it. Don't worry,click this link <a href="${process.env.FRONTEND_RESERVATION_URL}/${user?.order_id}" target="_blank">Book Your Ride Now</a></p></br>
    <p>If you have any questions or require any assistance, please do not hesitate to reach out to our dedicated support team at <b>855-554-3674</b>. We are always here to ensure a smooth and pleasant experience for you.</p></br>
    <p>Thank you for choosing Thrive Black Car for your transportation needs. We look forward to serving you and providing an exceptional journey.</p></br>
    <p>Best regards,</p></br>
    <p>Team Thrive Black Car</p></br>`,
  };
  await Get_API_KEY();
  sgMail.setApiKey(global.SendGridApiKey);
  await sgMail.send(msg);
}

const SendOrderStaffSms = async (user) => {
  try {
    let message = `Dear ${user?.first_name} ${user?.last_name},\n\n`
      + `We noticed you started a booking with Thrive Black Car but didn't complete payment section in it. `
      + `Don't worry, click this link ${process.env.FRONTEND_RESERVATION_URL}/${user?.order_id} to book your ride now.\n\n`
      + `Best regards,\n`
      + `Team Thrive Black Car`;

    await Get_API_KEY();
    const accountSid = global.TwilioAccountSid;
    const authToken = global.TwilioAuthToken;
    const client = twilio(accountSid, authToken);

    // Send the SMS message
    await client.messages.create({
      body: message,
      to: user?.phone,
      from: '+13082086929'
    });

    console.log('SMS sent successfully');
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
}



export const GetOrders = async (req, res) => {
  try {
    const request = req?.body;

    let filter = {};
    let status = parseInt(request?.status);
    if (status === 1) {
      filter["Status.isActive"] = 1;
    } else if (status === 2) {
      filter["Status.isActive"] = 0;
    } else {
      filter["Status.isActive"] = { $in: [1, 0] };
    }

    if (request?.search) {
      const searchRegex = new RegExp(request?.search, "i");
      filter.$or = [
        { first_name: searchRegex },
        { last_name: searchRegex },
        { email: searchRegex },
        { transcation_id: searchRegex },
      ];
    }

    if (!request?.start_date || !request?.end_date) {
      filter.createdAt = {
        $exists: true,
      };
    } else {
      const startDate = moment(request?.start_date).startOf("day").utc();
      const endDate = moment(request?.end_date).endOf("day").utc();

      filter.createdAt = {
        $gte: startDate.toDate(),
        $lte: endDate.toDate(),
      };
    }
    if (request?.driver_id) {
      filter.driver_id = request?.driver_id;
    }

    if (request?.email) {
      filter.email = request?.email;
    }

    if (request?.staff_id) {
      filter.staff_id = request?.staff_id;
    }


    let options = { sort: { createdAt: -1 } };

    const orders = await getAllOrdersDetails(filter, {}, options);

    if (!orders) {
      return res.json({ status: 200, data: [] });
    }

    const filteredOrders = [];

    for (const order of orders) {
      const filteredOrder = {};
      filteredOrder.id = order?._id;
      filteredOrder.customer = `${order?.first_name} ${order?.last_name}`;
      filteredOrder.email = order?.email;
      filteredOrder.phone = order?.phone;
      filteredOrder.specialNote = order?.aditional_info;
      filteredOrder.pickupDate = moment(order?.pikup_date, "YY-MM-DD").format("YYYY-MM-DD");
      filteredOrder.pickupLocation = order?.from_location_name;
      filteredOrder.toLocation = order?.to_location_name;
      filteredOrder.bookingCar = order?.car_type;
      filteredOrder.bookingType = order?.type === 'home-tab' ? 'By-Transfer' : `By Hours -  ${order?.hour || ''}`
      filteredOrder.luggage = order?.num_luggage;
      filteredOrder.passengers = order?.num_passengers;
      filteredOrder.is_passengers = order?.is_passenger;
      if (order.other_pass_name && order?.other_pass_phone) {
        filteredOrder.passengersdetails = `Passenger Name:-${order?.other_pass_name}, Passenger Phone:-${order?.other_pass_phone}`;
      }
      filteredOrder.meetandgreet = order?.meetandgreet ? order?.meetandgreet : "";
      filteredOrder.returnBook = order?.book_return;
      filteredOrder.returndate = moment(order?.returndate, "YYYY-MM-DD").format("MMM DD,YYYY");
      filteredOrder.returntime = order?.returntime;
      filteredOrder.returnflight = order?.returnflight;
      filteredOrder.flightDetails = order?.flight_number;
      filteredOrder.paymentStatus = order?.Status?.isActive;
      filteredOrder.billingAddress = order?.billing_address;
      filteredOrder.bookingCreatedAt = order?.createdAt;
      filteredOrder.totalAmount = order?.amount;
      filteredOrder.order_id = order?.order_id;
      filteredOrder.transcation_id = order?.transcation_id;
      filteredOrder.pay_mail_status = order?.pay_mail_status;
      filteredOrder.surgecharges = order?.surgecharges;
      filteredOrder.adminnote = order?.adminnote;
      filteredOrder.base_amount = order?.base_amount;
      filteredOrder.tracking_id = order?.tracking_id || "";
      filteredOrder.booking_status = order?.book_status || 0;
      filteredOrder.timesurgecharge = order?.timesurgecharge;
      filteredOrder.staff_name = "";
      filteredOrder.assigncomment = order?.assigncomment ? order?.assigncomment : "";
      filteredOrder.assignamount = order?.assignamount ? order?.assignamount : "";

      if (order?.staff_id) {
        let staffData = await getUserById({ _id: order?.staff_id })
        if (staffData) {
          filteredOrder.staff_name = staffData?.name;
        }
      }
      if (order?.driver_id) {
        let DriverId = new ObjectId(order?.driver_id);
        const driverDetails = await getUserById({ _id: DriverId });
        if (driverDetails) {
          filteredOrder.driver = {
            value: driverDetails?._id,
            label: driverDetails?.name,
          };
          filteredOrder.driver_booking_amount = order?.driver_booking_amount;
        }
      }
      if (order?.vehicle_model) {
        let VehicleData = await getAllPriceDetails();
        let vehicleDetail = VehicleData.find(detail => Array.isArray(detail?.vehicle_model));
        if (vehicleDetail) {
          const model = vehicleDetail.vehicle_model.find(m => m.id === order.vehicle_model);

          if (model) {
            filteredOrder.vehicle_model = {
              value: model.id,
              label: model.name
            };
          }
        }
      }
      filteredOrders.push(filteredOrder);

    }


    return res.json({ status: 200, data: filteredOrders });
  } catch (error) {
    console.log(`Failed to search orders: ${error}`);
    return res.json({ status: 500, message: "Failed to search orders" });
  }
};


export const GenerateInvoice = async (req, res) => {
  try {
    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);

    const orders = await getAllOrdersDetails({
      created_date: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    if (orders && orders?.length > 0) {
      const publicPath = path.join(process.cwd(), "public");
      const ordersFolderPath = path.join(publicPath, "orders");
      const outputPath = path.join(ordersFolderPath, "orders.xlsx");

      // Check if the file exists and delete it if it does.
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Orders");

      worksheet.columns = [
        { header: "Order_id", key: "order_id" },
        { header: "first_name", key: "first_name" },
        { header: "last_name", key: "last_name" },
        { header: "Email", key: "email" },
        { header: "Phone", key: "phone" },
        { header: "Created_date", key: "created_date" },
      ];

      orders.forEach((order) => {
        worksheet.addRow(order);
      });

      worksheet.columns.forEach(
        (column) =>
          (column.width = column.header.length < 12 ? 12 : column.header.length)
      );
      worksheet.getRow(1).font = { bold: true };

      await workbook.xlsx.writeFile(outputPath);

      let Admin = await getUserById({ _id: Verifyuser._id });

      if (Admin) {
        const invoicePath = "/orders/orders.xlsx";
        res.json({
          status: 200,
          message: "Invoice created successfully",
          data: invoicePath,
        });
      }
    } else {
      res.json({ status: 200, message: "Orders not found" });
    }
  } catch (error) {
    console.error(`Failed to search orders: ${error.message}`);
    return res.json({ status: 500, message: "Failed to search orders" });
  }
};

export const DeleteOrders = async (req, res) => {
  try {
    const request = req.body;
    const orders = await getOrdersById({ order_id: request?.id });

    if (!orders) {
      return res.json({ status: 400, message: "Record not found" });
    }
    const result = await deleteOrdersById({ _id: orders?._id });

    if (result) {
      return res.json({ status: 200, message: "successfully deleted" });
    } else {
      return res.send({ status: 500, message: "Failed to delete order" });
    }
  } catch (error) {
    console.error(`Failed to delete order: ${error.message}`);
    return res.send({ status: 500, message: "Failed to delete order" });
  }
};

export const UpdateOrders = async (req, res) => {
  try {
    let request = req.body;
    let orders = await getOrdersById({ order_id: request?.id });

    if (!orders) {
      return res.json({ status: 400, message: "Record not found" });
    }

    let updateData = { ...request };

    if (request?.adminid) {
      let Admin = await getUserById({ _id: request?.adminid });
      if (Admin) {
        updateData = { ...updateData, booking_by: Admin?.name };
      }
    }

    if (request?.transcation_id === "cash") {
      updateData = { ...updateData, transcation_id: `cash_${request?.id}` };
    }

    await UpdateOrdesDetails({ _id: orders?._id }, updateData);

    return res.json({ status: 200, message: "Successfully updated" });
  } catch (error) {
    console.error(`Failed to update order: ${error.message}`);
    return res.send({ status: 500, message: "Failed to update order" });
  }
};


// Function to get the current date and time in the desired format
const getCurrentDateTime = () => {
  const currentDate = new Date();
  const day = currentDate.getDate();
  const month = currentDate.toLocaleString("default", { month: "short" });
  const year = currentDate.getFullYear();
  const hours = currentDate.getHours();
  const minutes = currentDate.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";

  // Convert hours from 24-hour format to 12-hour format
  const formattedHours = hours % 12 || 12;

  const timeString = `${formattedHours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
  const dateString = `${month} ${day}, ${year}`;

  return `${dateString}, ${timeString}`;
};

export const GetOrderById = async (req, res) => {
  try {
    let request = req.body;
    let ordersdata = await getOrdersById({ order_id: request?.id });
    if (ordersdata) {
      return res.json({ status: 200, data: ordersdata });
    } else {
      res.json({ status: 400, message: "Order not found" });
    }
  } catch (error) {
    console.error(`Failed to find orders: ${error.message}`);
    return res.send({ status: 500, message: "Failed to find orders" });
  }
};

export async function GetOrdersByTransaction(req, res) {
  try {
    const request = req.body;

    if (request?.id) {
      const ordersdata = await getOrdersById({
        order_id: request?.id,
        transcation_id: "",
      });

      if (ordersdata) {
        return res.json({ status: 200, data: ordersdata, adminstatus: 0 });
      }
    }
    const admindata = await getUserById({
      _id: request?.id,
    });

    if (admindata) {
      return res.json({ status: 200, adminstatus: 1 });
    } else {
      return res.json({ status: 400, message: "invalid order id" });
    }
  } catch (error) {
    console.error(`Failed to find order: ${error.message}`);
    return res.send({ status: 500, message: "Failed to find order" });
  }
}

export async function BookingStatus(req, res) {
  try {
    let request = req.body;
    let Orders = await getOrdersById({ order_id: request?.id });
    if (Orders) {
      let bookingStatus = parseInt(request?.status);
      let BookingUpdate = await UpdateOrdesDetails(
        { order_id: request?.id },
        { book_status: bookingStatus }
      );
      if (BookingUpdate) {
        return res.json({ status: 200, message: "successfully updated" });
      }
    }
    return res.json({ status: 400, message: "Record not found" });
  } catch (error) {
    console.error(`Failed to find booking: ${error.message}`);
    return res.send({ status: 500, message: "Failed to find booking" });
  }
}

export async function BookingComment(req, res) {
  try {
    let request = req.body;
    let Orders = await getOrdersById({ order_id: request?.id });
    if (Orders) {
      let NoteUpdate = await UpdateOrdesDetails(
        { order_id: request?.id },
        { driver_note: request?.message }
      );
      if (NoteUpdate) {
        return res.json({ status: 200, message: "successfully updated" });
      }
    }
    return res.json({ status: 400, message: "Record not found" });
  } catch (error) {
    console.error(`Failed to update: ${error.message}`);
    return res.send({ status: 500, message: "Failed to update" });
  }
}

export async function AdminNotes(req, res) {
  try {
    let request = req.body;
    let adminname = Verifyuser?.name;
    let Orders = await getOrdersById({ order_id: request?.id });
    if (Orders) {
      let existingAdminNotes = Orders?.adminnote?.length
        ? Orders?.adminnote
        : [];

      let newAdminNote = [
        {
          message: request?.message,
          date_time: getCurrentDateTime(),
          admin: adminname,
        },
      ];
      existingAdminNotes = existingAdminNotes.concat(newAdminNote);
      let NoteUpdate = await UpdateOrdesDetails(
        { order_id: request?.id },
        { adminnote: existingAdminNotes }
      );
      if (NoteUpdate) {
        return res.json({ status: 200, message: "successfully updated" });
      } else {
        return res.json({ status: 400, message: "failed to update note" });
      }
    } else {
      return res.json({ status: 400, message: "Orders not found" });
    }
  } catch (error) {
    console.error(`Failed to update: ${error.message}`);
    return res.send({ status: 500, message: "Failed to update" });
  }
}

export async function GetNotes(req, res) {
  try {
    let request = req.body;
    let Orders = await getOrdersById({ order_id: request?.id });
    if (Orders) {
      let adminNotes = Orders?.adminnote || [];
      return res.json({ status: 200, data: adminNotes });
    } else {
      return res.json({ status: 200, data: [] });
    }
  } catch (error) {
    console.error(`Failed to get notes: ${error.message}`);
    return res.send({ status: 500, message: "Failed to get notes" });
  }
}

export const Invoice_TransactionId = async (req, res) => {
  try {
    let request = req.body;
    let orders = await getOrdersById({ order_id: request?.id });

    if (!orders) {
      return res.send({ status: 404, message: "Order not found" });
    }

    if (orders.base_amount === 0) {
      return res.send({ status: 400, message: "Base amount is 0, cannot generate invoice" });
    }

    if (request?.transcation_id == "") {
      let result = await OrdersInvoice({
        body: { id: orders?.order_id, callType: "InLine" },
      });
      // Send email with the generated PDF as an attachment using SendGrid
      let userMail = Verifyuser.email;
      let username = `${orders.first_name} ${orders.last_name}`;
      // Check if result has a file property
      if (!result || !result.file) {
        return res.send({ status: 500, message: "Failed to generate Invoice - file not available" });
      }
      let pdfFullPath = path.join(__dirname, "public", result.file);

      let pdfContent = fs.readFileSync(pdfFullPath, "base64");
      let msg = {
        to: userMail,
        from: "ThriveBlack Car <admin@thriveblackcar.com>",
        subject: "Invoice PDF is Ready!!",
        html: `<p>Hello, ${username}! Your invoice is ready to download and view</p>`,
        attachments: [
          {
            filename: "Invoice.pdf",
            content: pdfContent,
            encoding: "base64",
          },
        ],
      };
      await Get_API_KEY();
      sgMail.setApiKey(global.SendGridApiKey);
      await sgMail.send(msg);

      return res.send({ status: 200, message: "Invoice generated successfully and sent via mail", Invoice: result?.file });
    }

    let updateTransaction = await UpdateOrdesDetails(
      { order_id: request.id },
      { transcation_id: request?.transcation_id, "Status.isActive": 1 }
    );

    if (!updateTransaction) {
      return res.send({ status: 500, message: "Failed to update transaction details" });
    }

    let result = await OrdersInvoice({
      body: { id: orders?.order_id, callType: "InLine" },
    });
    // Send email with the generated PDF as an attachment using SendGrid
    let userMail = Verifyuser.email;
    let username = `${orders.first_name} ${orders.last_name}`;
    let pdfFullPath = path.join(__dirname, "public", result.file);

    let pdfContent = fs.readFileSync(pdfFullPath, "base64");
    let msg = {
      to: userMail,
      from: "ThriveBlack Car <admin@thriveblackcar.com>",
      subject: "Invoice PDF is Ready!!",
      html: `<p>Hello, ${username}! Your invoice is ready to download and view</p>`,
      attachments: [
        {
          filename: "Invoice.pdf",
          content: pdfContent,
          encoding: "base64",
        },
      ],
    };

    await Get_API_KEY();
    sgMail.setApiKey(global.SendGridApiKey);

    await sgMail.send(msg);

    return res.send({
      status: 200,
      message: "Invoice generated successfully and sent via mail",
      Invoice: result?.file,
    });
  } catch (error) {
    console.error(`Failed to generate Invoice: ${error.message}`);
    return res.send({ status: 500, message: "Failed to generate Invoice" });
  }
};



export const Refund = async (req, res) => {
  try {
    let request = req.body;
    let OrdersData = await getOrdersById({ order_id: request?.id });

    if (OrdersData) {
      // Exclude order_id from refundData to ensure it is not saved in the database
      let { order_id, ...refundData } = {
        refund: request?.refund,
        refund_comment: request?.refund_comment,
        refund_date: moment().format('YYYY-MM-DD'),
      };

      // Update the matched data with the refund-related fields using UpdateOrdesDetails
      let refundUpdate = await UpdateOrdesDetails({ order_id: request?.id }, refundData);

      if (refundUpdate) {
        return res.json({ status: 200, message: "Successfully Added" });
      } else {
        return res.json({ status: 400, message: "Failed to add refund data" });
      }
    } else {
      return res.json({ status: 400, message: "Record not found" });
    }
  } catch (error) {
    console.error(`Failed to add refund: ${error.message}`);
    return res.json({ status: 500, message: "Failed to add refund" });
  }
};


export const RefundById = async (req, res) => {
  try {
    let request = req.body;
    let projection = { refund: 1, refund_comment: 1, _id: 0 };
    let OrdersData = await getOrdersById({ order_id: request?.id }, projection);

    if (OrdersData) {
      return res.json({ status: 200, data: OrdersData });
    } else {
      return res.json({ status: 400, message: "Record not found" });
    }
  } catch (error) {
    console.log(`Failed to get refund details: ${error.message}`);
    return res.json({ status: 500, message: "Failed to get refund details" });
  }
};


export const AddCallStatus = async (req, res) => {
  try {
    let request = req.body;
    let OrdersData = await getOrdersById({ order_id: request?.id });

    if (OrdersData) {
      let updatefields = {
        callstatus: request?.callstatus,
        callmessage: request?.callmessage
      }
      let AddcallStatus = await UpdateOrdesDetails({ order_id: request?.id }, updatefields)
      if (AddcallStatus) {
        return res.json({ status: 200, message: "Successfully added" });
      }
      else {
        return res.json({ status: 400, message: "Faield to update" });
      }
    } else {
      return res.json({ status: 400, message: "Record not found" });
    }
  } catch (error) {
    console.log(`Failed to add call status: ${error.message}`);
    return res.json({ status: 500, message: "Failed to add call status" });
  }
};

export const GetCallStatus = async (req, res) => {
  try {
    let request = req.body;
    let projection = { callmessage: 1, callstatus: 1 }
    let OrdersData = await getOrdersById({ order_id: request?.id }, projection);

    if (OrdersData) {
      delete OrdersData?._id;
      return res.json({ status: 200, data: OrdersData });
    } else {
      return res.json({ status: 400, message: "Record not found" });
    }
  } catch (error) {
    console.log(`Failed to get call status: ${error.message}`);
    return res.json({ status: 500, message: "Failed to get call status" });
  }
};







