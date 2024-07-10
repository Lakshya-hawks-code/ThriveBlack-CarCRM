import express from "express";
const router = express.Router();
import mobileRoutes from "../routes/mobileRoutes.js"
import { userAuth } from "../middleware/VerifyAuth.js";

import { Login } from "../Controller/Login.js";
import { OtpVerification } from "../Controller/Login.js";

import { AdminsForgotPassword } from "../Controller/ForgotPassword.js";
import { VerifyForgotToken } from "../Controller/ForgotPassword.js";
import { AdminsPasswordUpdate } from "../Controller/ForgotPassword.js";
import { UpdatePassword } from "../Controller/ForgotPassword.js";

import { AdminsCreateAndUpdate } from "../Controller/Admins.js";
import { GetAdmins } from "../Controller/Admins.js";
import { GetAdminById } from "../Controller/Admins.js";
import { UpdateAdmin } from "../Controller/Admins.js";
import { DeleteAdmin } from "../Controller/Admins.js";
import { UpdateAdminStatus } from "../Controller/Admins.js";
import { AdminByOrder } from "../Controller/Admins.js";
import { AssignDriver } from "../Controller/Admins.js";
import { GetDriverExpenses } from "../Controller/Admins.js";
import { GetDriver } from "../Controller/Admins.js";
import { GetDriverbyModel } from "../Controller/Admins.js";
import { GetVehiclebyModel } from "../Controller/Admins.js";

import { Showprofile } from "../Controller/Profile.js";
import { Updateprofile } from "../Controller/Profile.js";

import { OrderCreateAndUpdate } from "../Controller/Orders.js";
import { GetOrders } from "../Controller/Orders.js";
import { GenerateInvoice } from "../Controller/Orders.js";
import { DeleteOrders } from "../Controller/Orders.js";
import { GetOrderById } from "../Controller/Orders.js";
import { UpdateOrders } from "../Controller/Orders.js";
import { AdminNotes } from "../Controller/Orders.js";
import { GetNotes } from "../Controller/Orders.js";
import { BookingStatus } from "../Controller/Orders.js";
import { BookingComment } from "../Controller/Orders.js";
import { GetOrdersByTransaction } from "../Controller/Orders.js";
import { Invoice_TransactionId } from "../Controller/Orders.js";

import { OrdersInvoice } from "../Controller/Invoice.js";
import { ZeroInvoice } from "../Controller/Invoice.js";

import { RolesCreateAndUpdate } from "../Controller/Roles.js";
import { ManageRole } from "../Controller/Roles.js";
import { SearchRoles } from "../Controller/Roles.js";
import { GetRoles } from "../Controller/Roles.js";
import { UpdateRoles } from "../Controller/Roles.js";
import { DeleteRoles } from "../Controller/Roles.js";
import { UpdateStatus } from "../Controller/Roles.js";
import { GetRolesData } from "../Controller/Roles.js";
import { GetActiveRoles } from "../Controller/Roles.js";

import { GetCustomers } from "../Controller/Customers.js";
import { GetOrdersByCustomers } from "../Controller/Customers.js";
import { ExportCsv } from "../Controller/Customers.js";
import { ExportPdf } from "../Controller/Customers.js";

import { Dashboard } from "../Controller/Dashboard.js";
import { GetOrdersByMonth } from "../Controller/Dashboard.js";
import { AnalyticsGraph } from "../Controller/Dashboard.js";
import { GetBooking } from "../Controller/Dashboard.js";

import { PayMail } from "../Controller/Mail.js";
import { SendMail } from "../Controller/Mail.js";

import { SendMessage } from "../Controller/Sms.js";
import { SendOrdersMail } from "../Controller/SendOrdersMail.js";

import { Notification } from "../Controller/Notification.js";

import { Finance } from "../Controller/Finance.js";
import { FinanceCsv } from "../Controller/Finance.js";
import { FinancePdf } from "../Controller/Finance.js";

import { GetApiKey } from "../Controller/Credentials.js";
import { UpdateApiKey } from "../Controller/Credentials.js";

import { AddExpenseType } from "../Controller/Expense.js";
import { GetExpenseType } from "../Controller/Expense.js";
import { GetExpenseTypeById } from "../Controller/Expense.js";
import { UpdateExpenseType } from "../Controller/Expense.js";
import { DeleteExpenseType } from "../Controller/Expense.js";
import { AddExpenses } from "../Controller/Expense.js";
import { GetExpenses } from "../Controller/Expense.js";
import { GetExpenseById } from "../Controller/Expense.js";
import { UpdateExpenses } from "../Controller/Expense.js";
import { DeleteExpenses } from "../Controller/Expense.js";
import { ProfitLoss } from "../Controller/Expense.js";
import { ExportProfitLossPdf } from "../Controller/Expense.js";

import { Refund } from "../Controller/Orders.js";
import { RefundById } from "../Controller/Orders.js";

import { AddPrice } from "../Controller/Price.js";
import { GetPrice } from "../Controller/Price.js";
import { GetPriceListById } from "../Controller/Price.js";
import { UpdatePriceList } from "../Controller/Price.js";
import { GetAllPrices } from "../Controller/Price.js";

import { AddCallStatus } from "../Controller/Orders.js";
import { GetCallStatus } from "../Controller/Orders.js";

import { ExportDB } from "../Controller/Sms.js";



