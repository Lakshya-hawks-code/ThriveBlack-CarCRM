import express from "express";
const router = express.Router();
import Auth from "../Mobile/Controller/Login.js"
import LocationController from "../Mobile/Controller/Location.js"

router.post('/Login', Auth.Login)
router.post('/otp-verification', Auth.OtpVerification)


router.post('/get_driver_location', LocationController.UpdateDriverLocation)


export default router;
