import express from "express";
import { uploadAdImage, uploadBannerImage, uploadCouponImage, uploadMatchImage, uploadNotificationFile, uploadProductImage, uploadTurfImage } from "../config/multerConfig.js";
import { createAd, createCommission, createCoupon, createIntegration, createMatch, createPlan, createProduct, createTurf, deleteAd, deleteBanner, deleteBooking, deleteCommission, deleteCoupon, deleteIntegration, deleteNotification, deletePlan, deleteTurf, deleteUserById, getAllAds, getAllBanners, getAllBookingsForAdmin, getAllCommissions, getAllCoupons, getAllIntegrations, getAllMatches, getAllNotifications, getAllPlans, getAllProducts, getAllTurfs, getAllUsers, getCouponById, getScoreboard, getSingleUser, loginAdmin, registerAdmin, sendNotification, updateAd, updateBall, updateBanner, updateBookingStatus, updateCommission, updateCoupon, updateIntegration, updateNotification, updatePlan, updateTurf, updateUserById, uploadBanners } from "../controllers/adminController.js";

const router = express.Router();

// 🏟️ Create turf route with image upload
router.post("/create-turf", uploadTurfImage.array("images", 5), createTurf);
router.get("/allturfs", getAllTurfs);
router.post('/uploadbanners', uploadBannerImage.array('banners', 5), uploadBanners);
router.put('/updatebanner/:id', uploadBannerImage.array('banners', 5), updateBanner);
router.delete('/deletebanner/:id', deleteBanner);
router.get('/getallbanners', getAllBanners);
router.post('/creatematch', uploadMatchImage.single('image'), createMatch);
router.get('/getallmatches', getAllMatches);
// Update ball info for a match
router.put('/updatescore/:matchId', updateBall);

// Get scoreboard for a match
router.get('/getmatchscoreboard/:matchId', getScoreboard);
router.get('/getallbookings', getAllBookingsForAdmin);
router.put('/updatebookings/:bookingId', updateBookingStatus);
router.delete('/deletebookings/:bookingId', deleteBooking);
router.get('/getallusers', getAllUsers);
router.put('/updateuser/:id', updateUserById);
router.delete('/deleteuser/:id', deleteUserById);
router.get('/singleuser/:id', getSingleUser);
router.put('/updateturfs/:turfId', updateTurf);
router.delete('/deleteturfs/:turfId', deleteTurf);
router.post('/register', registerAdmin);
router.post('/login', loginAdmin);
router.post("/create-ads", uploadAdImage.single("image"), createAd);
router.get("/allads", getAllAds);
router.put("/updateads/:id",uploadAdImage.single("image"), updateAd);
router.delete("/deleteads/:id", deleteAd);
router.post("/create-coupon", uploadCouponImage.single("image"), createCoupon);
router.get("/coupons", getAllCoupons);
router.get("/singlecoupon/:id", getCouponById);
router.put("/updatecoupon/:id", uploadCouponImage.single("image"), updateCoupon);
router.delete("/deletecoupon/:id", deleteCoupon);
router.post("/create-plan", createPlan);
router.get("/plans", getAllPlans);
router.put("/update-plan/:id", updatePlan);
router.delete("/delete-plan/:id", deletePlan);
router.post("/createIntegration", createIntegration);
router.get("/getallintegratedlist", getAllIntegrations);
router.put("/updateintegration/:id", updateIntegration);
router.delete("deleteintegration/:id", deleteIntegration);
router.post("/addcommission", createCommission);
router.get("/allcommission", getAllCommissions);
router.put("/updatecommission/:id", updateCommission);
router.delete("/deletecommission/:id", deleteCommission);
router.post('/create-products', uploadProductImage.array('images', 5), createProduct); // Limiting to 5 images
router.get('/allproducts', getAllProducts);
router.post("/sendnotification", uploadNotificationFile.single("file"), sendNotification);
router.get("/getallnotifications", getAllNotifications);
router.put("/updatenotification/:id", uploadNotificationFile.single("file"), updateNotification);
router.delete("/deletenotification/:id", deleteNotification);






// 🔁 Export the router
export default router;
