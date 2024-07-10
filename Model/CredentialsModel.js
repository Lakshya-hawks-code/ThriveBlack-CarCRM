import mongoose from "mongoose";
// //   CredentialSchema Schema Start
var CredentialSchema = mongoose.Schema(
  {},
  {
    collection: "tbl_credentials",
    strict: false,
    timestamps: true,
  }
);
// //  CredentialSchema Schema End
var Credentials = mongoose.model("tbl_credentials", CredentialSchema);
export async function CreateAndUpdate(args) {
  return new Promise( (resolve, ) => {
    if (args?.id) {
      let id = args?.id;
      delete args?.id;
      var updateData = {
        $set: args,
      };

      Credentials.updateOne({ _id: id }, updateData, function (err, result) {
        if (result) {
          resolve(result);
        }
        else{
          resolve()
        }
      });
    } else {
      let result =   Credentials.create(args).then((result) => result.id);
      resolve(result);

    }
  });
}


export async function getAllCredentials(args = {}, projection = {}, options = {}) {
  return new Promise( (resolve) => {
    Credentials.find(args, projection, options).lean().then((result)=>{
    if(result){
      resolve(result);
    }else{
      resolve() ;
    }
  }) ; 
  })
}


export async function getCredentialsById(args = {}) {
  return new Promise( (resolve) => {
  Credentials.findOne(args).then((result)=>{
    if(result){
      resolve(result);
    }else{
      resolve() ;
    }
  }); 
})
}

export async function UpdateCredentialsDetails(args = {}, data) {
  return new Promise((resolve, reject) => {
    const update = {
      $set: data,
    };

    Credentials.updateOne(args, update).then((result) => {
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


export async function deleteCredentialsById(args) {
  return Credentials.deleteOne(args);
}





