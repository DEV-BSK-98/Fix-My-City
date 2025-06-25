import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const userSchema = new mongoose.Schema (
    {
        username: {
            type: String,
            required: true,
            unique: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
            minlength: 8,
        },
        profileImage: {
            type: String,
            default: ""
        },
        nrc: {
            type: String,
            default: ""
        },
        phone: {
            type: String,
            default: ""
        },
        firstName: {
            type: String,
            required: true,
        },
        lastName: {
            type: String,
            required: true,
        },
        otherNames: {
            type: String,
            default: ""
        },
        userType: {
            type: String,
            default: "End User"
        },
        authorityType:  {
            type: String,
            default: "No Authority"
        },
    },
    {
        timestamps: true
    }
)

userSchema.pre ("save", async function (next) {
    if (!this.isModified ("password")) return next ()
    const salt = await bcrypt.genSalt (10)
    this.password = await bcrypt.hash (this.password ,salt)
    next ()
})

userSchema.methods.comparePassword = async function (userPassword) {
    return await bcrypt.compare (userPassword, this.password)
}

const User = mongoose.models.User || mongoose.model('User', userSchema)

export default User