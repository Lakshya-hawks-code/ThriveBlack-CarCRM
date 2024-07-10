import { getRoleById } from "../Model/RoleModel.js";
import { UpdateUserDetails } from "../Model/AdminModel.js"; 
import { uploadProfile } from "../helper/Multer.js"; 
import { PriceCreateAndUpdate } from "../Model/PriceModel.js"; 

/* global Verifyuser */

export const Showprofile = async (req, res) => {
  try {
    let role;
    if(Verifyuser?.user_type ===1){
        role = await getRoleById({ _id: Verifyuser.role_id}); 
    } 
      let userData = {
        id:Verifyuser._id,
        name: Verifyuser.name,
        email: Verifyuser.email,
        phone: Verifyuser.phone,
        address: Verifyuser.address,
        profile_image:Verifyuser.profile_img,
        role_id:Verifyuser.role_id,      
        user_type:Verifyuser.user_type,      
        rolename : Verifyuser?.user_type ===1 ? role?.rolename : "",
        permission : Verifyuser?.user_type ===1 ? role?.permission : [],         
      };
      return res.json({ status: 200, data:userData });  
  } catch (error) {
    console.error(`Failed to verify Token: ${error.message}`);
    return res.json({ status: 500, message: "Failed to matched token" });
  }
};



export const Updateprofile = async (req, res) => { 
  try {
    let uploadPath = '/profile_image/';
    let Request = req.body;

    // Check if profile_img is blank
    if (Request.profile_img) {
      // If profile_img is provided, upload the image
      let result = await uploadProfile(uploadPath, Request.profile_img);

      // Update profile with the uploaded image
      let updateprofile = await UpdateUserDetails(
        { _id: Verifyuser._id },
        {
          name: Request.name,
          email: Request.email,
          phone: Request.phone,
          address: Request.address,
          profile_img: result, 
          role_id: Request.role_id,
          status: Request.status,
          password: Request.password,
        }
      );
      if (updateprofile) {
        return res.json({ status: 200, message: "Profile Updated Successfully" });
      } else {
        return res.json({ status: 500, message: "Failed to Update profile" });
      }
    } else {
      // If profile_img is blank, update profile without changing the image
      let updateprofile = await UpdateUserDetails(
        { _id: Verifyuser._id },
        {
          name: Request.name,
          email: Request.email,
          phone: Request.phone,
          address: Request.address,
          role_id: Request.role_id,
          status: Request.status,
          password: Request.password,
        }
      );
      if (updateprofile) {
        return res.json({ status: 200, message: "Profile Updated Successfully" });
      } else {
        return res.json({ status: 500, message: "Failed to Update profile" });
      }
    }
  } catch (error) {
    console.error(`Failed to Update profile: ${error}`);
    return res.json({ status: 500, message: "Failed to Update profile" });
  }
};


