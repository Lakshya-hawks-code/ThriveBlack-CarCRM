import { getAllOrdersDetails } from '../Model/OrdersModel.js';
import { getUserById } from "../Model/AdminModel.js";
import moment from "moment";



//get the total number of customer which we used in dashboard function
const GetCustomerNumberRecord = async () => {
    try {
        let orders = await getAllOrdersDetails({});
        let ordersByEmail = {};

        // Group the orders by email address
        orders.forEach((order) => {
            if (!ordersByEmail[order?.email]) {
                ordersByEmail[order?.email] = [];
            }
            ordersByEmail[order?.email].push(order);
        });

        let numberOfCustomers = Object.keys(ordersByEmail).length;

        return numberOfCustomers;
    } catch (error) {
        console.error(`Failed to get number of Customers: ${error.message}`);
        throw error;
    }
};

//get the total number of orders which we used in dashboard function
const getTotalOrders = async () => {
    try {
        let orders = await getAllOrdersDetails({});
        let totalOrders = orders?.length;
        return totalOrders;
    } catch (error) {
        console.error(`Failed to get number of Orders: ${error.message}`);
        throw error;
    }
};
const getTotalDriverOrders = async (request) => {
    try {
        let filter = { driver_id: request?.driver_id }
        let orders = await getAllOrdersDetails(filter);
        let totalOrders = orders?.length;
        return totalOrders;
    } catch (error) {
        console.error(`Failed to get number of Orders: ${error.message}`);
        throw error;
    }
};

const getTotalDriverAmount = async (request) => {
    try {
        let filter = { driver_id: request?.driver_id }
        let orders = await getAllOrdersDetails(filter);
        let totalAssignAmount = orders.reduce((total, order) => {
            return total + parseFloat(order.assignamount);
        }, 0);

        return totalAssignAmount;
    } catch (error) {
        console.error(`Failed to get total assign amount: ${error.message}`);
        throw error;
    }
};


const getTotalCompleteDriverOrders = async (request) => {
    try {
        let filter = { book_status: 1 }
        let orders = await getAllOrdersDetails(filter);
        let totalOrders = orders?.length;
        return totalOrders;
    } catch (error) {
        console.error(`Failed to get number of Orders: ${error.message}`);
        throw error;
    }
};

//get the total number of booking of particular driver by driver_id
const getTotalBooking = async () => {
    try {
        let user = await getUserById({ _id: Verifyuser?._id });

        if (!user) {
            throw new Error('User not found');
        }

        let orders = await getAllOrdersDetails({ driver_id: user?._id?.toString() });
        let totalOrders = orders?.length;

        return totalOrders;
    } catch (error) {
        console.error(`Failed to get the number of Orders: ${error.message}`);
        throw error;
    }
};

//get the total number of orders where the transaction_id is not empty
const getTotalOrdersWithTransaction = async () => {
    try {
        let orders = await getAllOrdersDetails({ transcation_id: { $ne: "" } });
        let totalOrders = orders?.length;
        return totalOrders;
    } catch (error) {
        console.error(`Failed to get number of Orders with transaction_id: ${error.message}`);
        throw error;
    }
};

//get the total number of bookings of particular driver where the transaction_id is not empty
const getTotalBookingWithTransaction = async () => {
    try {
        let user = await getUserById({ _id: Verifyuser?._id });

        if (!user) {
            throw new Error('User not found');
        }

        let orders = await getAllOrdersDetails({
            driver_id: user?._id.toString(),
            transcation_id: { $ne: "" }
        });

        let totalOrders = orders?.length;

        return totalOrders;
    } catch (error) {
        console.error(`Failed to get the number of Orders: ${error.message}`);
        throw error;
    }
};

//get the total number of orders where the transaction_id is  empty
const getTotalOrdersWithoutTransaction = async () => {
    try {
        let orders = await getAllOrdersDetails({ transcation_id: "" });
        let totalOrders = orders?.length;
        return totalOrders;
    } catch (error) {
        console.error(`Failed to get number of Orders with transaction_id: ${error.message}`);
        throw error;
    }
};


const getCurrentWeekStart = () => {
    let now = new Date();
    let startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
};

