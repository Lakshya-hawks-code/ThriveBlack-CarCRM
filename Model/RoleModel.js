import mongoose from "mongoose";
// //   RoleSchema Schema Start
var RoleSchema = mongoose.Schema(
  {},
  {
    collection: "tbl_roles",
    strict: false,
    timestamps: true,
  }
);
// //  RoleSchema Schema End
var Roles = mongoose.model("tbl_roles", RoleSchema);
export async function CreateAndUpdate(args) {
  return new Promise( (resolve) => {
    if (args?.id) {
      let id = args?.id;
      delete args?.id;
      var updateData = {
        $set: args,
      };

      Roles.updateOne({ _id: id }, updateData, function (err, result) {
        if (result) {
          resolve(result);
        }
        else{
          resolve()
        }
      });
    } else {
        Roles.create(args).then((result) => {
        if(result){ 
          resolve(result);
        }
        else{
          resolve()
        }
      }); 
    }
  });
}

export async function getAllRoleDetails(args = {}, projection = {}, options = {}) {
  return new Promise( (resolve) => {
    Roles.find(args, projection, options).lean().then((result)=>{
    if(result){
      resolve(result);
    }else{
      resolve() ;
    }
  }) ; 
  })
}


export async function getRoleById(args = {}) {
  return new Promise( (resolve) => {
    Roles.findOne(args).lean().then((result)=>{
    if(result){
      resolve(result);
    }else{
      resolve() ;
    }
  }); 
})
}


export async function UpdateRoleDetails(args = {}, data) {
  return new Promise((resolve, reject) => {
    const update = {
      $set: data,
    };

    Roles.updateOne(args, update).then((result) => {
      resolve(result);
    }).catch((error) => {
      reject(error);
    });
  });
}


export async function deleteRoleById(args) {
  return Roles.deleteOne(args);
}


