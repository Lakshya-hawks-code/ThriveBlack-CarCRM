import mongoose from "mongoose";
import crypto from "crypto";
import { rejects } from "assert";
// //   PriceSchema Schema Start
var PriceSchema = mongoose.Schema(
  {},
  {
    collection: "tbl_price_managements",
    strict: false,
    timestamps: true,
  }
);
// //  PriceSchema Schema End
var Prices = mongoose.model("tbl_price_managements", PriceSchema);
export async function PriceCreateAndUpdate(args) {
  return new Promise((resolve) => {
    if (args?.id) {
      let id = args?.id;
      delete args?.id;
      var updateData = {
        $set: args,
      };

      Prices.updateOne({ _id: id }, updateData, function (err, result) {
        if (result) {
          resolve(result);
        }
        else{
          resolve()
        }
      });
    } else {
        Prices.create(args).then((result) => {
        if(result){ 
          resolve(result);
        }else{
          resolve();
        }
      });
     
    }
  });
}


export async function getAllPriceDetails(args = {}, projection = {}, options = {}) {
  return new Promise( (resolve) => {
    Prices.find(args, projection, options).lean().then((result)=>{
    if(result){
      resolve(result);
    }else{
      resolve() ;
    }
  }) ; 
  })
}


export async function getPriceById(args = {},projection = {}) {
  return new Promise( (resolve) => {
    Prices.findOne(args,projection).then((result)=>{
    if(result){
      resolve(result);
    }else{
      resolve() ;
    }
  }).catch((err)=>{
    resolve()
  }); 
})
}


export async function UpdatePriceDetails(args = {}, data) {
  let update = {
    $set: data,
  };

  const result = await Prices.updateOne(args, update);

  return result;
}

export async function deletePriceById(args) {
  return Prices.deleteOne(args);
}



