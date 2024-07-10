import { getAllOrdersDetails } from "../Model/OrdersModel.js";
import { forEachAsync } from "foreachasync";
import { Get_API_KEY } from "../helper/GetApiKey.js";
import path from "path";
import fs from "fs";
import ExcelJS from "exceljs";
import puppeteer from "puppeteer";
import handlebars from "handlebars";
import moment from "moment";
import sgMail from "@sendgrid/mail";

const __dirname = path.resolve();


export const Finance = async (req, res) => {
    try {
        let request = req.body;
        let projection = { email: 1, amount: 1, transcation_id: 1,updatedAt: 1 };

        let dateQuery = {};
        if (request?.from_date && request?.to_date) {
            dateQuery.updatedAt = {
                $gte: new Date(request?.from_date),
                $lt: new Date(new Date(request?.to_date).setDate(new Date(request.to_date).getDate() + 1))
            };
        }
        let searchQuery = {};
        if (request?.search) {
            searchQuery.$or = [
                { email: { $regex: new RegExp(request?.search, 'i') } },
                { transcation_id: { $regex: new RegExp(request?.search, 'i') } }
            ];
        }
        let ordersdata = await getAllOrdersDetails({ transcation_id: { $ne: "" }, ...dateQuery,...searchQuery }, projection,{ sort: { createdAt: -1 } });

        if (ordersdata) {
            await forEachAsync(ordersdata, async (order) => {
                order.payment_date = order?.updatedAt;
                delete order.updatedAt; 
            });
            let totalAmount = ordersdata.reduce((acc, order) => acc + parseFloat(order?.amount || 0), 0);
            return res.json({ status: 200, data: ordersdata,totalamount: totalAmount});
        } else {
            res.json({ status: 400, message: "Order not found" });
        }
    } catch (error) {
        console.error(`Failed to find orders: ${error.message}`);
        return res.send({ status: 500, message: "Failed to find orders" });
    }
};


export const FinanceCsv = async (req, res) => {
    try {
        let projection = { email: 1, amount: 1, transcation_id: 1, updatedAt: 1};
        let options = { sort: { createdAt: -1 } };
        let ordersdata = await getAllOrdersDetails({ transcation_id: { $ne: "" }}, projection,options);

        let financeFolderPath = path.join(process.cwd(), 'public', 'finance');

        if (!fs.existsSync(financeFolderPath)) {
            fs.mkdirSync(financeFolderPath);
        }
        let dataWithSNo = ordersdata.map((order, index) => ({ ...order, sno: index + 1 ,amount: order.amount !== undefined ? order.amount : 0}));
        let workbook = new ExcelJS.Workbook();
        let worksheet = workbook.addWorksheet('Orders');

        worksheet.columns = [
            { header: 'S.No', key: 'sno', width: 5 ,alignment: { horizontal: 'right' }},
            { header: 'Email', key: 'email' ,width: 15,alignment: { horizontal: 'right' }},
            { header: 'Amount', key: 'amount',width: 15,alignment: { horizontal: 'right' },numFmt: '#,##0.00' },
            { header: 'Transaction ID', key: 'transcation_id',width: 15,alignment: { horizontal: 'right' }},
            { header: 'Payment Date', key: 'updatedAt',width: 15,alignment: { horizontal: 'right' }},
        ];

        worksheet.addRows(dataWithSNo);
        worksheet.columns.forEach((column) => {
            column.width = column.header.length < 12 ? 12 : column.header.length;
        });
        worksheet.getRow(1).font = { bold: true };

        let outputPath = path.join(financeFolderPath, 'Finance.xlsx');
        await workbook.xlsx.writeFile(outputPath);

        let filePath = outputPath.replace(process.cwd(), '').replace(/\\/g, '/');

        // Remove the `public` directory from the file path
        filePath = filePath.replace('/public', '');

        res.json({ status: 200, message: 'Excel file is successfully exported', file: filePath });
    } catch (error) {
        console.error(`Failed to export Excel file: ${error.message}`);
        return res.send({ status: 500, message: 'Failed to export Excel file' });
    }
};



export const FinancePdf = async (req, res) => {
    try {
        let projection = { email: 1, amount: 1, transcation_id: 1, updatedAt: 1 };
        let options = { sort: { createdAt: -1 } };
        let ordersdata = await getAllOrdersDetails({ transcation_id: { $ne: '' } }, projection,options);

        let financeFolderPath = path.join(__dirname, 'public', 'finance');
        if (!fs.existsSync(financeFolderPath)) {
            fs.mkdirSync(financeFolderPath, { recursive: true });
        }

        let htmlFilePath = path.join(__dirname, 'views', 'Finance-pdf.html');
        let html = fs.readFileSync(htmlFilePath, 'utf-8');
        let compiledHtml = handlebars.compile(html);

        await forEachAsync(ordersdata, async (order, index) => {
            order.serialNumber = index + 1;
            order.payment_date = new Date(order?.updatedAt).toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
            order.amount = order.amount !== undefined ? order.amount : 0;
        });
        let data = { filteredOrders: ordersdata };
        let finalHtml = compiledHtml(data);

        let browser = await puppeteer.launch({ headless: "new", timeout: 0, });
        let page = await browser.newPage();

        let headerFilePath = path.join(__dirname, 'views', 'partials', 'Finance_header.html');
        let footerFilePath = path.join(__dirname, 'views', 'partials', 'Finance_footer.html');

        let headerHtml = fs.readFileSync(headerFilePath, 'utf-8');
        let footerHtml = fs.readFileSync(footerFilePath, 'utf-8');

        let compiledHeaderHtml = handlebars.compile(headerHtml)();
        let compiledFooterHtml = handlebars.compile(footerHtml)();

        finalHtml = compiledHeaderHtml + finalHtml + compiledFooterHtml;

        await page.setContent(finalHtml, { waitUntil: 'domcontentloaded' });

        let pdfBuffer = await page.pdf({
            format: 'A4',
            margin: {
                top: '5px',
                bottom: '5px',
                left: '10px',
                right: '10px',
            },
        });

        let pdfPath = path.join(financeFolderPath, 'finance.pdf');
        fs.writeFileSync(pdfPath, pdfBuffer);

        let toEmail = Verifyuser.email;
        let currentDateTime = moment().format('YYYY-MM-DD HH:mm:ss');

        let msg = {
            to: toEmail,
            from: "ThriveBlack Car <admin@thriveblackcar.com>",
            subject: `Finance Pdf is Ready !! ${currentDateTime}`,
            html: `<p>Hello, ${Verifyuser.name},</p><p>the finance PDF is ready to download and view</p>`,
            attachments: [
                {
                    content: Buffer.from(fs.readFileSync(pdfPath)).toString('base64'),
                    filename: 'finance.pdf',
                    type: 'application/pdf',
                    disposition: 'attachment',
                },
            ],
        };
        await Get_API_KEY();
        sgMail.setApiKey(global.SendGridApiKey);

        await sgMail.send(msg);

        res.json({ status: 200, message: 'PDF file is successfully generated and sent via mail' });
        await browser.close();
    } catch (error) {
        console.error(`Failed to generate and send PDF: ${error.message}`);
        return res.json({ status: 500, message: 'Failed to generate and send PDF' });
    }
};











