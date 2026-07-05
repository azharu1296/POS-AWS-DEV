const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken'); // 🔑 टोकन बनाने के लिए भाई
const bcrypt = require('bcrypt'); // 🔒 पासवर्ड एन्क्रिप्शन के लिए भाई
const nodemailer = require('nodemailer'); // 📧 ईमेल लीड अलर्ट भेजने के लिए भाई

const app = express();
app.use(express.json());
app.use(cors());

// 📂 स्टेटिक फाइल्स को लोड करें
app.use(express.static('public'));

// 🔑 सीक्रेट की - सुपर एडमिन टोकन के लिए भाई
const JWT_SECRET = "AzeeTechSuperSecretKey@2026"; 

// 🗄️ तुम्हारी असली और 100% सही मोंगोडीबी लिंक (🔒)
const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/pos_database";

mongoose.connect(mongoURI)
    .then(() => console.log('🟢 MongoDB Connected Live, Dynamic SaaS Engine & Takeaway Shield Connected!'))
    .catch(err => console.error('🔴 MongoDB Connection Error:', err));

// ==========================================
// 👑 [सुरक्षा कवच]: SUPER ADMIN SCHEMA & MIDDLEWARE
// ==========================================
const SuperAdminSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    passwordHash: { type: String, required: true },
    role: { type: String, default: 'SuperAdmin' }
});
const SuperAdmin = mongoose.model('SuperAdmin', SuperAdminSchema);

const verifyAdminToken = (req, res, next) => {
    let token = req.headers['authorization'];
    if (!token) return res.status(401).json({ success: false, message: "Access Denied! Login required." });

    try {
        if (token.startsWith('Bearer ')) {
            token = token.split(" ")[1];
        }
        const verified = jwt.verify(token, JWT_SECRET);
        req.adminUser = verified;
        next();
    } catch (err) {
        res.status(403).json({ success: false, message: "Invalid or Expired Token! ❌" });
    }
};

// ==========================================
// 📝 DYNAMIC HOTEL SCHEMA (FSSAI, लोगो, टैक्स और प्रिंट काउंटर अपग्रेड भाई)
// ==========================================
const HotelSchema = new mongoose.Schema({
    name: String,
    ownerEmail: { type: String, unique: true },
    ownerPass: String,
    ownerUpiId: { type: String, default: "" }, 
    status: { type: String, default: 'Active' }, 
    planType: { type: String, default: 'Monthly' }, 
    setupCharge: { type: Number, default: 0 }, 
    amountPaid: { type: Number, default: 0 },  
    paymentMode: { type: String, default: 'Cash' },
    subscriptionEnd: Date,
    isAnalyticsEnabled: { type: Boolean, default: false }, 
    
    // 🔒 [नया प्रीमियम रिमोट कंट्रोल]: फीचर्स ऑन/ऑफ करने के ताले
    isMenuEnabled: { type: Boolean, default: true },
    isWaiterEnabled: { type: Boolean, default: true },
    isQRGenerationEnabled: { type: Boolean, default: true },
    
    // 🖨️ [११-पॉइंट्स मास्टर]: सुपर एडमिन के लिए प्रिंट काउंटर ट्रैकर
    totalPrintsCount: { type: Number, default: 0 },

    // 🧾 [११-पॉइंट्स मास्टर]: FSSAI और होटल लोगो फ़ील्ड्स (Optional)
    fssaiNumber: { type: String, default: "" },
    hotelLogoUrl: { type: String, default: "" },

    // ⚙️ [११-पॉइंट्स मास्टर]: कस्टमाइज़्ड टैक्स कस्टमाइज़ेशन टॉगल स्विच
    isGstEnabled: { type: Boolean, default: false },
    isServiceChargeEnabled: { type: Boolean, default: false },
    serviceChargePercent: { type: Number, default: 0 },
    
    // 📣 [११-पॉइंट्स मास्टर]: सोशल मीडिया प्रोमो लिंक्स इनपुट
    instagramLink: { type: String, default: "" },
    facebookLink: { type: String, default: "" },
    googleReviewLink: { type: String, default: "" },

    // 🍴 ओरिजINAL मेनू एरे
    menu: [{ name: String, price: Number, superCategory: String, subCategory: String }],
    
    // 📁 डायनेमिक कैटेगरी लिस्ट स्टोर रूम
    customSuperCategories: { type: [String], default: ["Veg", "Non-Veg", "Egg", "Cafe"] },
    customSubCategories: [{
        superCategory: String,
        subCategoryName: String
    }],

    qrCodes: [{ tableNumber: String, qrLinkUrl: String, generatedAt: { type: Date, default: Date.now } }],
    address: { type: String, default: "Your Cafe Address Here" },
    phone: { type: String, default: "9999999999" },
    gstin: { type: String, default: "NOT REGISTERED" },
    taxPercent: { type: Number, default: 0 },
    pocName: { type: String, default: "Hotel Owner" }, 
    pocPhone: { type: String, default: "9999999999" }, 
    totalTables: { type: Number, default: 15 },
    lastAssignedBillNumber: { type: Number, default: 1000 }, 
    waiters: [{ waiterName: String, waiterPin: String, createdAt: { type: Date, default: Date.now } }]
});
const Hotel = mongoose.model('Hotel', HotelSchema);

