"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = __importDefault(require("./app"));
const seedSuperAdmin_1 = require("./utils/seedSuperAdmin");
const PORT = process.env.PORT || 5000;
// Auto-seed superadmin from .env on every startup (non-fatal if it fails)
(0, seedSuperAdmin_1.seedSuperAdmin)().then(() => {
    app_1.default.listen(PORT, () => {
        console.log(`[server]: Backend server is running on http://localhost:${PORT}`);
    });
});
