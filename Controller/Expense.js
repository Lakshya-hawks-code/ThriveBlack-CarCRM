import { ExpenseCreateAndUpdate } from "../Model/Expense_typeModel.js";
import { getExpenseTypeById } from "../Model/Expense_typeModel.js";
import { UpdateExpenseTypeDetails } from "../Model/Expense_typeModel.js";
import { getAllExpenseTypeDetails } from "../Model/Expense_typeModel.js";
import { deleteExpenseTypeById } from "../Model/Expense_typeModel.js";
import { ExpensesCreateAndUpdate } from "../Model/ExpenseModel.js";
import { getAllExpensesDetails } from "../Model/ExpenseModel.js";
import { getExpensesById } from "../Model/ExpenseModel.js";
import { UpdateExpensesDetails } from "../Model/ExpenseModel.js";
import { deleteExpensesById } from "../Model/ExpenseModel.js";
import { getExpensesWithExpenseTypes, getExpenseByIdWithExpenseType } from "../Model/ExpenseModel.js";
import { getAllOrdersDetails } from "../Model/OrdersModel.js";
import { Get_API_KEY } from "../helper/GetApiKey.js";
import { forEachAsync } from "foreachasync";
import moment from 'moment';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import handlebars from "handlebars";
import sgMail from "@sendgrid/mail";

/* global Verifyuser */

const __dirname = path.resolve();


export const AddExpenseType = async (req, res) => {
  try {
    let request = req.body;
    let ExpenseInsert = await ExpenseCreateAndUpdate(request);
    if (ExpenseInsert) {
      res.json({ status: 200, message: "Successfully Added" });
    } else {
      res.json({ status: 400, message: "failed to insert" })
    }
  } catch (error) {
    console.error(`Failed to insert Data: ${error.message}`);
    res.json({ status: 500, message: error.message });
  }
};


export const GetExpenseType = async (req, res) => {
  try {
    let request = req.body;
    let creatorname = Verifyuser.name;
    let status = parseInt(request.status);

    let filter = {};

    if (status === 1 || status === 2) {
      filter.status = status;
    }

    if (request?.search) {
      filter.expense_type = { $regex: new RegExp(request.search, 'i') };
    }

    let ExpenseTypeData = await getAllExpenseTypeDetails(filter);
    // Modify the response to add the addedBy field using forEachAsync
    await forEachAsync(ExpenseTypeData, async (expenseType) => {
      expenseType.addedBy = creatorname;
    });

    ExpenseTypeData.sort((a, b) => b.createdAt - a.createdAt);

    if (ExpenseTypeData) {
      res.json({ status: 200, data: ExpenseTypeData });
    } else {
      res.json({ status: 200, data: [] });
    }
  } catch (error) {
    console.error(`Failed to get ExpenseType Data: ${error.message}`);
    res.json({ status: 500, message: error.message });
  }
};



export const GetExpenseTypeById = async (req, res) => {
  try {
    let request = req.body;

    let ExpenseTypeData = await getExpenseTypeById({ _id: request?.id });

    if (ExpenseTypeData) {
      let filteredExpenseType = {};

      filteredExpenseType.id = ExpenseTypeData.id;
      filteredExpenseType.expense_type = ExpenseTypeData.expense_type;
      filteredExpenseType.createdAt = ExpenseTypeData.createdAt;
      filteredExpenseType.updatedAt = ExpenseTypeData.updatedAt;

      if (ExpenseTypeData.status === 1) {
        filteredExpenseType.status_select = { value: 1, label: "Active" };
      } else {
        filteredExpenseType.status_select = { value: 2, label: "Suspend" };
      }
      return res.json({ status: 200, data: filteredExpenseType });
    } else {
      return res.json({ status: 400, message: "Failed to get data" });
    }
  } catch (error) {
    console.error(`Failed to get ExpenseType Data: ${error.message}`);
    return res.json({ status: 500, message: error.message });
  }
};



