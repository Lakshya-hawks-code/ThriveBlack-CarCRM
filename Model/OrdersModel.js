import mongoose from "mongoose";
// //   OrdersSchema Schema Start
var OrdersSchema = mongoose.Schema(
  {},
  {
    collection: "tbl_orders",
    strict: false,
    timestamps: true,
  }
);
// //  OrdersSchema Schema End
var Orders = mongoose.model("tbl_orders", OrdersSchema);
export async function CreateAndUpdate(args) {
  return new Promise((resolve,) => {
    if (args?.id) {
      let id = args?.id;
      delete args?.id;
      var updateData = {
        $set: args,
      };

      Orders.updateOne({ _id: id }, updateData, function (err, result) {
        if (result) {
          resolve(result);
        }
        else {
          resolve()
        }
      });
    } else {
      let result = Orders.create(args).then((result) => result);
      resolve(result);

    }
  });
}


export async function getAllOrdersDetails(args = {}, projection = {}, options = {}) {
  return new Promise((resolve) => {
    Orders.find(args, projection, options).lean().then((result) => {
      if (result) {
        resolve(result);
      } else {
        resolve();
      }
    });
  })
}


export async function getOrdersById(args = {}, projection = {}) {
  return new Promise((resolve) => {
    Orders.findOne(args, projection).lean().then((result) => {
      if (result) {
        resolve(result);
      } else {
        resolve();
      }
    });
  })
}

export async function UpdateOrdesDetails(args = {}, data) {
  return new Promise((resolve, reject) => {
    const update = {
      $set: data,
    };

    Orders.updateOne(args, update).then((result) => {
      if (result?.modifiedCount > 0) {
        resolve(true);
      } else {
        resolve(false)
      }
    }).catch((error) => {
      reject(error);
    });
  });
}


export async function deleteOrdersById(args) {
  return Orders.deleteOne(args);
}

export async function deleteAllOrders(args) {
  return Orders.deleteMany(args);
}


export async function getBookingCountByDriverId(driverId) {
  try {
    let result = await Orders.aggregate([
      {
        $match: {
          driver_id: driverId,
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
        },
      },
    ]);
    return result[0]?.count || 0;
  } catch (error) {
    console.error(`Error in getBookingCountByDriverId: ${error.message}`);
    throw error;
  }
}





