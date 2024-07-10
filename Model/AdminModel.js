import mongoose from "mongoose";
import crypto from "crypto";
// //   AdminSchema Schema Start
var AdminSchema = mongoose.Schema(
  {},
  {
    collection: "tbl_admins",
    strict: false,
    timestamps: true,
  }
);
// //  AdminSchema Schema End
var Admins = mongoose.model("tbl_admins", AdminSchema);
export async function CreateAndUpdate(args) {
  return new Promise((resolve) => {
    if (args?.id) {
      let id = args?.id;
      delete args?.id;
      var updateData = {
        $set: args,
      };

      Admins.updateOne({ _id: id }, updateData, function (err, result) {
        if (result) {
          resolve(result);
        }
        else {
          resolve()
        }
      });
    } else {
      Admins.create(args).then((result) => {
        if (result) {
          resolve(result);
        } else {
          resolve()
        }
      });

    }
  });
}


export async function getAllUserDetails(args = {}, projection = {}, options = {}) {
  return new Promise((resolve) => {
    Admins.find(args, projection, options).lean().then((result) => {
      if (result) {
        resolve(result);
      } else {
        resolve();
      }
    });
  })
}


export async function getUserById(args = {}) {
  return new Promise((resolve) => {
    Admins.findOne(args).then((result) => {
      if (result) {
        resolve(result);
      } else {
        resolve();
      }
    }).catch((err) => {
      resolve()
    });
  })
}


export async function UpdateUserDetails(args = {}, data) {
  let update = {
    $set: data,
  };

  const result = await Admins.updateOne(args, update);

  return result;
}

export async function deleteUserById(args) {
  return Admins.deleteOne(args);
}

export const verifyPassword = (inputPassword, storedSalt, storedPasswordHash) => {
  const hashedPassword = crypto.pbkdf2Sync(inputPassword, storedSalt, 10000, 64, 'sha512').toString('hex');
  return hashedPassword === storedPasswordHash;
};


export async function getUserCount(args = {}) {
  return new Promise((resolve) => {
    args = {
      ...args,
      user_type: 1,
    };

    let result = Admins.countDocuments(args);
    resolve(result);
  });
}


