import express, { Request, Response } from "express";
import cors from "cors";
import "dotenv/config";
import mongoose from "mongoose";

const app = express();
const PORT = Number(process.env.PORT ?? 7000);
const MONGODB_URI = process.env.CONNECT_STRING;
let isMongoConnected = false;

const connectMongo = async () => {
    if (isMongoConnected || !MONGODB_URI) {
        return;
    }

    try {
        await mongoose.connect(MONGODB_URI);
        isMongoConnected = true;
        console.log("MongoDB connected");
    } catch (error) {
        console.error("MongoDB connection error:", error);
    }
};

void connectMongo();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get("/api/test", (req: Request, res: Response) => {
    res.json({ message: "Minh Thanh Villa" });
});

// Local development server. On Vercel, the app is exported as a serverless handler.
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
}

export default app;
