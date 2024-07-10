import { CreateAndUpdate } from "../Model/AdminModel.js";
import { getUserById } from "../Model/AdminModel.js";
import { getAllUserDetails } from "../Model/AdminModel.js";
import { UpdateUserDetails } from "../Model/AdminModel.js";
import { deleteUserById } from "../Model/AdminModel.js";
import { getRoleById } from "../Model/RoleModel.js";
import { NotificationCreateAndUpdate } from "../Model/NotificationModel.js";
import { getOrdersById } from "../Model/OrdersModel.js";
import { UpdateOrdesDetails, getBookingCountByDriverId, getAllOrdersDetails } from "../Model/OrdersModel.js";
import { getAllPriceDetails, getPriceById } from "../Model/PriceModel.js";
import { Get_API_KEY } from "../helper/GetApiKey.js";
import { forEachAsync } from "foreachasync";
import crypto from "crypto";
import twilio from 'twilio';
import jwt from "jsonwebtoken";
import sgMail from "@sendgrid/mail";

/* global Verifyuser */

export const AdminsCreateAndUpdate = async (req, res) => {
  try {
    let request = req.body;
    let UserMail = await getUserById({ email: request?.email });

    if (UserMail) {
      res.json({ status: 400, message: "Email Already Exists" });
    } else {
      let salt = crypto.randomBytes(16).toString("hex");
      let hashedPassword = crypto
        .pbkdf2Sync(req.body.password, salt, 10000, 64, "sha512")
        .toString("hex");
      let token = jwt.sign(request?.name, process.env.JWT_SECRET);
      let splitString = token.split(".", 3);
      let creatorname = req.VerifyAuth;
      request.password = hashedPassword;
      request.salt = salt;
      request.token = splitString[2];
      let settings = await CreateAndUpdate(request);

      if (settings) {
        let roleName = "";

        // Determine roleName based on the presence of request.role_id
        if (request.role_id) {
          let role = await getRoleById({ _id: request.role_id });
          if (role) {
            roleName = role.rolename;
          }
        }

        // Send the email with the appropriate template
        let message = {
          to: `${request?.email}`,
          from: "ThriveBlack Car <admin@thriveblackcar.com>",
          subject: "Welcome to ThriveBlack Car CRM",
          html: request?.role_id
            ? `Welcome to ThriveBlack Car,</br>
              <p> ${creatorname} has added you as a role of ${roleName} in ThriveBlack Car CRM
              your details are in below-</p> </br>.
              <p>Name: ${request?.name}</p></br>
              <p>Email: ${request?.email}</p></br>
              <p>Phone No.: ${request?.phone}</p></br>
              <p>Address: ${request?.address}</p></br>
              <p>Password: ${request?.password}</p></br>
              <p>you can login with this email id and password and here the link : 
              <a href="${process.env.FRONTEND_URL}"> Click for reset Password</a></p></br>
              Best regards,</br>
              The ThriveBlackCar Team`
            : `Welcome to ThriveBlack Car,</br>
              <p> ${creatorname} has added you as a Driver in ThriveBlack Car CRM
              your details are in below-</p> </br>.
              <p>Name: ${request?.name}</p></br>
              <p>Email: ${request?.email}</p></br>
              <p>Phone No.: ${request?.phone}</p></br>
              <p>Address: ${request?.address}</p></br>
              <p>Password: ${request?.password}</p></br>
              <p>you can login with this email id and password and here the link : 
              <a href="${process.env.FRONTEND_URL}"> Click for reset Password</a></p></br>
              Best regards,</br>
              The ThriveBlackCar Team`,
        };
        await Get_API_KEY();
        sgMail.setApiKey(global.SendGridApiKey);

        await sgMail.send(message);
        res.json({ status: 200, message: "successfully added" });
      } else {
        res.json({ status: 200, token: splitString[2] });
      }
    }
  } catch (error) {
    console.error(`Failed to Insert Data: ${error.message}`);
    res.json({ status: 500, message: error.message });
  }
};

