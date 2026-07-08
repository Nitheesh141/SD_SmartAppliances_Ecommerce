"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const product_routes_1 = __importDefault(require("./routes/product.routes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const cart_routes_1 = __importDefault(require("./routes/cart.routes"));
const wishlist_routes_1 = __importDefault(require("./routes/wishlist.routes"));
const address_routes_1 = __importDefault(require("./routes/address.routes"));
const order_routes_1 = __importDefault(require("./routes/order.routes"));
const offer_routes_1 = __importDefault(require("./routes/offer.routes"));
const setting_routes_1 = __importDefault(require("./routes/setting.routes"));
const serviceRequest_routes_1 = __importDefault(require("./routes/serviceRequest.routes"));
const warrantyRegistration_routes_1 = __importDefault(require("./routes/warrantyRegistration.routes"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Disable caching for API responses
app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
    next();
});
app.use("/api/auth", auth_routes_1.default);
app.use("/api/products", product_routes_1.default);
app.use("/api/upload", upload_routes_1.default);
app.use("/api/cart", cart_routes_1.default);
app.use("/api/wishlist", wishlist_routes_1.default);
app.use("/api/addresses", address_routes_1.default);
app.use("/api/orders", order_routes_1.default);
app.use("/api/offers", offer_routes_1.default);
app.use("/api/settings", setting_routes_1.default);
app.use("/api/service-requests", serviceRequest_routes_1.default);
app.use("/api/warranty-registrations", warrantyRegistration_routes_1.default);
// Serve static files from the uploads directory
app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "../uploads")));
app.get("/", (_, res) => {
    res.json({
        success: true,
        message: "SD Smart Backend Running",
    });
});
exports.default = app;
// Trigger restart
