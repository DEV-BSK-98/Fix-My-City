import jwt from 'jsonwebtoken'
import User from '../models/user.js'
import "dotenv/config"


const protectRoute = async (req, res, next) => {
    try {
        const token = req.header ("Authorization").replace ("Bearer ", "")
        if (!token) return res.status (401).json ({msg: "Unauthorized Access Denied"})
        const decoded = jwt.verify (token, process.env.JWT_SECRET)
        const user = await User.findOne (decoded.userId).select ("-password")
        if (!user) return res.status (401).json ({msg: "Unauthorized Access Denied"})

        req.user = user
        next ()
    } catch (err) {
        console.log('====================================');
        console.log(`Error: ${err}`);
        console.log('====================================');
    }
}

export default protectRoute