// ==========================================
// 🛍️ DYNAMIC ORDER SCHEMA (डिस्काउंट ट्रैकर अपग्रेड भाई)
// ==========================================
const OrderSchema = new mongoose.Schema({
    hotelId: mongoose.Schema.Types.ObjectId,
    tableNumber: { type: String, default: "" }, 
    orderType: { type: String, default: "Dining" }, // 📍 "Dining" या 🛍️ "Takeaway"
    billNumber: { type: String, default: "0000" }, 
    customerName: { type: String, default: 'Guest User' }, 
    customerPhone: { type: String, default: 'N/A' },      
    items: [{ name: String, price: Number, quantity: Number }],
    
    // 🏷️ [११-पॉइंट्स मास्टर]: डायनेमिक डिस्काउंट इंजन डेटा सिंक
    discountAmount: { type: Number, default: 0 },
    finalPaidAmount: { type: Number, default: 0 },

    status: { type: String, default: 'Pending' }, 
    servedByWaiter: { type: String, default: "Self Order" }, 
    createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', OrderSchema);

const EnquirySchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: String,
    createdAt: { type: Date, default: Date.now }
});
const Enquiry = mongoose.model('Enquiry', EnquirySchema);

// ==========================================
// 🔐 SUPER ADMIN CONFIGURATION ROUTES
// ==========================================
app.get('/api/super/setup-master-admin', async (req, res, next) => {
    try {
        const adminExists = await SuperAdmin.findOne({ email: "admin@azeetech.com" });
        if (adminExists) return res.send("<h3>Master Admin account already exists in Database!</h3>");

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("Azhar@999", salt);

        const masterAdmin = new SuperAdmin({
            name: "Azhar Shaikh",
            email: "admin@azeetech.com",
            passwordHash: hashedPassword
        });
        await masterAdmin.save();
        res.send("<h3>🟢 Master Super Admin Account Created Live inside MongoDB!</h3>");
    } catch (err) { next(err); }
});

app.post('/api/super/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const admin = await SuperAdmin.findOne({ email });
        if (!admin) return res.json({ success: false, message: "Invalid Admin Credentials ❌" });

        const validPass = await bcrypt.compare(password, admin.passwordHash);
        if (!validPass) return res.json({ success: false, message: "Invalid Admin Credentials ❌" });

        const token = jwt.sign({ _id: admin._id, name: admin.name }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ success: true, token, name: admin.name });
    } catch (err) { next(err); }
});

app.get('/api/super/hotels', verifyAdminToken, async (req, res, next) => {
    try { const hotels = await Hotel.find({}); res.json(hotels); } 
    catch (err) { next(err); }
});

app.post('/api/super/add-hotel', verifyAdminToken, async (req, res, next) => {
    try {
        const { name, email, password, planType, setupCharge, amountPaid, paymentMode, isAnalyticsEnabled, isMenuEnabled, isWaiterEnabled, isQRGenerationEnabled, pocName, pocPhone, address, totalTables } = req.body;
        let durationDays = 30;
        if (planType === '6-Months') durationDays = 180;
        if (planType === 'Yearly') durationDays = 365;
        const subEnd = new Date(+new Date() + durationDays*24*60*60*1000);

        const finalTablesCount = (totalTables !== undefined && totalTables !== null) ? Number(totalTables) : 15;

        const newHotel = new Hotel({ 
            name, ownerEmail: email, ownerPass: password, planType,
            setupCharge: Number(setupCharge), amountPaid: Number(amountPaid),
            paymentMode, subscriptionEnd: subEnd, menu: [], qrCodes: [], waiters: [],
            isAnalyticsEnabled: isAnalyticsEnabled || false,
            isMenuEnabled: isMenuEnabled !== undefined ? isMenuEnabled : true,
            isWaiterEnabled: isWaiterEnabled !== undefined ? isWaiterEnabled : true,
            isQRGenerationEnabled: isQRGenerationEnabled !== undefined ? isQRGenerationEnabled : true,
            pocName: pocName || "Hotel Owner",
            pocPhone: pocPhone || "9999999999",
            address: address || "Your Cafe Address Here",
            totalTables: finalTablesCount
        });
        await newHotel.save();
        res.json({ success: true, message: `Hotel '${name}' activated live successfully!` });
    } catch (err) { res.status(400).json({ success: false, message: "Registration failed: Email already exists!" }); }
});

