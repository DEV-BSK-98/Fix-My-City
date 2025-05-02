import mongoose from "mongoose"

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect (process.env.MONGO_URI)
        console.log('====================================');
        console.log(`DATABASE Connected: ${conn.connection.host}`);
        console.log('====================================');
    } catch (error) {
        console.log('====================================');
        console.log("Error Connecting to database", error);
        console.log('====================================');
        process.exit (1)
    }
}