const getCurrentWeekEnd = () => {
    let now = new Date();
    let endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    return endOfWeek;
};

// Function to get the total number of orders based on weekdays
const getTotalOrdersByWeekday = async () => {
    try {
        let startOfWeek = getCurrentWeekStart();
        let endOfWeek = getCurrentWeekEnd();

        let orders = await getAllOrdersDetails({
            createdAt: {
                $gte: startOfWeek,
                $lte: endOfWeek,
            },
        });

        let ordersByWeekday = [0, 0, 0, 0, 0, 0, 0];

        orders.forEach((order) => {
            let day = new Date(order?.createdAt).getDay();
            ordersByWeekday[day] += 1;
        });

        return ordersByWeekday;
    } catch (error) {
        console.error(`Failed to get the number of Orders by weekday: ${error.message}`);
        throw error;
    }
};

const getCustomerCountByWeekday = async () => {
    try {
        let startOfWeek = getCurrentWeekStart();
        let endOfWeek = getCurrentWeekEnd();

        let orders = await getAllOrdersDetails({
            createdAt: {
                $gte: startOfWeek,
                $lte: endOfWeek,
            },
        });

        let customerCountByWeekday = [0, 0, 0, 0, 0, 0, 0];
        let uniqueCustomersByEmail = {};

        // Count unique customers by email for each weekday
        orders.forEach((order) => {
            let day = new Date(order?.createdAt).getDay();

            // Check if the email is unique for this week
            if (!uniqueCustomersByEmail[order?.email]) {
                customerCountByWeekday[day] += 1;
                uniqueCustomersByEmail[order?.email] = true;
            }
        });

        return customerCountByWeekday;
    } catch (error) {
        console.error(`Failed to get the number of Customers by weekday: ${error.message}`);
        throw error;
    }
};


// Function to get the total number of orders based on weekdays where transaction_id is not empty
const getTotalOrdersByWeekdayWithTransaction = async () => {
    try {
        let startOfWeek = getCurrentWeekStart();
        let endOfWeek = getCurrentWeekEnd();

        let orders = await getAllOrdersDetails({
            transcation_id: { $ne: "" },
            createdAt: {
                $gte: startOfWeek,
                $lte: endOfWeek,
            },
        });

        let ordersByWeekdayWithTransaction = [0, 0, 0, 0, 0, 0, 0];

        orders.forEach((order) => {
            let day = new Date(order?.createdAt).getDay();
            ordersByWeekdayWithTransaction[day] += 1;
        });

        return ordersByWeekdayWithTransaction;
    } catch (error) {
        console.error(`Failed to get the number of Orders by weekday with transaction_id: ${error.message}`);
        throw error;
    }
};


export const Dashboard = async (req, res) => {
    try {
        let numberOfCustomers = await GetCustomerNumberRecord();

        let totalOrders = await getTotalOrders();

        let totalTransactionorders = await getTotalOrdersWithTransaction();

        let customerCountByWeekday = await getCustomerCountByWeekday();

        let ordersByWeekday = await getTotalOrdersByWeekday();

        let ordersByWeekdayWithTransaction = await getTotalOrdersByWeekdayWithTransaction();

        res.json({ status: 200, data: { totalCustomers: numberOfCustomers, totalLead: totalOrders, totalPaidOrders: totalTransactionorders, monthCustomers: customerCountByWeekday, monthLeadOrders: ordersByWeekday, monthPaidOrders: ordersByWeekdayWithTransaction } });
    } catch (error) {
        console.error(`Failed to get  data: ${error.message}`);
        return res.send({ status: 500, data: { totalCustomers: [], totalLead: [], totalPaidOrders: [], monthCustomers: [], monthLeadOrders: [], monthPaidOrders: [] } });
    }
};



// Function to get the total number of orders based on each month in the current year
const getTotalOrdersByMonth = async () => {
    try {
        let currentYear = new Date().getFullYear();
        let currentMonth = new Date().getMonth();

        let orders = await getAllOrdersDetails({
            createdAt: {
                $gte: new Date(currentYear, 0, 1), // January 1st of the current year
                $lte: new Date(currentYear, currentMonth, 31, 23, 59, 59, 999), // Up to the current month
            },
        });

        let ordersByMonth = new Array(12).fill(0); // Initialize an array with 12 months set to 0

        orders.forEach((order) => {
            let month = new Date(order?.createdAt).getMonth();
            ordersByMonth[month]++;
        });

        return ordersByMonth;
    } catch (error) {
        console.error(`Failed to get the number of Orders by month: ${error.message}`);
        throw error;
    }
};