export const GetAdmins = async (req, res) => {
  try {
    let request = req.body;
    let filter = {};
    if (request?.search) {
      filter.$or = [
        { email: { $regex: new RegExp(request?.search, 'i') } },
        { name: { $regex: new RegExp(request?.search, 'i') } },
      ];
    }
    if (request?.status) {
      filter.status = parseInt(request?.status);
    }
    if (request?.role_id) {
      filter.role_id = request?.role_id;
    }
    if (request?.user_type) {
      filter.user_type = parseInt(request?.user_type);
    }
    let creatorname = req.VerifyAuth;
    let projection = {
      name: 1,
      email: 1,
      phone: 1,
      status: 1,
      role_id: 1,
      createdAt: 1,
      updatedAt: 1,
      user_type: 1,
      vehicle_model: 1,
      vehicle_number: 1
    };
    let options = { sort: { createdAt: -1 } };

    let admins = (await getAllUserDetails(filter, projection, options)) || [];

    let priceData = await getAllPriceDetails();
    let vehicleModels = priceData?.find(data => data.vehicle_model)?.vehicle_model || [];


    await forEachAsync(admins, async (admin) => {
      admin.CreatedBy = creatorname;
      if (admin?.user_type == 2) {
        let bookingCount = await getBookingCountByDriverId(
          admin?._id?.toString()
        );
        admin.noOfBooking = bookingCount ? bookingCount : 0;
      }
      admin.id = admin?._id;

      let vehicleModel = vehicleModels.find(model => model.id === admin?.vehicle_model);
      admin.vehicle_model = vehicleModel ? vehicleModel.name : '';
      delete admin._id;
      return admin;
    });
    return res.json({ status: 200, data: admins });
  } catch (error) {
    console.error(`Failed to search admins: ${error.message}`);
    return res.json({ status: 500, message: "Failed to search admins" });
  }
};

export const GetAdminById = async (req, res) => {
  try {
    let request = req.body;
    let creatorname = req.VerifyAuth;
    let Admin = await getUserById({ _id: request?.id });

    if (Admin) {
      let Vehicle_Data = await getAllPriceDetails();
      let filteredAdmin = {};

      filteredAdmin.id = Admin?.id;
      filteredAdmin.name = Admin?.name;
      filteredAdmin.email = Admin?.email;
      filteredAdmin.phone = Admin?.phone;
      filteredAdmin.address = Admin?.address;
      filteredAdmin.CreatedBy = creatorname;
      filteredAdmin.vehicle_number = Admin?.vehicle_number ? Admin?.vehicle_number : "";

      if (Admin?.role_id) {
        let role = await getRoleById({ _id: Admin?.role_id });
        if (role) {
          filteredAdmin.role_select = { value: role?._id, label: role?.rolename };
        }
      }
      if (Admin?.status === 1) {
        filteredAdmin.status_select = { value: 1, label: "Active" };
      } else {
        filteredAdmin.status_select = { value: 2, label: "Suspend" };
      }

      let vehicleDataWithModel = Vehicle_Data.find(data => data?.vehicle_model);
      if (vehicleDataWithModel) {
        let vehicleModel = vehicleDataWithModel?.vehicle_model.find(model => model?.id === Admin?.vehicle_model);
        if (vehicleModel) {
          filteredAdmin.vehicle_model_select = {
            value: vehicleModel?.id,
            label: vehicleModel?.name
          };
        }
        else {
          filteredAdmin.vehicle_model_select = {
            value: "",
            label: ""
          };
        }
      }
      delete filteredAdmin.createdAt;
      delete filteredAdmin.updatedAt;

      return res.json({ status: 200, data: filteredAdmin });
    } else {
      return res.json({ status: 400, message: "Record not found" });
    }
  } catch (error) {
    console.error(`Failed to find record: ${error.message}`);
    return res.send({ status: 500, message: "Failed to find record" });
  }
};

// Function to check if the email already exists in the database for users other than the one with the specified ID
const checkEmailExists = async (id, email) => {
  try {
    const existingUser = await getUserById({ _id: { $ne: id }, email: email });
    return !!existingUser; // Return true if a user with the email already exists 
  } catch (error) {
    console.error(`Failed to check email existence: ${error.message}`);
    return false;
  }
};

export const UpdateAdmin = async (req, res) => {
  try {
    let request = req.body;
    let admin = await getUserById({ _id: request?.id });

    if (admin) {
      let emailExists = await checkEmailExists(request?.id, request?.email);

      if (emailExists) {
        return res.json({ status: 400, message: "Email already exists" });
      }

      // Check if the requested email is different from the existing email for the user with the matching ID
      if (request?.email !== admin?.email) {
        let updateAdmin = await UpdateUserDetails(
          { _id: request?.id },
          request
        );

        if (updateAdmin) {
          let notificationResult = await NotificationCreateAndUpdate({
            message: `${Verifyuser?.name} has updated your details`,
            CreatedBy: Verifyuser?.name,
            ReceiverId: admin?._id,
            navigate: "staff",
          });

          if (notificationResult) {
            return res.json({ status: 200, message: "Successfully updated" });
          }
        } else {
          return res.json({ status: 500, message: "Failed to update admin details" });
        }
      }

      // If the email is the same, proceed with the update without a specific message
      let updateAdmin = await UpdateUserDetails(
        { _id: request?.id },
        request
      );

      if (updateAdmin) {
        let notificationResult = await NotificationCreateAndUpdate({
          message: `${Verifyuser?.name} has updated your details`,
          CreatedBy: Verifyuser?.name,
          ReceiverId: admin?._id,
          navigate: "staff",
        });

        if (notificationResult) {
          return res.json({ status: 200, message: "Successfully updated" });
        }
      } else {
        return res.json({ status: 500, message: "Failed to update admin details" });
      }
    } else {
      return res.json({ status: 400, message: "Record not found" });
    }
  } catch (error) {
    console.error(`Failed to update: ${error.message}`);
    return res.json({ status: 500, message: "Failed to update" });
  }
};