// 📊 [सुपर एडमिन]: लाइव प्रिंट काउंटर को ट्रैक करने का जरिया
app.post('/api/orders/increment-print', async (req, res, next) => {
    try {
        const { hotelId } = req.body;
        const hotel = await Hotel.findById(hotelId);
        if (!hotel) return res.status(404).json({ success: false, message: "Hotel not found!" });
        
        hotel.totalPrintsCount = (hotel.totalPrintsCount || 0) + 1;
        await hotel.save();
        res.json({ success: true, totalPrints: hotel.totalPrintsCount });
    } catch (err) { next(err); }
});

app.post('/api/super/toggle-analytics', verifyAdminToken, async (req, res, next) => {
    try {
        const hotel = await Hotel.findById(req.body.hotelId);
        hotel.isAnalyticsEnabled = !hotel.isAnalyticsEnabled;
        await hotel.save(); res.json({ success: true, isAnalyticsEnabled: hotel.isAnalyticsEnabled });
    } catch (err) { next(err); }
});

app.post('/api/super/toggle-menu-access', verifyAdminToken, async (req, res, next) => {
    try {
        const hotel = await Hotel.findById(req.body.hotelId);
        hotel.isMenuEnabled = !hotel.isMenuEnabled;
        await hotel.save(); res.json({ success: true, isMenuEnabled: hotel.isMenuEnabled });
    } catch (err) { next(err); }
});

app.post('/api/super/toggle-waiter-access', verifyAdminToken, async (req, res, next) => {
    try {
        const hotel = await Hotel.findById(req.body.hotelId);
        hotel.isWaiterEnabled = !hotel.isWaiterEnabled;
        await hotel.save(); res.json({ success: true, isWaiterEnabled: hotel.isWaiterEnabled });
    } catch (err) { next(err); }
});

app.post('/api/super/toggle-qr-access', verifyAdminToken, async (req, res, next) => {
    try {
        const hotel = await Hotel.findById(req.body.hotelId);
        hotel.isQRGenerationEnabled = !hotel.isQRGenerationEnabled;
        await hotel.save(); res.json({ success: true, isQRGenerationEnabled: hotel.isQRGenerationEnabled });
    } catch (err) { next(err); }
});

app.post('/api/super/toggle-status', verifyAdminToken, async (req, res, next) => {
    try {
        const hotel = await Hotel.findById(req.body.hotelId);
        hotel.status = hotel.status === 'Active' ? 'Blocked' : 'Active';
        await hotel.save(); res.json({ success: true, status: hotel.status });
    } catch (err) { next(err); }
});

app.post('/api/super/update-hotel', verifyAdminToken, async (req, res, next) => {
    try {
        const { hotelId, name, ownerEmail, ownerPass, pocName, pocPhone, address, totalTables, isMenuEnabled, isWaiterEnabled, isQRGenerationEnabled } = req.body;
        const finalTablesCount = (totalTables !== undefined && totalTables !== null) ? Number(totalTables) : 15;

        await Hotel.findByIdAndUpdate(hotelId, { 
            name, ownerEmail, ownerPass, pocName, pocPhone, address, 
            totalTables: finalTablesCount,
            isMenuEnabled: isMenuEnabled,
            isWaiterEnabled: isWaiterEnabled,
            isQRGenerationEnabled: isQRGenerationEnabled
        });
        res.json({ success: true, message: "Hotel profile updated live successfully!" });
    } catch (err) { next(err); }
});