const getTotalDriverOrdersByMonth = async (request) => {
    try {
        let currentYear = new Date().getFullYear();
        let currentMonth = new Date().getMonth();

        let orders = await getAllOrdersDetails({
            driver_id: request?.driver_id,
            createdAt: {
                $gte: new Date(currentYear, 0, 1), // January 1st of the current year
                $lte: new Date(currentYear, currentMonth, 31, 23, 59, 59, 999), // Up to the current month
            },
        });

        let ordersByMonth = new Array(12).fill(0); // Initialize an array with 12 months set to 0

        orders.forEach((order) => {
            let month = new Date(order?.createdAt).getMonth();
            ordersByMonth[month]++;
        });

        return ordersByMonth;
    } catch (error) {
        console.error(`Failed to get the number of Orders by month: ${error.message}`);
        throw error;
    }
};

const getTotalDriverCompleteOrdersByMonth = async (request) => {
    try {
        let currentYear = new Date().getFullYear();
        let currentMonth = new Date().getMonth();

        let orders = await getAllOrdersDetails({
            driver_id: request?.driver_id,
            book_status: 1,
            createdAt: {
                $gte: new Date(currentYear, 0, 1), // January 1st of the current year
                $lte: new Date(currentYear, currentMonth, 31, 23, 59, 59, 999), // Up to the current month
            },
        });

        let ordersByMonth = new Array(12).fill(0); // Initialize an array with 12 months set to 0

        orders.forEach((order) => {
            let month = new Date(order?.createdAt).getMonth();
            ordersByMonth[month]++;
        });

        return ordersByMonth;
    } catch (error) {
        console.error(`Failed to get the number of Orders by month: ${error.message}`);
        throw error;
    }
};

// Function to get the total number of orders based on each month where transaction_id is not empty
const getTotalOrdersWithTransactionByMonth = async () => {
    try {
        let currentYear = new Date().getFullYear();
        let currentMonth = new Date().getMonth();

        let orders = await getAllOrdersDetails({
            transcation_id: { $ne: "" },
            createdAt: {
                $gte: new Date(currentYear, 0, 1), // January 1st of the current year
                $lte: new Date(currentYear, currentMonth, 31, 23, 59, 59, 999), // Up to the current month
            },
        });

        let ordersByMonth = new Array(12).fill(0);

        orders.forEach((order) => {
            let month = new Date(order?.createdAt).getMonth();
            ordersByMonth[month]++;
        });

        return ordersByMonth;
    } catch (error) {
        console.error(`Failed to get the total number of orders with transaction_id by month: ${error.message}`);
        throw error;
    }
};


//function to get the total numbers of orders where transaction_id is empty
const getTotalBookingWithoutTransaction = async () => {
    try {
        let user = await getUserById({ _id: Verifyuser?._id });

        if (!user) {
            throw new Error('User not found');
        }

        let orders = await getAllOrdersDetails({ driver_id: user._id.toString(), transcation_id: "" });

        let totalOrders = orders.length;

        return totalOrders;
    } catch (error) {
        console.error(`Failed to get the number of Orders: ${error.message}`);
        throw error;
    }
};


export const GetOrdersByMonth = async (req, res) => {
    try {
        let totalOrders = await getTotalOrdersByMonth();
        let totalordersWeekday = await getTotalOrdersByWeekday();
        let totalpaidordersWeekday = await getTotalOrdersByWeekdayWithTransaction();

        res.json({ status: 200, data: { user_activity: { totalorders: totalordersWeekday, totalPaidOrders: totalpaidordersWeekday }, totalorders: totalOrders } });
    } catch (error) {
        console.error(`Failed to get data: ${error.message}`);
        return res.send({ status: 500, data: { user_activity: { totalorders: [], totalPaidOrders: [] }, totalorders: [] } });
    }
};



