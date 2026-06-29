"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const router = (0, express_1.Router)();
const uploadsDir = path_1.default.join(__dirname, "../../uploads");
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
// Configure Multer storage
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + "-" + file.originalname);
    },
});
const upload = (0, multer_1.default)({ storage });
router.post("/", upload.any(), (req, res) => {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            res.status(400).json({ success: false, message: "No files uploaded" });
            return;
        }
        // Return the URLs for the uploaded files
        const urls = files.map((file) => `http://localhost:5000/uploads/${file.filename}`);
        res.status(200).json({
            success: true,
            urls,
            message: "Files uploaded successfully",
        });
    }
    catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ success: false, message: "Failed to upload files" });
    }
});
exports.default = router;
