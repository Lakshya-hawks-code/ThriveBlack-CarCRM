import mongoose from "mongoose";
// //   NotificationSchema Schema Start
var NotificationSchema = mongoose.Schema(
  {},
  {
    collection: "tbl_notifications",
    strict: false,
    timestamps: true,
  }
);
// //  NotificationSchema Schema End
var Notification = mongoose.model("tbl_notifications", NotificationSchema);
export async function NotificationCreateAndUpdate(args) {
  return new Promise( (resolve) => {
    if (args?.id) {
      let id = args?.id;
      delete args?.id;
      var updateData = {
        $set: args,
      };

      Notification.updateOne({ _id: id }, updateData, function (err, result) {
        if (result) {
          resolve(result);
        }
        else{
          resolve()
        }
      });
    } else {
      let result =   Notification.create(args).then((result) => result.id);
      resolve(result);

    }
  });
}

export async function getAllNotifications(args = {}, projection = {}, options = {}) {
  return new Promise( (resolve) => {
    Notification.find(args, projection, options).then((result)=>{
    if(result){
      resolve(result);
    }else{
      resolve() ;
    }
  }) ; 
  })
}


export async function getNotificationById(args = {}) {
  return new Promise( (resolve, ) => {
    Notification.findOne(args).then((result)=>{
    if(result){
      resolve(result);
    }else{
      resolve() ;
    }
  }); 
})
}

export async function UpdateNotification(args = {}, data) {
  return new Promise((resolve, reject) => {
    const update = {
      $set: data,
    };

    Notification.updateOne(args, update).then((result) => {
      resolve(result);
    }).catch((error) => {
      reject(error);
    });
  });
}

export async function deleteNotification(args) {
  return Notification.deleteMany(args);
}


export const countNotifications = async (query = {}) => {
    try {
        const count = await Notification.countDocuments(query);
        return count;
    } catch (error) {
        throw new Error(`Failed to count notifications: ${error.message}`);
    }
};