const getTotalOrdersWithFuturePickupDate = async () => {
    try {
        let currentDate = new Date();
        // let startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        let orders = await getAllOrdersDetails();
        orders = orders.filter(order => {
            let [year, month, day] = order?.pikup_date.split('-');
            let pickupDate = new Date(`20${year}-${month}-${day}T00:00:00Z`);

            return pickupDate >= currentDate;
        });

        let totalOrdersWithFuturePickupDate = orders?.length;

        return totalOrdersWithFuturePickupDate;
    } catch (error) {
        console.error(`Failed to get the total number of orders with future pickup_date: ${error.message}`);
        throw error;
    }
};

const getTotalDriverOrdersWithFuturePickupDate = async (request) => {
    try {
        let filter = { driver_id: request?.driver_id }
        let currentDate = new Date();
        // let startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        let orders = await getAllOrdersDetails(filter);
        orders = orders.filter(order => {
            let [year, month, day] = order?.pikup_date.split('-');
            let pickupDate = new Date(`20${year}-${month}-${day}T00:00:00Z`);
            return pickupDate >= currentDate;
        });

        let totalOrdersWithFuturePickupDate = orders?.length;

        return totalOrdersWithFuturePickupDate;
    } catch (error) {
        console.error(`Failed to get the total number of orders with future pickup_date: ${error.message}`);
        throw error;
    }
};


export const AnalyticsGraph = async (req, res) => {
    try {
        let request = req.body;
        if (request?.driver_id === "") {
            let TotalOrdersBymonths = await getTotalOrdersByMonth();
            let TotalPaidOrdersbyMonths = await getTotalOrdersWithTransactionByMonth();
            let TotalLeads = await getTotalOrdersWithFuturePickupDate();
            let TotalUnpaidOrders = await getTotalOrdersWithoutTransaction();
            let TotalPaidOrders = await getTotalOrdersWithTransaction();
            let TotalOrders = await getTotalOrders();

            res.json({ status: 200, analytic: { totalOrders: TotalOrdersBymonths, PaidOrders: TotalPaidOrdersbyMonths }, Counts: { totalLeads: TotalLeads, totalPaidOrders: TotalPaidOrders, totalUnpaidOrders: TotalUnpaidOrders, totalOrders: TotalOrders } });
        }
        else {
            let DriverOrdersByMonths = await getTotalDriverOrdersByMonth(request);
            let DriverCompleteOrdersByMonths = await getTotalDriverCompleteOrdersByMonth(request);
            let TotalDriverOrders = await getTotalDriverOrders(request);
            let TotalDriverAmount = await getTotalDriverAmount(request);
            let TotalDriverCompleteOrders = await getTotalCompleteDriverOrders(request);
            let TotalDriverUpcomingLeads = await getTotalDriverOrdersWithFuturePickupDate(request)
            res.json({ status: 200, analytic: { totalOrders: DriverOrdersByMonths, PaidOrders: DriverCompleteOrdersByMonths }, Counts: { totalOrders: TotalDriverOrders, totalAmount: TotalDriverAmount, totalcompleteorders: TotalDriverCompleteOrders, totalUpcomingleads: TotalDriverUpcomingLeads } });
        }

    } catch (error) {
        console.log(`Failed to get  data: ${error.message}`);
        return res.send({ status: 200, analytic: { totalOrders: [], PaidOrders: [] }, Counts: { totalLeads: [], totalPaidOrders: [], totalUnpaidOrders: [], totalOrders: [] } });
    }
};


//function to get the total number of upcoming booking
const getUpcomingBooking = async () => {
    try {
        let user = await getUserById({ _id: Verifyuser?._id });

        if (!user) {
            throw new Error('User not found');
        }
        const currentDate = new Date();

        let orders = await getAllOrdersDetails({
            driver_id: user?._id?.toString(),
            pikup_date: { $gt: moment(currentDate).format('YY-MM-DD') },
        });

        let totalOrders = orders?.length;

        return totalOrders;
    } catch (error) {
        console.error(`Failed to get the number of upcoming booking: ${error.message}`);
        throw error;
    }
};

