import express from "express"
import cloudinary from "../lib/cloudinary.js"
import Report from "../models/report.js"
import protectRoute from "../middleware/auth_middleware.js"

async function upload(imageBase64) {
    try {
        if (!imageBase64.startsWith("data:image/")) {
            throw new Error("❌ Invalid base64 format. Must be a data URL.");
        }

        const result = await cloudinary.uploader.upload(imageBase64, {
            upload_preset: "fix-my-city",
            folder: "fix-my-city",
        });

        console.log("✅ Uploaded to Cloudinary:", result.secure_url);
        return { error: false, msg: result.secure_url };
    } catch (err) {
        console.error("❌ Cloudinary upload failed:", err.message);
        return { error: true, msg: err.message };
    }
}

const predict = async (base64Image) => {
    const matches = base64Image.match(/^data:([A-Za-z-+/]+);base64,(.+)$/)
    let pureBase64
    if (matches && matches.length === 3) {
        pureBase64 = matches[2]
    } else {
        pureBase64 = base64Image
    }

    const payload = {
        image_base64: pureBase64
    }

    try {
        const response = await fetch('http://localhost:8000/predict', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
        },
            body: JSON.stringify(payload),
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        return result
    } catch (error) {
        console.error('Prediction API error:', error)
        throw error
    }
}


const router = express.Router ()

router.post ("/", protectRoute, async (req, res) => {
    try {

        const {
            title,
            caption,
            place,
            rating,
            image,
            lat,
            lng
        } = req.body

        if (!title) return res.status (400).json ({msg: "title is Required"})
        if (!image) return res.status (400).json ({msg: "image is Required"})
        if (!place) return res.status (400).json ({msg: "place is Required"})
        if (!caption) return res.status (400).json ({msg: "caption is Required"})
        if (rating <= 0) return res.status (400).json ({msg: "rating is Required"})
        if (!lat || !lng) return res.status (400).json ({msg: "Your Location is required"})

        const imageUrlObj = await upload (image)

        if (imageUrlObj?.error) return res.status (400).json ({msg: "Image Upload Failed"})
        const imageUrl = imageUrlObj?.msg

        const prediction = await predict (image)
        const report_is_for = prediction?.prediction && prediction?.prediction !=  "Uncertain" ? prediction?.prediction : "No Authority Found"

        const newReport = new Report ({
            title,
            caption,
            place,
            report_is_for,
            rating,
            image: imageUrl,
            responded: 0,
            comment: "",
            lat,
            lng,
            user: req.user._id,
        })

        await newReport.save ()
        return res.status (201).json ({
            ...newReport,
            msg: "Report has been submitted successfully"
        })
    } catch (err) {
        console.log('====================================')
        console.log(`Error In Report Submit: ${err.message}`)
        console.log('====================================')
        res.status (500).json ({msg: "Failed To Submit Report"})
    }
})

router.get ("/", protectRoute, async (req, res) => {
    try {
        const page = req.query.page || 1
        const limit = req.query.limit || 10
        const skip = (page - 1) * limit
        const reports = await Report.find ().sort ({createdAt: -1})
        .skip (skip)
        .limit (limit)
        .populate ("user", "firstName lastName otherName profileImage username")
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
        console.log('=============kkkkk=======================')
        console.log(`ERROR: ${err}`)
        console.log('====================================')
        res.status (500).json ({msg: "Failed to Fetch Reports"})
    }
})

router.delete ("/:id", protectRoute, async (req, res) => {
    try {
        const report = await Report.findById (req.params.id)
        if (!report) return res.status (204).json ({msg: "Report Not Found"})
        if (report.user.toString () !== req.user._id.toString ()) return res.status ().json ({msg: "Unauthorized"})

        if (report.image && report.image.includes ("cloudinary")) {
            try {
                const publicId = report.image.split ('/').pop ().split (".")[0]
                await cloudinary.uploader.destroy (publicId)
            } catch (deletionError) {
                console.log('====================================')
                console.log(`Image Deletion ERROR: ${deletionError}`)
                console.log('====================================')
            }
        }

        await report.deleteOne ()

        return res.status (204).json ({msg: "Deletion Successful"})

    } catch (error) {
        console.log('====================================')
        console.log(`ERROR: ${error}`)
        console.log('====================================')
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
        console.log('====================================')
        console.log(`ERROR: ${err}`)
        console.log('====================================')
        res.status (500).json ({msg: "Failed to Fetch Your Reports"})
    }
})


router.get ("/authority/:authority", protectRoute, async (req, res) => {
    try {
        const authority = req.params.authority
        const page = req.query.page || 1
        const limit = req.query.limit || 150
        const skip = (page - 1) * limit
        const reports = await Report.find ({report_is_for: authority}).sort ({createdAt: -1})
        .skip (skip)
        .limit (limit)
        .populate ("user", "firstName lastName otherName profileImage username")
        .populate ("responder", "firstName lastName otherName profileImage username")
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
        console.log('====================================')
        console.log(`ERROR: ${err}`)
        console.log('====================================')
        res.status (500).json ({msg: "Failed to Fetch Your Reports"})
    }
})

router.put("/:id", protectRoute, async (req, res) => {
    try {
        const report = await Report.findById(req.params.id)
        if (!report) return res.status(404).json({ msg: "Report not found" })

        const allowedFields = [
            "title", "caption", "place", "rating",
            "responded", "responder", "comment", "responseDate",
            "lat", "lng"
        ]

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                report[field] = req.body[field]
            }
        })
        if (!report?.responder) report.responder = req.user._id
        await report.save()
        return res.status(200).json({ msg: "Report updated successfully", report })
    } catch (err) {
        console.log("Report Update ERROR:", err)
        res.status(500).json({ msg: "Failed to update report" })
    }
})

export default router