app.post('/api/super/renew-hotel', verifyAdminToken, async (req, res, next) => {
    try {
        const { hotelId, planType, amountPaid, paymentMode } = req.body;
        const hotel = await Hotel.findById(hotelId);
        if (!hotel) return res.status(404).json({ success: false, message: "Hotel not found" });

        let durationDays = 30;
        if (planType === '6-Months') durationDays = 180;
        if (planType === 'Yearly') durationDays = 365;

        const currentSubEnd = hotel.subscriptionEnd ? new Date(hotel.subscriptionEnd) : new Date();
        const baseDate = new Date() > currentSubEnd ? new Date() : currentSubEnd;
        const newSubEnd = new Date(+baseDate + durationDays*24*60*60*1000);
        const newTotalAmount = (hotel.amountPaid || 0) + Number(amountPaid);

        await Hotel.findByIdAndUpdate(hotelId, {
            subscriptionEnd: newSubEnd, planType: planType, amountPaid: newTotalAmount, paymentMode: paymentMode, status: 'Active' 
        });
        res.json({ success: true, message: "Subscription renewed successfully!" });
    } catch (err) { next(err); }
});

app.delete('/api/super/delete-hotel/:id', verifyAdminToken, async (req, res, next) => {
    try {
        await Hotel.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Hotel Removed Permanently!" });
    } catch (err) { next(err); }
});

app.get('/api/super/enquiries', verifyAdminToken, async (req, res, next) => {
    try {
        const leads = await Enquiry.find({}).sort({ createdAt: -1 });
        res.json(leads);
    } catch (err) { next(err); }
});

// ==========================================
// 📁 DYNAMIC CATEGORY MANAGEMENT ROUTES
// ==========================================
app.post('/api/owner/add-category', async (req, res, next) => {
    try {
        const { hotelId, superCategory, subCategoryName } = req.body;
        const hotel = await Hotel.findById(hotelId);
        if(!hotel) return res.status(404).json({ success: false });

        if(superCategory && !hotel.customSuperCategories.includes(superCategory)) {
            hotel.customSuperCategories.push(superCategory);
        }
        if(subCategoryName) {
            hotel.customSubCategories.push({ superCategory, subCategoryName });
        }
        await hotel.save();
        res.json({ success: true, superCategories: hotel.customSuperCategories, subCategories: hotel.customSubCategories });
    } catch (err) { next(err); }
});

app.post('/api/owner/delete-category', async (req, res, next) => {
    try {
        const { hotelId, superCategory, subCategoryName } = req.body;
        const hotel = await Hotel.findById(hotelId);
        if(!hotel) return res.status(404).json({ success: false });

        if(subCategoryName) {
            hotel.customSubCategories = hotel.customSubCategories.filter(s => !(s.superCategory === superCategory && s.subCategoryName === subCategoryName));
        } else {
            hotel.customSuperCategories = hotel.customSuperCategories.filter(c => c !== superCategory);
            hotel.customSubCategories = hotel.customSubCategories.filter(s => s.superCategory !== superCategory);
        }
        await hotel.save();
        res.json({ success: true, superCategories: hotel.customSuperCategories, subCategories: hotel.customSubCategories });
    } catch (err) { next(err); }
});

// ==========================================
// 👥 OWNER & WAITER ROUTES (Professional Alerts Engine)
// ==========================================
app.post('/api/owner/add-waiter', async (req, res, next) => {
    try {
        const { hotelId, waiterName, waiterPin } = req.body;
        const hotel = await Hotel.findById(hotelId);
        if (!hotel) return res.status(404).json({ success: false });
        
        if(!hotel.isWaiterEnabled) return res.json({ success: false, message: "Access Denied: Waiter Desk module is locked!" });

        // 🛡️ [११-पॉइंट्स मास्टर]: Professional English Alert
        if (hotel.waiters && hotel.waiters.some(w => w.waiterPin === String(waiterPin))) {
            return res.json({ success: false, message: "Error: Staff PIN already exists! ❌" });
        }
        if (!hotel.waiters) hotel.waiters = [];
        hotel.waiters.push({ waiterName, waiterPin: String(waiterPin) });
        await hotel.save();
        res.json({ success: true, waiters: hotel.waiters });
    } catch (err) { next(err); }
});

app.post('/api/owner/delete-waiter', async (req, res, next) => {
    try {
        const { hotelId, waiterId } = req.body;
        const hotel = await Hotel.findById(hotelId);
        if (!hotel) return res.status(404).json({ success: false });
        hotel.waiters = hotel.waiters.filter(w => String(w._id) !== String(waiterId));
        await hotel.save();
        res.json({ success: true, waiters: hotel.waiters });
    } catch (err) { next(err); }
});