export const UpdateExpenseType = async (req, res) => {
  try {
    let request = req.body;
    let expenseTypeData = await getExpenseTypeById({ _id: request?.id });

    if (expenseTypeData) {
      // Exclude the 'id' field from the update data
      let { id, ...updateData } = request;

      let expenseTypeUpdate = await UpdateExpenseTypeDetails({ _id: request?.id }, updateData);

      if (expenseTypeUpdate) {
        res.json({ status: 200, message: "Successfully updated" });
      } else {
        res.json({ status: 400, message: "Failed to update data" });
      }
    } else {
      res.json({ status: 400, message: "Record not found" });
    }
  } catch (error) {
    console.error(`Failed to update ExpenseType Data: ${error.message}`);
    res.json({ status: 500, message: error.message });
  }
};


export const DeleteExpenseType = async (req, res) => {
  try {
    let request = req.body;
    let ExpenseTypeData = await getExpenseTypeById({ _id: request?.id });
    if (ExpenseTypeData) {
      let result = await deleteExpenseTypeById({ _id: ExpenseTypeData.id });
      if (result) {
        return res.json({ status: 200, message: "successfully deleted" });
      }
      else {
        return res.json({ status: 400, message: "failed to delete" });
      }
    }
    else {
      return res.json({ status: 400, message: "record not found" });
    }
  } catch (error) {
    console.error(`Failed to delete ExpenseType: ${error.message}`);
    return res.send({ status: 500, message: "Failed to delete ExpenseType" });
  }
};


export const AddExpenses = async (req, res) => {
  try {
    let request = req.body;
    let ExpensesInsert = await ExpensesCreateAndUpdate(request);
    if (ExpensesInsert) {
      res.json({ status: 200, message: "Successfully Added" });
    } else {
      res.json({ status: 400, message: "failed to insert" })
    }
  } catch (error) {
    console.error(`Failed to insert Data: ${error.message}`);
    res.json({ status: 500, message: error.message });
  }
};


export const GetExpenses = async (req, res) => {
  try {
    const request = req.body;
    let creatorname = Verifyuser.name;
    let filter = {};

    if (request?.from_date || request?.to_date) {
      filter.createdAt = {};

      if (request?.from_date) {
        filter.createdAt.$gte = new Date(request?.from_date);
      }

      if (request?.to_date) {
        filter.createdAt.$lt = new Date(new Date(request?.to_date).setDate(new Date(request?.to_date).getDate() + 1));
      }
    }

    if (request?.type) {
      filter.exp_type = request?.type;
    }
    if (request?.status) {
      filter.status = parseInt(request?.status);
    }
    if (request?.search) {
      var search = { $regex: request?.search, $options: 'i' };
      filter['$or'] = [{ exp: search }, { exp_type: search }];
    }

    let expensesData = await getAllExpensesDetails(filter);

    if (expensesData.length > 0) {
      // Calculate the total amount from expensesData
      let totalAmount = expensesData.reduce((acc, expense) => acc + parseFloat(expense?.amount || 0), 0);
      let expensesWithTypes = await getExpensesWithExpenseTypes(filter);
      await forEachAsync(expensesWithTypes, async (expense) => {
        expense.addedBy = creatorname;
      });

      expensesWithTypes.sort((a, b) => b.createdAt - a.createdAt);

      if (expensesWithTypes.length > 0) {
        res.json({ status: 200, data: expensesWithTypes, totalAmount: totalAmount });
      } else {
        res.json({ status: 400, message: "Failed to get data with expense types" });
      }
    } else {
      res.json({ status: 200, data: [], totalAmount: 0 });
    }
  } catch (error) {
    console.error(`Failed to get Expense Data: ${error.message}`);
    res.json({ status: 500, message: error.message });
  }
};


