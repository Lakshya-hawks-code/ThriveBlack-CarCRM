import { CreateAndUpdate } from "../Model/RoleModel.js";
import { getAllRoleDetails } from "../Model/RoleModel.js";
import { getRoleById } from "../Model/RoleModel.js";
import { UpdateRoleDetails } from "../Model/RoleModel.js";
import { deleteRoleById } from "../Model/RoleModel.js";
import {getUserCount} from '../Model/AdminModel.js'
import {NotificationCreateAndUpdate} from '../Model/NotificationModel.js'
import { forEachAsync } from "foreachasync";

/* global Verifyuser */

export const RolesCreateAndUpdate = async (req, res) => {
  try {
    let creatorname=req.VerifyAuth;
    let  request= req.body;
  // Add the new field to the request object
  request['CreatedBy'] = creatorname;
    let settings = await CreateAndUpdate(request);
    
    if (settings) {
      res.json({status:200,data:settings});
    } else {
      res.status(400).json({});
    }
  } catch (error) {
    console.error(`Failed to insert Role Data: ${error.message}`);
    res.json({status:400, message: error.message });
  }
};


export const SearchRoles = async (req, res) => {
  let rolename = req.body.search;
  let rolestatus = req.body.status;

  try {
    let roles = await getAllRoleDetails({
      rolename: { $regex: new RegExp(rolename, "i") },
      status: parseInt(rolestatus),
    });

    // Add the createdBy and count field to the roles data
    await forEachAsync(roles,async(element)=>{
      element.createdBy = Verifyuser.name;
      element.no_staff = await getUserCount({role_id:element?._id?.toString()}) || 0; 
    }) 

    roles.sort((a, b) => b.createdAt - a.createdAt);

    if (rolename === "") {
      return res.json({ status: 200, data: roles });
    }

    if (roles.length === 0) {
      return res.json({ status: 200, data: [] });
    }

    return res.json({ status: 200, data: roles });
  } catch (error) {
    console.error(`Failed to search roles: ${error.message}`);
    return res.json({ status: 500, message: "Failed to search roles" });
  }
};


export const ManageRole = async (req, res) => {
  try {
    let roleData = await CreateAndUpdate(req.body);
    if (roleData) {
      res.json({ status: 200, message: "successfully inserted" });
    } else {
      res.json({ status: 400, message: "failed to insert" });
    }
  } catch (error) {
    console.error(`Failed to insert Role Data: ${error.message}`);
    res.json({ status: 400, message: error.message });
  }
};


export const GetRolesData = async (req, res) => {
  try {
    let roles = await getAllRoleDetails({ status: 1 });

    if (roles && roles.length > 0) {
      let rolesData = roles.map(role => ({
        id: role._id,
        name: role.rolename,
      }));

      return res.json({ status: 200, data: rolesData });
    }
    return res.json({ status: 400, message: "Records not found" });
  } catch (error) {
    console.error(`Failed to get role data: ${error.message}`);
    return res.send({ status: 500, message: "Failed to get role data" });
  }
};


export const GetRoles = async (req, res) => {
  try {
    let request = req.body;
    let roles = await  getRoleById({ _id: request?.id });
    if (!roles) {
      return res.json({status:400, message: "Record not found" });
    }
    else{
      if(roles.status === 1){
        roles.status_select={ value: 1, label: 'Active' };
      }else{
        roles.status_select=  { value: 2, label: 'Suspend' };
      }
      roles.no_staff = await getUserCount({ role_id: roles?._id?.toString() }) || 0;
      delete roles.createdAt;
      delete roles.updatedAt;

      return res.json({status:200, data:roles });
    }
  }
  catch(error) {
    console.error(`Failed to find record: ${error.message}`);
    return res.send({ status: 500, message: "Failed to find record" });
  }
};


export const UpdateRoles = async (req, res) => {
  try {
    let request = req.body;
    let roles = await getRoleById({ _id: request.id });

    if (!roles) {
      return res.json({ status: 400, message: "Record not found" });
    }
    delete request?.id;
    let updatedRole = await UpdateRoleDetails({ _id: roles._id }, request);

    if (updatedRole) {
      let notificationResult = await NotificationCreateAndUpdate({
        message: `${Verifyuser.name} is updated the ${roles.rolename} role`,
        CreatedBy: Verifyuser.name,
        role_id: roles._id.toString(),
        navigate: "roles",
      });

      if (notificationResult) {
        return res.json({ status: 200, message: "Successfully updated" });
      } 
    } else {
      return res.json({ status: 500, message: "Failed to update roles" });
    }
  } catch (error) {
    console.error(`Failed to update roles: ${error.message}`);
    return res.send({ status: 500, message: "Failed to update roles" });
  }
};


export const UpdateStatus = async (req, res) => {
  try {
    let request = req.body;
    let roles = await getRoleById({ _id: request.id });

    if (!roles) {
      return res.json({ status: 400, message: "Record not found" });
    }

    await UpdateRoleDetails({ _id: roles._id }, { status: request.status });

    return res.json({ status: 200, message:"successfully updated" });
  } catch (error) {
    console.error(`Failed to update role: ${error.message}`);
    return res.send({ status: 500, message: "Failed to update role" });
  }
};


export const DeleteRoles = async (req, res) => {
  try {
    let request = req.body;
    let roles = await getRoleById({ _id: request.id });

    if (!roles) {
      return res.json({ status: 400, message: "Record not found" });
    }

    let result = await deleteRoleById({ _id: roles._id });

    if (result) {
      return res.json({ status: 200, message: "successfully deleted" });
    } else {
      return res.json({ status: 500, message: "Failed to delete role" });
    }
  } catch (error) {
    console.error(`Failed to delete role: ${error.message}`);
    return res.send({ status: 500, message: "Failed to delete role" });
  }
};


export const GetActiveRoles = async (req, res) => {
  try {
    let projection = {
      rolename: 1
    };
    let roles = await getAllRoleDetails({ status: 1 },projection);

    roles = roles.map(({ _id, ...rest }) => ({ id: _id, ...rest }));

    if (roles) {
      res.json({ status: 200, data: roles });
    } else {
      res.json({ status: 400, message: "record not found" });
    }
  } catch (error) {
    console.error(`Failed to find record: ${error.message}`);
    return res.send({ status: 500, message: "Failed to find record" });
  }
};