app.post('/api/waiter/login', async (req, res, next) => {
    try {
        const { hotelId, waiterPin } = req.body;
        const hotel = await Hotel.findById(hotelId);
        if (!hotel) return res.json({ success: false, message: "Error: Hotel not found!" });
        
        if(!hotel.isWaiterEnabled) return res.json({ success: false, message: "Access Denied: Waiter Terminal is suspended!" });

        if (!hotel.waiters || hotel.waiters.length === 0) {
            return res.json({ success: false, message: "Error: No staff registered inside database!" });
        }
        const matchedWaiter = hotel.waiters.find(w => w.waiterPin === String(waiterPin));
        if (matchedWaiter) { res.json({ success: true, waiterName: matchedWaiter.waiterName }); } 
        else { res.json({ success: false, message: "Error: Invalid Secret Staff PIN! ❌" }); }
    } catch (err) { next(err); }
});

app.post('/api/owner/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const hotel = await Hotel.findOne({ ownerEmail: email, ownerPass: password });
        if (hotel) {
            if (hotel.status !== 'Active') return res.json({ success: false, message: "Access Suspended: Your hotel is blocked!" });
            const today = new Date();
            if (hotel.subscriptionEnd && today > hotel.subscriptionEnd) return res.json({ success: false, isSubExpired: true });
            res.json({ 
                success: true, 
                hotelId: hotel._id, 
                isAnalyticsEnabled: hotel.isAnalyticsEnabled,
                isMenuEnabled: hotel.isMenuEnabled,
                isWaiterEnabled: hotel.isWaiterEnabled,
                isQRGenerationEnabled: hotel.isQRGenerationEnabled
            });
        } else { res.json({ success: false, message: "Error: Invalid Credentials" }); }
    } catch (err) { next(err); }
});

app.get('/api/menu/:hotelId', async (req, res, next) => {
    try { 
        const hotel = await Hotel.findById(req.params.hotelId); 
        if (!hotel) return res.status(404).json({ error: "Hotel not found" });
        res.json(hotel); 
    } catch (err) { next(err); }
});

app.post('/api/menu/update/:hotelId', async (req, res, next) => {
    try {
        const { menu } = req.body;
        const hotel = await Hotel.findById(req.params.hotelId);
        if(!hotel.isMenuEnabled) return res.status(403).json({ success: false, message: "Access Denied: Menu Control is Locked!" });

        hotel.menu = menu;
        await hotel.save();
        res.json({ success: true });
    } catch (err) { next(err); }
});

app.get('/api/owner/analytics/:hotelId', async (req, res, next) => {
    try {
        const hId = new mongoose.Types.ObjectId(req.params.hotelId);
        const hotel = await Hotel.findById(hId);
        if (!hotel || !hotel.isAnalyticsEnabled) return res.status(403).json({ success: false });

        const customerList = await Order.aggregate([
            { $match: { hotelId: hId } },
            { $group: { _id: { phone: "$customerPhone", name: "$customerName" }, totalOrdersPlaced: { $sum: 1 } }},
            { $project: { _id: 0, name: "$_id.name", phone: "$_id.phone", visitCount: "$totalOrdersPlaced" } },
            { $sort: { visitCount: -1 } }
        ]);

        const topSellingItems = await Order.aggregate([
            { $match: { hotelId: hId } },
            { $unwind: "$items" },
            { $group: { _id: "$items.name", totalQtySold: { $sum: "$items.quantity" } }},
            { $sort: { totalQtySold: -1 } }, 
            { $project: { _id: 0, itemName: "$_id", qtySold: "$totalQtySold" } }
        ]);

        res.json({ success: true, customers: customerList, items: topSellingItems });
    } catch (err) { next(err); }
});

app.post('/api/owner/add-item', async (req, res, next) => {
    try {
        const { hotelId, name, price, superCategory, subCategory } = req.body;
        const hotel = await Hotel.findById(hotelId);
        if(!hotel.isMenuEnabled) return res.json({ success: false, message: "Access Locked!" });

        hotel.menu.push({ name, price: Number(price), superCategory, subCategory });
        await hotel.save(); res.json({ success: true });
    } catch (err) { next(err); }
});

app.post('/api/owner/delete-item', async (req, res, next) => {
    try {
        const { hotelId, itemIndex } = req.body;
        const hotel = await Hotel.findById(hotelId);
        if(!hotel.isMenuEnabled) return res.json({ success: false, message: "Access Locked!" });

        hotel.menu.splice(itemIndex, 1);
        await hotel.save(); res.json({ success: true });
    } catch (err) { next(err); }
});

