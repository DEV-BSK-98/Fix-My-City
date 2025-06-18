import mongoose from "mongoose"

const reportSchema = new mongoose.Schema (
    {
        title: {
            type: String,
            required: true,
        },
        place: {
            type: String,
            required: true,
        },
        caption: {
            type: String,
            required: true,
        },
        report_is_for: {
            type: String,
            required: true,
        },
        image: {
            type: String,
            required: true,
        },
        rating: {
            type: String,
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        rating: {
            type: String,
            required: true,
        },
        lat: {
            type: String,
            required: true,
        },
        lng: {
            type: String,
            required: true,
        },
        responder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        responded: {
            type: Number,
            default: 0,
        },
        comment: {
            type: String,
            default: "",
        },
        responseDate: {
            type: Date,
            default: "",
        },
    },
    {
        timestamps: true
    }
)

const Report = mongoose.models.Report || mongoose.model ("Report", reportSchema)

export default Report