export const DeleteAdmin = async (req, res) => {
  try {
    let request = req.body;
    let Admin = await getUserById({ _id: request.id });

    if (Admin) {
      let result = await deleteUserById({ _id: request?.id });
      if (result) {
        return res.json({ status: 200, message: "successfully deleted" });
      } else {
        return res.json({ status: 500, message: "Failed to delete" });
      }
    } else {
      return res.json({ status: 400, message: "Record not found" });
    }
  } catch (error) {
    console.error(`Failed to delete: ${error.message}`);
    return res.json({ status: 500, message: "Failed to delete" });
  }
};

export const UpdateAdminStatus = async (req, res) => {
  try {
    let request = req.body;
    let Admin = await getUserById({ _id: request.id });

    if (Admin) {
      let updatedRole = await UpdateUserDetails(
        { _id: request?.id },
        { status: request.status }
      );

      if (updatedRole) {
        let notificationMessage = "";

        if (request.status === 2 || request.status === "2") {
          notificationMessage = `${Admin.name} has been suspended`;
        } else if (request.status === 1 || request.status === "1") {
          notificationMessage = `${Admin.name} has been activated`;
        }
        let notificationResult = await NotificationCreateAndUpdate({
          message: notificationMessage,
          CreatedBy: Verifyuser.name,
          ReceiverId: Admin._id,
          navigate: "staff"
        });

        if (notificationResult) {
          return res.json({ status: 200, message: "Successfully updated" });
        }
      } else {
        return res.json({ status: 500, message: "Failed to update status" });
      }
    } else {
      return res.json({ status: 400, message: "Record not found" });
    }
  } catch (error) {
    console.error(`Failed to update: ${error.message}`);
    return res.json({ status: 500, message: "Failed to update" });
  }
};


export const AssignDriver = async (req, res) => {
  try {
    let request = req.body;

    let order = await getOrdersById({ order_id: request?.order_id });

    if (order) {
      let currentdate = new Date();
      let updateFields = {
        driver_id: request?.driverid,
        driver_assign_date: currentdate,
        currentlocation: ""
      };
      if (request?.assignamount !== undefined) {
        updateFields.assignamount = request?.assignamount;
      }
      if (request?.assigncomment !== undefined) {
        updateFields.assigncomment = request?.assigncomment;
      }
      if (request?.vehicle_model !== undefined) {
        updateFields.vehicle_model = request?.vehicle_model;
      }
      let result = await UpdateOrdesDetails(
        { order_id: request?.order_id },
        updateFields
      );
      // let result = await UpdateOrdesDetails(
      //   { order_id: request?.order_id },
      //   { driver_id: request?.driver_id },
      //   { driver_booking_amount: request?.driver_booking_amount }
      // );

      if (result) {
        SendDriverBookingSms(order?.driver_id, order?.from_location_name, order?.to_location_name);

        let notificationResult = await NotificationCreateAndUpdate({
          message: `New driver is assigned from ${order?.from_location_name} to ${order?.to_location_name}`,
          driver_id: order?.driver_id,
          navigate: "booking",
        });

        if (notificationResult) {
          return res.json({ status: 200, message: "Successfully updated" });
        } else {
          return res.json({ status: 500, message: "Failed to update" });
        }
      } else {
        return res.json({ status: 500, message: "Failed to update" });
      }
    } else {
      return res.json({ status: 400, message: "Order not found" });
    }
  } catch (error) {
    console.error(`Failed to update: ${error.message}`);
    return res.json({ status: 500, message: "Failed to update" });
  }
};