// ==========================================
// 🛍️ LIVE ORDER AUTO BILL GENERATOR LOGIC
// ==========================================
app.post('/api/orders/place', async (req, res, next) => {
    try {
        const { hotelId, tableNumber, orderType, customerName, customerPhone, items, servedByWaiter, discountAmount, finalPaidAmount } = req.body;
        
        const hotel = await Hotel.findById(hotelId);
        const nextBillNo = (hotel.lastAssignedBillNumber || 1000) + 1;
        await Hotel.findByIdAndUpdate(hotelId, { lastAssignedBillNumber: nextBillNo });

        const newOrder = new Order({ 
            hotelId: new mongoose.Types.ObjectId(hotelId), 
            tableNumber: orderType === "Takeaway" ? "Takeaway" : tableNumber, 
            orderType: orderType || "Dining",
            billNumber: `AZ-${nextBillNo}`, 
            customerName, 
            customerPhone, 
            items,
            servedByWaiter: servedByWaiter || "Self Order",
            discountAmount: Number(discountAmount) || 0,
            finalPaidAmount: Number(finalPaidAmount) || 0
        });
        await newOrder.save(); 
        res.json({ success: true, orderId: newOrder._id, billNumber: newOrder.billNumber });
    } catch (err) { next(err); }
});

app.get('/api/orders/:hotelId', async (req, res, next) => {
    try {
        res.json(await Order.find({ hotelId: new mongoose.Types.ObjectId(req.params.hotelId), status: { $in: ['Pending', 'Accepted', 'Ready', 'Completed'] } }).sort({ createdAt: 1 }));
    } catch (err) { next(err); }
});

app.get('/api/orders/status/:orderId', async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.orderId);
        if (!order) return res.status(404).json({ status: 'Pending', message: "Order not found" });
        res.json({ status: order.status });
    } catch (err) { next(err); }
});

app.post('/api/orders/accept', async (req, res, next) => {
    try { await Order.findByIdAndUpdate(req.body.orderId, { status: 'Accepted' }); res.json({ success: true }); } catch (err) { next(err); }
});
app.post('/api/orders/ready', async (req, res, next) => {
    try { await Order.findByIdAndUpdate(req.body.orderId, { status: 'Ready' }); res.json({ success: true }); } catch (err) { next(err); }
});
app.post('/api/orders/complete', async (req, res, next) => {
    try { await Order.findByIdAndUpdate(req.body.orderId, { status: 'Completed' }); res.json({ success: true }); } catch (err) { next(err); }
});

// 🧾 [११-पॉइंट्स मास्टर]: इनवॉइस कैलकुलेटर (टैक्स, डिस्काउंट, लोगो और प्रोमो लिंक्स सिंक)
app.get('/api/orders/table-bill/:hotelId/:tableNumber', async (req, res, next) => {
    try {
        const hotel = await Hotel.findById(req.params.hotelId);
        if(!hotel) return res.status(404).json({ success: false, message: "Hotel not found" });

        const query = { 
            hotelId: new mongoose.Types.ObjectId(req.params.hotelId), 
            status: { $in: ['Pending', 'Accepted', 'Ready', 'Completed'] } 
        };
        
        if(req.params.tableNumber === "Takeaway") {
            query.orderType = "Takeaway";
        } else {
            query.tableNumber = req.params.tableNumber;
            query.orderType = "Dining";
        }

        const orders = await Order.find(query);
        if (orders.length === 0) {
            return res.json({ 
                success: true, 
                items: [], 
                grandTotal: 0,
                hotelMeta: {
                    fssaiNumber: hotel.fssaiNumber || "",
                    hotelLogoUrl: hotel.hotelLogoUrl || "",
                    isGstEnabled: hotel.isGstEnabled,
                    isServiceChargeEnabled: hotel.isServiceChargeEnabled,
                    serviceChargePercent: hotel.serviceChargePercent || 0,
                    instagramLink: hotel.instagramLink || "",
                    facebookLink: hotel.facebookLink || "",
                    googleReviewLink: hotel.googleReviewLink || ""
                }
            });
        }
        
        const merged = {}; let subTotal = 0;
        orders.forEach(o => o.items.forEach(i => {
            if (merged[i.name]) { merged[i.name].quantity += i.quantity; merged[i.name].total += (i.price * i.quantity); }
            else { merged[i.name] = { name: i.name, price: i.price, quantity: i.quantity, total: (i.price * i.quantity) }; }
            subTotal += (i.price * i.quantity);
        }));

        res.json({ 
            success: true, 
            customerName: orders[0].customerName, 
            customerPhone: orders[0].customerPhone, 
            servedByWaiter: orders[0].servedByWaiter || "Self Order", 
            billNumber: orders[0].billNumber || "N/A", 
            items: Object.values(merged), 
            subTotal: subTotal,
            hotelMeta: {
                fssaiNumber: hotel.fssaiNumber || "",
                hotelLogoUrl: hotel.hotelLogoUrl || "",
                isGstEnabled: hotel.isGstEnabled,
                isServiceChargeEnabled: hotel.isServiceChargeEnabled,
                serviceChargePercent: hotel.serviceChargePercent || 0,
                instagramLink: hotel.instagramLink || "",
                facebookLink: hotel.facebookLink || "",
                googleReviewLink: hotel.googleReviewLink || ""
            }
        });
    } catch (err) { next(err); }
});

