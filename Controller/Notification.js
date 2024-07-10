import {getAllNotifications,} from "../Model/NotificationModel.js";
import { getUserById } from "../Model/AdminModel.js";

/* global Verifyuser */


export const Notification = async (req, res) => {
    try {
        let userDetails = await getUserById({ _id: Verifyuser?._id });
        if (userDetails) {
            let userNotification = await getAllNotifications({ ReceiverId: userDetails?._id });
            let userNotification_byrole = await getAllNotifications({ role_id: userDetails?.role_id });
            let driver_notification = [];
            
            // Include driver_notification only when user_type is 2
            if (Verifyuser.user_type === 2) {
                driver_notification = await getAllNotifications({ driver_id: Verifyuser?._id.toString() });
            }
            let userNotification_byorder=[];
            if (Verifyuser.user_type === 1) {
                userNotification_byorder = await getAllNotifications({ ReceiverId: { $exists: false }, role_id: { $exists: false },driver_id: { $exists: false } });
            }
            let mainarray = [...userNotification, ...userNotification_byrole, ...userNotification_byorder, ...driver_notification];

            mainarray.sort((a, b) => b.createdAt - a.createdAt);
            mainarray = mainarray.slice(0, 10);

            let fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000); // Calculate 5 minutes ago

            let fiveminutesagonotifications = mainarray.filter(notification =>
                notification.createdAt >= fiveMinutesAgo &&
                ((notification.ReceiverId && notification.ReceiverId.toString() === userDetails?._id) ||
                (notification.driver_id && notification.driver_id === userDetails?._id.toString()))
            );

            // Check if there are notifications matching role_id created 5 minutes ago
            let roleNotifications = await getAllNotifications({
                role_id: userDetails?.role_id,
                createdAt: { $gte: fiveMinutesAgo },
            });

            let status = fiveminutesagonotifications.length > 0 || roleNotifications.length > 0;

            return res.json({ status: 200, data: { Notification: mainarray, Status: status } });
        } else {
            return res.json({ status: 400, data: { Count: [], Notification: [] } });
        }
    } catch (error) {
        console.error(`Failed to get notifications: ${error.message}`);
        return res.send({ status: 500, message: "Failed to get notifications" });
    }
};