router.route("/login").post(Login);
router.route("/otp").post(OtpVerification);
router.route("/forgotpassword").post(AdminsForgotPassword);
router.route("/verifytoken").post(VerifyForgotToken);
router.route("/changepassword").post(AdminsPasswordUpdate);

router.route("/profile").post(userAuth, Showprofile);
router.route("/updateprofile").post(userAuth, Updateprofile);
router.route("/updatepassword").post(userAuth, UpdatePassword);

router.route("/role").post(userAuth, RolesCreateAndUpdate);
router.route("/managerole").post(userAuth, ManageRole);
router.route("/getroles").post(userAuth, SearchRoles);
router.route("/getrolesbyid").post(userAuth, GetRoles);
router.route("/updateroles").post(userAuth, UpdateRoles);
router.route("/deleteroles").post(userAuth, DeleteRoles);
router.route("/updatedrolestatus").post(userAuth, UpdateStatus);
router.route("/getroledata").post(userAuth, GetRolesData);
router.route("/getactive_roles").post(userAuth, GetActiveRoles);

router.route("/admin").post(userAuth, AdminsCreateAndUpdate);
router.route("/getadmins").post(userAuth, GetAdmins);
router.route("/getadminbyid").post(userAuth, GetAdminById);
router.route("/updateadmin").post(userAuth, UpdateAdmin);
router.route("/deleteadmin").post(userAuth, DeleteAdmin);
router.route("/updateadminstatus").post(userAuth, UpdateAdminStatus);
router.route("/getadmin_byorder").post(AdminByOrder);

router.route("/orders").post(OrderCreateAndUpdate);
router.route("/getorders").post(userAuth, GetOrders);
router.route("/getorderbyid").post(userAuth, GetOrderById);
router.route("/exportorders").post(userAuth, GenerateInvoice);
router.route("/deleteorders").post(userAuth, DeleteOrders);
router.route("/updateorders").post(UpdateOrders);
router.route("/ordersinvoice").post(userAuth, OrdersInvoice);
router.route("/getordersby_transaction").post(GetOrdersByTransaction);
router.route("/paymail").post(PayMail);
router.route("/sendmessage").post(userAuth, SendMessage);
router.route("/getordersbymonth").post(userAuth, GetOrdersByMonth);
router.route("/zeroinvoice").post(userAuth, ZeroInvoice);
router.route("/orderanalytic").post(userAuth, AnalyticsGraph);
router.route("/getordersby_customers").post(userAuth, GetOrdersByCustomers);

router.route("/sendmail").post(userAuth, SendMail);

router.route("/getcustomers").post(userAuth, GetCustomers);
router.route("/exportcsv").post(userAuth, ExportCsv);
router.route("/exportpdf").post(userAuth, ExportPdf);

router.route("/dashboard").post(userAuth, Dashboard);
router.route("/notification").post(userAuth, Notification);
router.route("/genrate_invoice_transcationid").post(userAuth, Invoice_TransactionId);

router.route("/assign_driver").post(userAuth, AssignDriver);
router.route("/getdriver").post(userAuth, GetDriver);
router.route("/getdriverbymodel").post(userAuth, GetDriverbyModel);
router.route("/getvehiclemodel").post(userAuth, GetVehiclebyModel);
router.route("/getdriver_expenses").post(userAuth, GetDriverExpenses);

router.route("/getbooking").post(userAuth, GetBooking);
router.route("/booking_status").post(userAuth, BookingStatus);
router.route("/booking_comment").post(userAuth, BookingComment);

router.route("/reminder_notes").post(userAuth, AdminNotes);
router.route("/getnotes").post(userAuth, GetNotes);

router.route("/finance").post(userAuth, Finance);
router.route("/export_finance_csv").post(userAuth, FinanceCsv);
router.route("/export_finance_pdf").post(userAuth, FinancePdf);

router.route("/get_api_key").post(userAuth, GetApiKey);
router.route("/update_api_key").post(userAuth, UpdateApiKey);

router.route("/add_expense_type").post(userAuth, AddExpenseType);
router.route("/get_expense_type").post(userAuth, GetExpenseType);
router.route("/get_expense_typebyid").post(userAuth, GetExpenseTypeById);
router.route("/update_expense_type").post(userAuth, UpdateExpenseType);
router.route("/delete_expense_type").post(userAuth, DeleteExpenseType);
router.route("/add_expenses").post(userAuth, AddExpenses);
router.route("/get_expenses").post(userAuth, GetExpenses);
router.route("/get_expenses_byid").post(userAuth, GetExpenseById);
router.route("/update_expenses").post(userAuth, UpdateExpenses);
router.route("/delete_expenses").post(userAuth, DeleteExpenses);

router.route("/refund").post(userAuth, Refund);
router.route("/refundbyid").post(userAuth, RefundById);
router.route("/profit_loss").post(userAuth, ProfitLoss);
router.route("/refund_pdf").post(userAuth, ExportProfitLossPdf);

router.route("/add_price").post(userAuth, AddPrice);
router.route("/get_price").post(userAuth, GetPrice);
router.route("/get_pricelistbyid").post(userAuth, GetPriceListById);
router.route("/update_pricelist").post(userAuth, UpdatePriceList);
router.route("/get_allprices").post(GetAllPrices);

router.route("/addcallstatus").post(userAuth, AddCallStatus);
router.route("/getcallstatus").post(userAuth, GetCallStatus);


router.route("/exportDb").post(userAuth, ExportDB);

router.route("/cronjob/sendordersmail").get(SendOrdersMail);


router.use("/mobile", mobileRoutes);


export default router;
