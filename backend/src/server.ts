import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db";
import authRouter from "./routes/authRoutes";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
  res.send("Backend is working");
});
app.use("/api/auth",authRouter);

connectDB().then(() => {
    app.listen(port,() => {
        console.log(`Server is up and running.`);
    });
});