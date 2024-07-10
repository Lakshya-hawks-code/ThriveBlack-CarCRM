import mongoose from "mongoose";
import { rejects } from "assert";
// //   Expenses Schema Start
var ExpensesSchema = mongoose.Schema(
  {},
  {
    collection: "tbl_expenses",
    strict: false,
    timestamps: true,
  }
);
// //  Expenses Schema End
var Expenses = mongoose.model("tbl_expenses", ExpensesSchema);
export async function ExpensesCreateAndUpdate(args) {
  return new Promise((resolve) => {
    if (args?.id) {
      let id = args?.id;
      delete args?.id;
      var updateData = {
        $set: args,
      };

      Expenses.updateOne({ _id: id }, updateData, function (err, result) {
        if (result) {
          resolve(result);
        }
        else{
          resolve()
        }
      });
    } else {
        Expenses.create(args).then((result) => {
        if(result){ 
          resolve(result);
        }else{
          resolve()
        }
      });
     
    }
  });
}


export async function getAllExpensesDetails(args = {}, projection = {}, options = {}) {
  return new Promise( (resolve) => {
    Expenses.find(args, projection, options).lean().then((result)=>{
    if(result){
      resolve(result);
    }else{
      resolve() ;
    }
  }) ; 
  })
}


export async function getExpensesById(args = {}) {
  return new Promise( (resolve) => {
    Expenses.findOne(args).then((result)=>{
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


export async function UpdateExpensesDetails(args = {}, data) {
    return new Promise((resolve, reject) => {
      const update = {
        $set: data,
      };
  
      Expenses.updateOne(args, update).then((result) => {
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

export async function deleteExpensesById(args) {
  return Expenses.deleteOne(args);
}


export async function getExpensesCount(args = {}) {
  return new Promise((resolve) => {
    let result = Expenses.countDocuments(args);
    resolve(result);
  });
}


export async function getExpensesWithExpenseTypes(filter) {
  return new Promise((resolve) => {
    const pipeline = [
      {
        $match: filter,
      },
      {
        $lookup: {
          from: "tbl_expense_type",
          let: { expTypeId: { $toObjectId: "$exp_type" } },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$expTypeId"] },
              },
            },
          ],
          as: "expenseTypeData",
        },
      },
      {
        $project: {
          _id: 1,
          exp: 1,
          amount: 1,
          status: 1,
          comment: 1,
          createdAt: 1,
          updatedAt: 1,
          exp_type: {
            $cond: {
              if: { $gt: [{ $size: "$expenseTypeData" }, 0] },
              then: { $arrayElemAt: ["$expenseTypeData.expense_type", 0] },
              else: "$exp_type",
            },
          },
        },
      },
    ];

    Expenses.aggregate(pipeline)
      .then((result) => {
        resolve(result);
      })
      .catch((err) => {
        resolve([]);
      });
  });
}


export async function getExpenseByIdWithExpenseType(id) {
  return new Promise((resolve) => {
    const pipeline = [
      {
        $match: { _id: new mongoose.Types.ObjectId(id) },
      },
      {
        $lookup: {
          from: "tbl_expense_type",
          let: { expTypeId: { $toObjectId: "$exp_type" } },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$expTypeId"] },
              },
            },
            {
              $project: {
                _id: 1, // Include additional fields you want from tbl_expense_type
                expense_type: 1,
              },
            },
          ],
          as: "expenseTypeData",
        },
      },
      {
        $project: {
          _id: 1,
          exp: 1,
          amount: 1,
          status: 1,
          comment: 1,
          createdAt: 1,
          updatedAt: 1,
          exp_type: {
            $cond: {
              if: { $gt: [{ $size: "$expenseTypeData" }, 0] },
              then: { $arrayElemAt: ["$expenseTypeData", 0] },
              else: "$exp_type",
            },
          },
        },
      },
    ];

    Expenses.aggregate(pipeline)
      .then((result) => {
        resolve(result[0]); // Assuming _id is unique, so returning the first element
      })
      .catch((err) => {
        resolve(null);
      });
  });
}

