app.post('/api/orders/clear-table', async (req, res, next) => {
    try {
        const query = { 
            hotelId: new mongoose.Types.ObjectId(req.body.hotelId), 
            status: { $in: ['Pending', 'Accepted', 'Ready', 'Completed'] } 
        };
        if(req.body.tableNumber === "Takeaway") {
            query.orderType = "Takeaway";
        } else {
            query.tableNumber = req.body.tableNumber;
            query.orderType = "Dining";
        }
        await Order.updateMany(query, { status: 'Cleared' });
        res.json({ success: true });
    } catch (err) { next(err); }
});

app.post('/api/owner/lock-qr', async (req, res, next) => {
    try {
        const { hotelId, tableNumber, qrLinkUrl } = req.body;
        const hotel = await Hotel.findById(hotelId);
        if(!hotel.isQRGenerationEnabled) return res.json({ success: false, message: "Access Locked: QR capability suspended!" });

        const idx = hotel.qrCodes.findIndex(q => q.tableNumber === String(tableNumber));
        if (idx !== -1) hotel.qrCodes[idx].qrLinkUrl = qrLinkUrl;
        else hotel.qrCodes.push({ tableNumber: String(tableNumber), qrLinkUrl });
        await hotel.save(); res.json({ success: true, qrCodes: hotel.qrCodes });
    } catch (err) { next(err); }
});

app.post('/api/owner/delete-qr', async (req, res, next) => {
    try {
        const hotel = await Hotel.findById(req.body.hotelId);
        hotel.qrCodes = hotel.qrCodes.filter(q => String(q.tableNumber) !== String(req.body.tableNumber));
        await hotel.save(); res.json({ success: true, qrCodes: hotel.qrCodes });
    } catch (err) { next(err); }
});

// ⚙️ [११-पॉइंट्स मास्टर]: सेटिंग्स अपग्रेड (FSSAI, लोगो, टैक्स टॉगल और सोशल लिंक सेट करने का रूट)
app.post('/api/owner/update-settings', async (req, res, next) => {
    try {
        const { 
            hotelId, address, phone, gstin, taxPercent, ownerUpiId, totalTables, newOwnerPassword,
            fssaiNumber, hotelLogoUrl, isGstEnabled, isServiceChargeEnabled, serviceChargePercent,
            instagramLink, facebookLink, googleReviewLink
        } = req.body;
        const hObjectId = new mongoose.Types.ObjectId(hotelId);
        
        const finalTablesCount = (totalTables !== undefined && totalTables !== null) ? Number(totalTables) : 15;

        const updatePayload = { 
            address, 
            phone, 
            gstin: gstin || "NOT REGISTERED", 
            taxPercent: Number(taxPercent) || 0, 
            ownerUpiId: ownerUpiId || "", 
            totalTables: finalTablesCount,
            fssaiNumber: fssaiNumber || "",
            hotelLogoUrl: hotelLogoUrl || "",
            isGstEnabled: isGstEnabled !== undefined ? isGstEnabled : false,
            isServiceChargeEnabled: isServiceChargeEnabled !== undefined ? isServiceChargeEnabled : false,
            serviceChargePercent: Number(serviceChargePercent) || 0,
            instagramLink: instagramLink || "",
            facebookLink: facebookLink || "",
            googleReviewLink: googleReviewLink || ""
        };
        
        if (newOwnerPassword && newOwnerPassword.trim() !== "") { updatePayload.ownerPass = newOwnerPassword.trim(); }
        await Hotel.findByIdAndUpdate(hObjectId, updatePayload); res.json({ success: true });
    } catch (err) { next(err); }
});