export const GetExpenseById = async (req, res) => {
  try {
    const request = req.body;
    const expenseId = request?.id;

    const expenseData = await getExpenseByIdWithExpenseType(expenseId);

    if (expenseData) {
      const filteredExpense = {
        id: expenseData._id,
        exp: expenseData.exp,
        amount: expenseData.amount,
        comment: expenseData.comment,
        createdAt: expenseData.createdAt,
        updatedAt: expenseData.updatedAt,
        exp_type: expenseData.exp_type?._id,
        exp_type_select: {
          value: expenseData.exp_type?._id,
          label: expenseData.exp_type?.expense_type,
        },
        status_select: {
          value: expenseData.status === 1 ? 1 : 2,
          label: expenseData.status === 1 ? "Active" : "Suspend",
        },
      };
      return res.json({ status: 200, data: filteredExpense });
    } else {
      return res.json({ status: 400, message: "Record not found" });
    }
  } catch (error) {
    console.error(`Failed to get Expense Data: ${error.message}`);
    return res.json({ status: 500, message: error.message });
  }
};


export const UpdateExpenses = async (req, res) => {
  try {
    let request = req.body;

    let expenseData = await getExpensesById({ _id: request?.id });

    if (expenseData) {
      // Exclude the 'id' field from the update data
      let { id, ...updateData } = request;

      let expenseUpdate = await UpdateExpensesDetails({ _id: request?.id }, updateData);

      if (expenseUpdate) {
        res.json({ status: 200, message: "Successfully updated" });
      } else {
        res.json({ status: 400, message: "Failed to update data" });
      }
    } else {
      res.json({ status: 400, message: "Record not found" });
    }
  } catch (error) {
    console.error(`Failed to update Expense Data: ${error.message}`);
    res.json({ status: 500, message: error.message });
  }
};


export const DeleteExpenses = async (req, res) => {
  try {
    let request = req.body;
    let ExpenseData = await getExpensesById({ _id: request?.id });
    if (ExpenseData) {
      let result = await deleteExpensesById({ _id: ExpenseData.id });
      if (result) {
        return res.json({ status: 200, message: "successfully deleted" });
      }
      else {
        return res.json({ status: 400, message: "failed to delete" });
      }
    }
    else {
      return res.json({ status: 400, message: "record not found" });
    }
  } catch (error) {
    console.error(`Failed to delete Expenses: ${error.message}`);
    return res.send({ status: 500, message: "Failed to delete Expenses" });
  }
};


const RecievedBookingCount = async (req) => {
  try {
    let request = req.body;
    let currentDate = moment();
    // let fromDate = moment(request?.from_date, moment.ISO_8601, true).format("YYYY-MM-DD");
    // let toDate = moment(request?.to_date, moment.ISO_8601, true).format("YYYY-MM-DD");
    let fromDate = moment(request?.from_date, moment.ISO_8601, true).startOf('day').toDate();
    let toDate = moment(request?.to_date, moment.ISO_8601, true).endOf('day').toDate();

    // let filterConditions = {
    //   transcation_id: { $ne: "" },
    //   // pikup_date: {
    //   //   $lt: currentDate.startOf('day').toISOString(),
    //   // },
    // };
    let filterConditions = {
      transcation_id: { $ne: "" },
    };

    if (request?.from_date && request?.to_date) {
      filterConditions.transaction_date = {
        $gte: fromDate,
        $lt: toDate,
      };
    }

    // if (request?.from_date && request?.to_date) {
    //   filterConditions = {
    //     transcation_id: { $ne: "" },
    //     $and: [
    //       {
    //         pikup_date: {
    //           $lt: currentDate.format("YY-MM-DD"),
    //         },
    //       },
    //       {
    //         createdAt: {
    //           $gt: fromDate,
    //           $lt: moment(toDate).add(1, 'days').toISOString(),
    //         },
    //       },
    //     ],
    //   };
    // }

    let ordersData = await getAllOrdersDetails(filterConditions);

    let totalAmount = 0;

    await forEachAsync(ordersData, async (order) => {
      let orderAmount = parseFloat(order?.amount) || 0;
      totalAmount += orderAmount;
    });

    return totalAmount;
  } catch (error) {
    console.error(`Failed to calculate total amount: ${error.message}`);
    throw new Error("Failed to calculate total amount");
  }
};