//function to get the total number of done booking
const getDoneBooking = async () => {
    try {
        let user = await getUserById({ _id: Verifyuser?._id });

        if (!user) {
            throw new Error('User not found');
        }
        const currentDate = new Date();

        let orders = await getAllOrdersDetails({
            driver_id: user?._id?.toString(),
            pikup_date: { $lt: moment(currentDate).format('YY-MM-DD') },
        });

        let totalOrders = orders?.length;

        return totalOrders;
    } catch (error) {
        console.error(`Failed to get the number of upcoming booking: ${error.message}`);
        throw error;
    }
};



export async function GetBooking(req, res) {
    try {
        let request = req.body
        let user = await getUserById({ _id: Verifyuser?._id });
        if (!user) {
            return res.json({ status: 400, message: "User not found" });
        }
        if (user.user_type === 2) {
            let filter = { driver_id: user?._id?.toString() };

            if (request?.search) {
                filter.$or = [
                    { first_name: { $regex: new RegExp(request?.search, "i") } },
                    { last_name: { $regex: new RegExp(request?.search, "i") } },
                    { email: { $regex: new RegExp(request?.search, 'i') } },
                ];
            }
            if (request?.start_date && request?.end_date) {
                let startDate = moment(request?.start_date).startOf("day").utc();
                let endDate = moment(request?.end_date).endOf("day").utc();

                filter.createdAt = {
                    $gte: startDate.toDate(),
                    $lte: endDate.toDate(),
                };
            }
            let Bookings = await getAllOrdersDetails(filter);
            if (Bookings) {
                let filteredBookings = Bookings.map((booking) => {
                    let filteredOrder = {
                        id: booking?._id,
                        customer: `${booking?.first_name} ${booking?.last_name}`,
                        email: booking?.email,
                        phone: booking?.phone,
                        specialNote: booking?.aditional_info,
                        pickupDate: moment(booking?.pikup_date, 'YY-MM-DD').format('YYYY-MM-DD'),
                        pickupLocation: booking?.from_location_name,
                        toLocation: booking?.to_location_name,
                        bookingCar: booking?.car_type,
                        bookingType: booking?.type,
                        luggage: booking?.num_luggage,
                        passengers: booking?.num_passengers,
                        is_passengers: booking?.is_passenger,
                        passengersdetails: "",
                        // Conditionally add passengersDetails based on other_pass_name and other_pass_phone
                        passengersdetails: booking?.other_pass_name && booking?.other_pass_phone
                            ? `Passenger Name:-${booking?.other_pass_name}, Passenger Phone:-${booking?.other_pass_phone}`
                            : "",
                        returnBook: booking?.book_return,
                        returndate: booking?.returndate,
                        returntime: booking?.returntime,
                        returnflight: booking?.returnflight,
                        flightDetails: booking?.flight_number,
                        bookingCreatedAt: booking?.createdAt,
                        order_id: booking?.order_id,
                        adminnote: booking?.adminnote,
                        driver_note: booking?.driver_note,
                        booking_status: booking?.book_status,
                    };
                    // Conditionally add passengersDetails based on other_pass_name and other_pass_phone
                    if (booking?.other_pass_name && booking?.other_pass_phone) {
                        filteredOrder.passengersdetails = `Passenger Name:-${booking?.other_pass_name}, Passenger Phone:-${booking?.other_pass_phone}`;
                    }
                    return filteredOrder;
                });
                let getTotalbooking = await getTotalBooking();
                let getTotalUpcomingBooking = await getUpcomingBooking();
                let getTotalDoneBooking = await getDoneBooking();
                filteredBookings.sort((a, b) => b.bookingCreatedAt - a.bookingCreatedAt);
                return res.json({ status: 200, totalbooking: getTotalbooking, totalupcoming: getTotalUpcomingBooking, totaldonebooking: getTotalDoneBooking, data: filteredBookings });
            } else {
                return res.json({ status: 400, message: "Booking is not Found" });
            }
        }
        else {
            return res.json({ status: 400, message: "Booking is not Found" });
        }
    } catch (error) {
        console.error(`Failed to find Booking: ${error.message}`);
        return res.send({ status: 500, message: "Failed to find Booking" });
    }
};