app.get('/api/owner/daily-report/:hotelId', async (req, res, next) => {
    try {
        const hId = new mongoose.Types.ObjectId(req.params.hotelId);
        const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
        const endOfDay = new Date(); endOfDay.setHours(23,59,59,999);

        const todayOrders = await Order.find({
            hotelId: hId,
            status: { $in: ['Completed', 'Cleared'] },
            createdAt: { $gte: startOfDay, $lte: endOfDay }
        });

        let totalDailyEarning = 0;
        let totalItemsSoldVolume = 0;
        const itemsBreakdownMap = {};

        todayOrders.forEach(order => {
            order.items.forEach(item => {
                const itemCost = item.price * item.quantity;
                totalDailyEarning += itemCost;
                totalItemsSoldVolume += item.quantity;

                if (itemsBreakdownMap[item.name]) {
                    itemsBreakdownMap[item.name] += item.quantity;
                } else {
                    itemsBreakdownMap[item.name] = item.quantity;
                }
            });
        });

        const itemsSoldList = Object.keys(itemsBreakdownMap).map(name => ({
            itemName: name,
            qtySold: itemsBreakdownMap[name]
        })).sort((a,b) => b.qtySold - a.qtySold);

        res.json({
            success: true,
            dailyEarning: totalDailyEarning,
            totalItemsCount: totalItemsSoldVolume,
            itemsDetails: itemsSoldList
        });
    } catch (err) { next(err); }
});

app.post('/api/public/enquiry', async (req, res, next) => {
    try {
        const { name, email, message } = req.body;
        if (!name || !email) return res.status(400).json({ success: false, message: "Name and Email are mandatory!" });

        const newLead = new Enquiry({ name, email, message });
        await newLead.save();

        try {
            const MY_GMAIL_APP_PASSWORD = "tkjyzwwpqdynxvip";
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'azharshaikh1296@gmail.com',
                    pass: MY_GMAIL_APP_PASSWORD
                }
            });

            const emailBodyLayout = `
                <div style="font-family: 'Segoe UI', sans-serif; background-color: #f8fafc; padding: 30px; border-radius: 16px; max-width: 550px; border: 1px solid #e2e8f0;">
                    <h2 style="color: #ff4757; margin-bottom: 5px; font-size: 22px;">🚀 New Lead Generated!</h2>
                    <p style="color: #64748b; font-size: 14px; margin-top:0;">A prospective client wants to join AzeeTech Smart POS Network.</p>
                    <hr style="border: none; border-top: 1px dashed #cbd5e1; margin: 20px 0;">
                    <div style="margin-bottom: 12px;"><strong style="color: #0f172a;">👤 Full Name:</strong> <span style="color: #334155;">${name}</span></div>
                    <div style="margin-bottom: 12px;"><strong style="color: #0f172a;">📧 Email Address:</strong> <span style="color: #334155;">${email}</span></div>
                    <div style="margin-bottom: 12px;"><strong style="color: #0f172a;">📝 Business Message:</strong><p style="background: white; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; color: #475569; font-size: 14px; margin-top: 5px; line-height: 1.5;">${message || 'No additional details provided.'}</p></div>
                    <hr style="border: none; border-top: 1px dashed #cbd5e1; margin: 20px 0;">
                    <small style="color: #94a3b8; display: block; text-align: center;">AzeeTech SaaS Cloud Lead Engine © 2026</small>
                </div>`;

            const mailOptions = {
                from: '"AzeeTech SaaS Leads" <azharshaikh1296@gmail.com>',
                to: 'azharshaikh1296@gmail.com',
                subject: '🚀 AzeeTech POS - New Hotel Enquiry Received!',
                html: emailBodyLayout
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) console.log("🔴 Nodemailer Engine Error:", error.message);
                else console.log("🟢 Live Email Dispatched Successfully!");
            });
        } catch (mailInfrastructureErr) {
            console.log("🔴 Nodemailer SMTP Block Bypass Activated:", mailInfrastructureErr.message);
        }

        res.json({ success: true, message: "Lead captured successfully!" });
    } catch (err) { next(err); }
});

// ==========================================
// 🛡️ [११-पॉइंट्स मास्टर]: बुलेटप्रूफ एरर हैंडलिंग (Universal Error Catch Block)
// ==========================================
app.use((err, req, res, next) => {
    console.error("💥 System Error Intercepted:", err.message);
    res.status(500).json({ 
        success: false, 
        message: "Something went wrong on our end. Team AzeeTech is on it! Please try again. ❌" 
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Final Master SaaS Engine running smoothly on port ${PORT}`));