const getExpenseTotal = async (req) => {
  try {
    let request = req.body;
    let currentDate = moment();
    // let fromDate = moment(request?.from_date, moment.ISO_8601, true).format("YYYY-MM-DD");
    // let toDate = moment(request?.to_date, moment.ISO_8601, true).format("YYYY-MM-DD");
    let fromDate = moment(request?.from_date, moment.ISO_8601, true).startOf('day').toDate();
    let toDate = moment(request?.to_date, moment.ISO_8601, true).endOf('day').toDate();

    let filterConditions = {
      // createdAt: {
      //   $lt: currentDate.toISOString(),
      // },
      status: 1,
    };

    // if (request?.from_date && request?.to_date) {
    //   filterConditions = {
    //     $and: [
    //       {
    //         createdAt: {
    //           $gt: fromDate,
    //           $lt: moment(toDate).add(1, 'days').toISOString(),
    //         },
    //       },
    //       { status: 1 },
    //     ],
    //   };
    // }
    if (request?.from_date && request?.to_date) {
      filterConditions.createdAt = {
        $gte: fromDate,
        $lt: toDate,
      };
    }

    let expenseData = await getAllExpensesDetails(filterConditions);
    let totalExpenseAmount = 0;

    expenseData.forEach((expense) => {
      let expenseAmount = parseFloat(expense?.amount) || 0;
      totalExpenseAmount += expenseAmount;
    });

    return totalExpenseAmount;
  } catch (error) {
    console.error(`Failed to get expense data: ${error.message}`);
    throw new Error("Failed to get expense data");
  }
};


const getRefundTotal = async (req) => {
  try {
    let request = req.body;
    let fromDate = request?.from_date;
    let toDate = request?.to_date;

    let filterConditions = {};

    if (fromDate && toDate) {
      filterConditions = {
        refund_date: {
          $gte: fromDate,
          $lt: moment(toDate).add(1, 'days').toISOString(),
        },
      };
    } else if (fromDate === "" && toDate === "") {

    } else {
      return 0;
    }

    let ordersData = await getAllOrdersDetails(filterConditions);


    let totalRefund = 0;

    ordersData.forEach((order) => {
      let refundAmount = parseFloat(order?.refund) || 0;
      totalRefund += refundAmount;
    });

    return totalRefund;
  } catch (error) {
    console.error(`Failed to get refund data: ${error.message}`);
    throw new Error("Failed to get refund data");
  }
};

const getDriverAmountTotal = async (req) => {
  try {
    let request = req.body;
    let currentDate = moment();
    let fromDate = moment(request?.from_date, moment.ISO_8601, true).startOf('day').toDate();
    let toDate = moment(request?.to_date, moment.ISO_8601, true).endOf('day').toDate();

    let filterConditions = {};

    if (request?.from_date && request?.to_date) {
      filterConditions.createdAt = {
        $gte: fromDate,
        $lt: toDate,
      };
    }

    let OrdersData = await getAllOrdersDetails(filterConditions);
    let totaldriverAmount = 0;

    OrdersData.forEach((orders) => {
      let driverAmount = parseFloat(orders?.assignamount) || 0;
      totaldriverAmount += driverAmount;
    });

    return totaldriverAmount;
  } catch (error) {
    console.error(`Failed to get expense data: ${error.message}`);
    throw new Error("Failed to get expense data");
  }
};


export const ProfitLoss = async (req, res) => {
  try {
    const totalRecievedBookingCount = await RecievedBookingCount(req);
    const totalExpenseAmount = await getExpenseTotal(req);
    const totalRefundAmount = await getRefundTotal(req);
    const totalDriverAmount = await getDriverAmountTotal(req);

    // Calculate profit or loss
    let profitLoss = totalRecievedBookingCount - (totalExpenseAmount + totalRefundAmount + totalDriverAmount);

    // 1 for profit and 0 for loss
    let status = profitLoss >= 0 ? 1 : 0;

    res.json({
      status: 200,
      data: {
        totalbookingcount: totalRecievedBookingCount,
        totalexpensecount: totalExpenseAmount,
        totalRefundCount: totalRefundAmount,
        totalDriverCount: totalDriverAmount,
        profitLossvalue: Math.abs(profitLoss),
        profit_loss_status: status,
      }
    });
  } catch (error) {
    console.error(`Failed to calculate profit&loss: ${error.message}`);
    res.json({ status: 500, message: error.message });
  }
};


