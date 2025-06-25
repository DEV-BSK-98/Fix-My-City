import express from "express";
import User from "../models/user.js";
import jwt from "jsonwebtoken";

const router = express.Router ()
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '15d' })
}

router.post ("/register", async (req, res) => {
    try {
        const {
            email,
            firstName,
            lastName,
            otherNames,
            password,
            phone,
            userType,
            authorityType,
            nrc
        } = req.body
        const authtypes = ['RDA', 'ZEMA']
        const utypes = ["End User", "Authority", "Super User"]
        const username = `${email}${firstName}${lastName}`
        const ut = userType && utypes.includes (userType)  ? userType : "End User"
        const auty = authorityType && authtypes.includes (authorityType) ? authorityType : "No Authority"
        if (!nrc ||!email || !firstName || !lastName || !password || !phone) return res.status (400).json ({msg: "The following fields [ First Name, Last Name, Email, Password, NRC and Phone ] are all required"})
        if (password.length < 8) return res.status (400).json ({msg: "Password must be greater than 8 characters long"})
        const checkUser = await User.findOne ({$or:[{email}, {nrc}, {phone}, {username}]})
        if (checkUser) return res.status (400).json ({msg: "User Already Exists"})
        const profileImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
        const newUser = new User({
            email,
            firstName,
            lastName,
            otherNames: otherNames || "",
            userType: ut,
            username,
            phone,
            password,
            nrc,
            profileImage,
            authorityType: auty
        })

        await newUser.save ()

        const token = generateToken (newUser.id)
        return res.status (201).json ({
            token,
            user: {
                id: newUser._id,
                email: newUser.email,
                username: newUser.username,
                profileImage: newUser.profileImage,
                nrc: newUser.nrc,
                userType: newUser.userType,
                phone: newUser.phone,
                firstName: newUser.firstName,
                otherNames: newUser.otherNames,
                lastName: newUser.lastName,
                createdAt: newUser.createdAt

            },
            msg: `${newUser.firstName} ${newUser.otherNames} ${newUser.lastName} Created Successfully`
        })
    } catch (error) {
        console.log('====================================');
        console.log(`Error In Register Route ${error}`);
        console.log('====================================');
        res.status (500).json ({msg: "Failed to Create User"})
    }
})

router.post ("/login", async (req, res) => {
    try {
        const { password, email } = req.body

        if (!password || !email) return res.status (401).json ({msg: "All Fields Are Required"})
        const user = await User.findOne ({email})
        if (!user) return res.status (401).json ({msg: "Invalid Credentials"})
        const isUser = await user.comparePassword (password)
        if (!isUser) return res.status (401).json ({msg: "Invalid Credentials"})
        const token = generateToken (user.id)
        return res.status (201).json ({
            token,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                profileImage: user.profileImage,
                nrc: user.nrc,
                userType: user.userType,
                phone: user.phone,
                firstName: user.firstName,
                otherNames: user.otherNames,
                lastName: user.lastName,
                createdAt: user.createdAt,
            },
            msg: `${user.firstName} ${user.otherNames} ${user.lastName} Logged In Successfully`
        })
    } catch (error) {
        console.log('====================================');
        console.log(`Error In Login Route ${error}`);
        console.log('====================================');
        res.status (500).json ({msg: "Failed to Login User"})
    }
})

export default router