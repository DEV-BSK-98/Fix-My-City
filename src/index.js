import express from "express"
import "dotenv/config"
import cors from "cors"
import authRoutes from "./routes/authRoutes.js"
import reportRoutes from "./routes/reportRoutes.js"
import { connectDB } from "./lib/db.js"

const app = express ()
const PORT = process.env.PORT || 3000

app.use(express.json({ limit: '15mb' }))
app.use (cors ())

app.use ("/api/auth/", authRoutes)
app.use ("/api/report/", reportRoutes)


app.listen (PORT, '0.0.0.0', () => {
    console.log ("Server is Running PORT=:", PORT)
    connectDB ()
})