// Function to send email with attachment
export const sendEmailWithAttachment = async (toEmail, fromEmail, subject, html, filename, pdfBuffer) => {
  try {
    const msg = {
      to: toEmail,
      from: fromEmail,
      subject: subject,
      html: html,
      attachments: [
        {
          content: pdfBuffer.toString('base64'),
          filename: filename,
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
    throw new Error('Failed to send email');
  }
};

export const ExportProfitLossPdf = async (req, res) => {
  try {
    let request = req.body;
    let user = Verifyuser?.email;

    let pdfFolderPath = path.join(__dirname, 'public', 'Profit&Loss');
    if (!fs.existsSync(pdfFolderPath)) {
      fs.mkdirSync(pdfFolderPath, { recursive: true });
    }

    let htmlFilePath = path.join(__dirname, 'views', 'Profit&loss-pdf.html');

    if (!fs.existsSync(htmlFilePath)) {
      console.error(`HTML template file not found: ${htmlFilePath}`);
      return res.json({ status: 500, message: 'HTML template file not found' });
    }

    let html = fs.readFileSync(htmlFilePath, 'utf8');

    const totalRecievedBookingCount = await RecievedBookingCount(req);
    const totalExpenseAmount = await getExpenseTotal(req);
    const totalRefundAmount = await getRefundTotal(req);
    const totalDriverAmount = await getDriverAmountTotal(req);

    let profitLossvalue = totalRecievedBookingCount - (totalExpenseAmount + totalRefundAmount + totalDriverAmount);
    let profit_loss_status = profitLossvalue >= 0 ? 1 : 0;

    let template = handlebars.compile(html);
    let dynamicData = {
      totalbookingcount: totalRecievedBookingCount,
      totalexpensecount: totalExpenseAmount,
      totalRefundCount: totalRefundAmount,
      totalDriverCount: totalDriverAmount,
      profit_loss_status: profit_loss_status,
      profitLossvalue: Math.abs(profitLossvalue),
      request: {
        from_date: request?.from_date ? moment(request?.from_date).format('DD-MMM-YYYY') : '',
        to_date: request?.to_date ? moment(request?.to_date).format('DD-MMM-YYYY') : ''
      },
    };
    let compiledHtml = template(dynamicData);

    let browser = await puppeteer.launch({
      headless: 'new',
      timeout: 0,
    });
    let page = await browser.newPage();
    await page.setContent(compiledHtml);

    // Generate PDF
    let pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '5px',
        bottom: '5px',
        left: '15px',
        right: '15px',
      },
    });
    await browser.close();

    let pdfFileName = 'ProfitLossReport.pdf';
    let pdfFilePath = path.join(pdfFolderPath, pdfFileName);
    fs.writeFileSync(pdfFilePath, pdfBuffer);

    // Send email with attachment
    await sendEmailWithAttachment(
      user,
      'ThriveBlack Car <admin@thriveblackcar.com>',
      'Profit & Loss Report',
      `<p>Hello,${Verifyuser.name} Profit & Loss pdf is ready to download and view</p>`,
      pdfFileName,
      pdfBuffer
    );

    let modifiedFilePath = path.relative(path.join(__dirname, 'public'), pdfFilePath).replace(/\\/g, '/');

    return res.json({
      status: 200,
      message: 'Profit & Loss PDF is successfully exported and sent via mail',
      filePath: `/${modifiedFilePath}`,
    });
  } catch (error) {
    console.error(`Failed to export Profit & Loss PDF: ${error.message}`);
    return res.json({ status: 500, message: 'Failed to export Profit & Loss PDF' });
  }
};




























