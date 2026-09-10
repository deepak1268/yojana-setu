import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db";
import authRouter from "./routes/authRoutes";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
    origin: "http://localhost:3001",
    credentials: true
}));
app.use(express.json());
app.get("/", (req, res) => {
  res.send("Backend is working");
});
app.use("/api/auth",authRouter);

connectDB().then(() => {
    app.listen(port,() => {
        console.log(`Server is up and running on ${port}`);
    });
});