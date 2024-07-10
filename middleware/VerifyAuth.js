import { getUserById } from '../Model/AdminModel.js';

export const userAuth = async (req, res, next) => {
  if (!req.headers.authorization) {
    return res.json({ status: 400, message: "Authorization header is missing" });
  }
  let userToken = req.headers['authorization'];
  if (!userToken) {
    return res.json({ status: 400, message: "Token is missing" });
  }
  let Verify = await getUserById({ token: userToken });

  if (!Verify) {
    return res.json({ status: 401, message: "Token is not matched" });
  }
  req["VerifyAuth"] = Verify.name;
  global.Verifyuser = Verify;
  global.DBNAME = "ThriveBlackCarCRM";
  next();
};



