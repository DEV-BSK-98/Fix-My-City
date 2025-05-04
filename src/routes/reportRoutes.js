import express from "express";
import cloudinary from "../lib/cloudinary.js";
import Report from "../models/report.js";
import protectRoute from "../middleware/auth_middleware.js";



const router = express.Router ()

router.post ("/", protectRoute, async (req, res) => {
    try {
        const {
            title,
            caption,
            rating,
            image,
            lat,
            lng
        } = req.body

        if (!title || !caption || !rating || image || !lat ||lng) return res.status (400).json ({msg: "The Fields [title, caption, rating, (also Ensure that you give access to your location)] are all required"})

        const imageUpload = await cloudinary.uploader.upload (image)
        const imageUrl = imageUpload.secure_url
        const newReport = new Report ({
            title,
            caption,
            rating,
            image: imageUrl,
            lat,
            lng,
            user: req.user._id
        })

        await newReport.save ()
        return res.status (201).json ({
            ...newReport,
            msg: "Report has been submitted successfully"
        })
    } catch (err) {
        console.log('====================================');
        console.log(`Error In Report Submit: ${err}`);
        console.log('====================================');
        res.status (500).json ({msg: "Failed To Submit Report"})
    }
})

router.get ("/", protectRoute, async (req, res) => {
    try {
        const page = req.query.page || 1
        const limit = req.query.limit || 20
        const skip = (page - 1) * limit
        const reports = await Report.find ().sort ({createdAt: -1})
        .skip (skip)
        .limit (limit)
        .populate ("user", "firstName lastName otherName profileImage")
        const totalRecords = await Report.countDocuments ()
        return res.send (
            {
                reports,
                currentPage: page,
                totalRecords,
                totalPages: Math.ceil (totalRecords / limit),
            }
        )
    } catch (err) {
        console.log('====================================');
        console.log(`ERROR: ${err}`);
        console.log('====================================');
        res.status (500).json ({msg: "Failed to Fetch Reports"})
    }
})

router.delete ("/:id", protectRoute, async (req, res) => {
    try {
        const report = await Report.findById (req.params.id)
        if (!report) return res.status (204).json ({msg: "Report Not Found"})
        if (report.user.toString () !== res.user._id.toString ()) return res.status ().json ({msg: "Unauthorized"})

        if (report.image && book.image.includes ("cloudinary")) {
            try {
                const publicId = report.image.split ('/').pop ().split (".")[0]
                await cloudinary.uploader.destroy (publicId)
            } catch (deletionError) {
                console.log('====================================');
                console.log(`Image Deletion ERROR: ${deletionError}`);
                console.log('====================================');
            }
        }

        await report.deleteOne ()

        return res.status(204).json ({msg: "Report Deleted"})

    } catch (error) {
        console.log('====================================');
        console.log(`ERROR: ${err}`);
        console.log('====================================');
        res.status (500).json ({msg: "Failed to Delete Reports"})
    }
})

router.get ("/mine", protectRoute, async (req, res) => {
    try {
        const page = req.query.page || 1
        const limit = req.query.limit || 20
        const skip = (page - 1) * limit
        const reports = await Report.find ({user: req.user._id}).sort ({createdAt: -1})
        .skip (skip)
        .limit (limit)
        const totalRecords = await Report.countDocuments ()
        return res.send (
            {
                reports,
                currentPage: page,
                totalRecords,
                totalPages: Math.ceil (totalRecords / limit),
            }
        )
    } catch (err) {
        console.log('====================================');
        console.log(`ERROR: ${err}`);
        console.log('====================================');
        res.status (500).json ({msg: "Failed to Fetch Your Reports"})
    }
})

export default router