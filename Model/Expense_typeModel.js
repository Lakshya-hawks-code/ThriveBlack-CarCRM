import mongoose from "mongoose";
import { rejects } from "assert";
// //   ExpenseType Schema Start
var ExpenseTypeSchema = mongoose.Schema(
  {},
  {
    collection: "tbl_expense_type",
    strict: false,
    timestamps: true,
  }
);
// //  ExpenseType Schema End
var Expense = mongoose.model("tbl_expense_type", ExpenseTypeSchema);
export async function ExpenseCreateAndUpdate(args) {
  return new Promise((resolve) => {
    if (args?.id) {
      let id = args?.id;
      delete args?.id;
      var updateData = {
        $set: args,
      };

      Expense.updateOne({ _id: id }, updateData, function (err, result) {
        if (result) {
          resolve(result);
        }
        else{
          resolve()
        }
      });
    } else {
        Expense.create(args).then((result) => {
        if(result){ 
          resolve(result);
        }else{
          resolve()
        }
      });
     
    }
  });
}


export async function getAllExpenseTypeDetails(args = {}, projection = {}, options = {}) {
  return new Promise( (resolve) => {
    Expense.find(args, projection, options).lean().then((result)=>{
    if(result){
      resolve(result);
    }else{
      resolve() ;
    }
  }) ; 
  })
}


export async function getExpenseTypeById(args = {}) {
  return new Promise( (resolve) => {
    Expense.findOne(args).then((result)=>{
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


export async function UpdateExpenseTypeDetails(args = {}, data) {
    return new Promise((resolve, reject) => {
      const update = {
        $set: data,
      };
  
      Expense.updateOne(args, update).then((result) => {
        if(result?.modifiedCount > 0){ 
          resolve(true);
        }else{
          resolve(false)
        }
      }).catch((error) => {
        reject(error);
      });
    });
}

export async function deleteExpenseTypeById(args) {
  return Expense.deleteOne(args);
}


export async function getExpenseCount(args = {}) {
  return new Promise((resolve) => {
    let result = Expense.countDocuments(args);
    resolve(result);
  });
}

