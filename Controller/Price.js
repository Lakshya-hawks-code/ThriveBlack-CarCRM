import { UpdatePriceDetails } from "../Model/PriceModel.js";
import { getAllPriceDetails } from "../Model/PriceModel.js";
import { PriceCreateAndUpdate } from "../Model/PriceModel.js";
import { getPriceById } from "../Model/PriceModel.js";


export const AddPrice = async (req, res) => {
  try {
    let request = req.body;
    let PriceAdd = await PriceCreateAndUpdate(request);
    if (PriceAdd) {
      res.json({ status: 200, data: PriceAdd });
    } else {
      res.json({ status: 400, message: "Failed to insert" });
    }
  } catch (error) {
    console.log(`Failed to insert Price Data: ${error.message}`);
    res.json({ status: 500, message: "Failed to insert Price Data" });
  }
};


export const GetPrice = async (req, res) => {
  try {
    let prices = await getAllPriceDetails();
    if (prices) {
      let formattedPrices = prices.map(({ _id, updatedAt, createdAt, __v, ...rest }) => {
        let type = Object.keys(rest).find(key => rest[key] !== undefined) || "";
        return {
          _id,
          updatedAt,
          type
        };
      });

      return res.json({ status: 200, data: formattedPrices });
    } else {
      return res.json({ status: 400, message: "Record not found" });
    }
  } catch (error) {
    console.log(`Failed to get price data: ${error.message}`);
    return res.send({ status: 500, message: "Failed to get price data" });
  }
};



export const GetPriceListById = async (req, res) => {
  try {
    let request = req.body;
    let projection = { createdAt: 0, updatedAt: 0, __v: 0 }
    let TransferData = await getPriceById({ _id: request?.id }, projection);
    if (TransferData) {
      res.json({ status: 200, data: TransferData });
    }
    else {
      res.json({ status: 400, message: "Failed to get data" });
    }
  }
  catch (error) {
    console.log(`Failed to get Transfer data: ${error.message}`);
    res.json({ status: 500, message: "Failed to get Transfer data" });
  }
}


export const UpdatePriceList = async (req, res) => {
  try {
    let request = req.body;
    let Transferdata = await getPriceById({ _id: request?.id });
    if (Transferdata) {
      let updateFields = {};

      if (request?.transfer) {
        updateFields.transfer = request?.transfer;
      }
      else if (request?.hour) {
        updateFields.hour = request?.hour;
      }
      else if (request?.meetgreet) {
        updateFields.meetgreet = request?.meetgreet;
      }
      else if (request?.surgecharge) {
        updateFields.surgecharge = request?.surgecharge;
      }
      else if (request?.vehicle_model) {
        updateFields.vehicle_model = request?.vehicle_model;
      }
      else {
        return res.json({ status: 400, message: "Failed to Update" });
      }

      let TransferUpdate = await UpdatePriceDetails({ _id: Transferdata?.id.toString() }, updateFields);
      if (TransferUpdate) {
        return res.json({ status: 200, message: "Successfully Updated" });
      }
      else {
        return res.json({ status: 400, message: "Failed to update" });
      }
    }
    else {
      return res.json({ status: 400, message: "Record not found" });
    }
  }
  catch (error) {
    console.log(`Failed to update Transfer data: ${error.message}`);
    res.json({ status: 500, message: "Failed to update Transfer data" });
  }
}


export const GetAllPrices = async (req, res) => {
  try {
    let projection = { _id: 0, createdAt: 0, updatedAt: 0, __v: 0 };
    let prices = await getAllPriceDetails({}, projection);

    if (prices && Array.isArray(prices)) {

      let transformedData = {
        transfer: {},
        hour: {},
        meetgreet: {},
        surgecharge: {},
      };

      prices.forEach((item) => {
        if (item.transfer && Array.isArray(item.transfer)) {
          item.transfer.forEach((transferItem) => {
            let cartype = transferItem.cartype.toLowerCase();
            transformedData.transfer[`${cartype}_base_amount`] = parseFloat(transferItem?.base_amount);
            transformedData.transfer[`${cartype}_base_distance`] = parseFloat(transferItem?.base_distance);
            transformedData.transfer[`${cartype}_distance_amount`] = parseFloat(transferItem?.distance_amount);
          });
        }

        if (item?.hour && Array.isArray(item?.hour)) {
          item.hour.forEach((hourItem) => {
            let cartype = hourItem.cartype.toLowerCase();
            transformedData.hour[`${cartype}_amount`] = parseFloat(hourItem?.amount);
          });
        }

        if (item?.meetgreet) {
          transformedData.meetgreet.amount = parseFloat(item?.meetgreet?.amount);
        }

        if (item?.surgecharge) {
          transformedData.surgecharge.timesurgecharge = parseFloat(item?.surgecharge?.timesurgecharge);
          transformedData.surgecharge.returneventsurgecharge = parseFloat(item?.surgecharge?.returneventsurgecharge);
          transformedData.surgecharge.eventfromsurgecharge = parseFloat(item?.surgecharge?.eventfromsurgecharge);
          transformedData.surgecharge.eventtosurgecharge = parseFloat(item?.surgecharge?.eventtosurgecharge);
        }
      });

      return res.json({ status: 200, data: transformedData });
    } else {
      return res.json({ status: 400, message: "Record not found" });
    }
  } catch (error) {
    console.error(`Failed to get price data: ${error.message}`);
    return res.send({ status: 500, message: "Failed to get price data" });
  }
};






