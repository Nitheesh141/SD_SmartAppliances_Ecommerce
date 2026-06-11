import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_, res) => {
    res.json({
        success: true,
        message: "SD Smart Backend Running",
    });
});

export default app;