const SendDriverBookingSms = async (driverId, FromLocation, ToLocation) => {
  let DriverDetails = await getUserById({ _id: driverId })
  try {
    let message = `Dear ${DriverDetails?.name},\n\n`
      + `New Booking is assigned from ${FromLocation} to ${ToLocation}\n`
      + `Best regards,\n`
      + `Team Thrive Black Car`;

    await Get_API_KEY();
    const accountSid = global.TwilioAccountSid;
    const authToken = global.TwilioAuthToken;
    const client = twilio(accountSid, authToken);

    // Send the SMS message
    await client.messages.create({
      body: message,
      to: DriverDetails?.phone,
      from: '+13082086929'
    });

    console.log('SMS sent successfully');
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
}

export const GetDriver = async (req, res) => {
  try {
    let Drivers = await getAllUserDetails({ status: 1, user_type: 2 });

    if (Drivers && Drivers.length > 0) {
      let AllDrivers = Drivers.map((Driver) => ({
        id: Driver?._id,
        name: Driver?.name,
      }));
      for (let driver of AllDrivers) {
        let ordersCount = await getBookingCountByDriverId(driver?.id.toString());
        driver.orderCount = ordersCount;
      }
      return res.json({ status: 200, data: AllDrivers });
    } else {
      return res.json({ status: 400, message: "No Drivers found" });
    }
  } catch (error) {
    console.error(`Failed to retrieve Drivers: ${error.message}`);
    return res.json({ status: 500, message: "Failed to retrieve Drivers" });
  }
};

export const AdminByOrder = async (req, res) => {
  try {
    let request = req.body;
    let Admin = await getUserById({ _id: request?.id });
    if (Admin) {
      return res.json({ status: 200, message: "Admin exist" });
    } else {
      return res.json({ status: 400, message: "Admin does not exist" });
    }
  } catch (error) {
    console.error(`Failed to get admin: ${error.message}`);
    return res.json({ status: 500, message: "Failed to get admin" });
  }
};

export const GetDriverbyModel = async (req, res) => {
  try {
    let request = req.body;
    let filter = { vehicle_model: request?.model_id, user_type: 2, status: 1 }
    let projection = { _id: 1, name: 1 }
    let Drivers = await getAllUserDetails(filter, projection);
    if (Drivers) {
      return res.json({ status: 200, data: Drivers });
    }
    else {
      return res.json({ status: 400, data: [] });
    }
  } catch (error) {
    console.error(`Failed to retrieve Drivers: ${error.message}`);
    return res.json({ status: 500, message: "Failed to retrieve Drivers" });
  }
};

export const GetDriverExpenses = async (req, res) => {
  try {
    let request = req.body;
    let allDrivers = await getAllUserDetails({ user_type: 2 });

    if (allDrivers) {
      let uniqueDriversMap = new Map();

      await Promise.all(allDrivers.map(driver => {
        if (!uniqueDriversMap.has(driver?.email)) {
          uniqueDriversMap.set(driver?.email, {
            id: driver?._id.toString(),
            name: driver?.name,
            email: driver?.email,
            totalNoBooking: 0,
            totalBookingamount: 0,
          });
        }
      }));

      let uniqueDrivers = Array.from(uniqueDriversMap.values());

      for (let driver of uniqueDrivers) {
        let DriversOrders = await getAllOrdersDetails({ driver_id: driver?.id });

        let totalBookings = DriversOrders?.length;
        driver.totalNoBooking = totalBookings;

        let totalAmount = DriversOrders.reduce((acc, order) => acc + parseFloat(order?.assignamount || 0), 0);
        driver.totalBookingamount = totalAmount;
      }

      let totalAmount = uniqueDrivers.reduce((acc, driver) => acc + driver?.totalBookingamount, 0);

      if (request?.search) {
        uniqueDrivers = uniqueDrivers.filter(driver =>
          driver.name.match(new RegExp(request?.search, 'i')) ||
          driver.email.match(new RegExp(request?.search, 'i'))
        );
      }
      return res.json({ status: 200, data: uniqueDrivers, totalAmount: totalAmount });
    }
    else {
      return res.json({ status: 200, data: [], totalAmount: 0 });
    }

  } catch (error) {
    console.log(`Failed to retrieve Drivers: ${error}`);
    return res.json({ status: 500, message: "Failed to retrieve Drivers" });
  }
};


export const GetVehiclebyModel = async (req, res) => {
  try {
    let filter = { _id: "667a7744b57df78d3abcd90d" };
    let VehicleData = await getAllPriceDetails(filter);

    if (VehicleData && VehicleData?.length > 0) {
      let vehicleModelData = VehicleData[0]?.vehicle_model.map(model => ({
        id: model?.id,
        name: model?.name
      }));

      return res.json({ status: 200, data: vehicleModelData });
    } else {
      return res.json({ status: 400, data: [] });
    }
  } catch (error) {
    console.error(`Failed to retrieve VehicleData: ${error.message}`);
    return res.json({ status: 500, message: "Failed to retrieve VehicleData" });
  }
};


