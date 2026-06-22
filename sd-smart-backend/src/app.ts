import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import productRoutes from "./routes/product.routes";
import uploadRoutes from "./routes/upload.routes";
import cartRoutes from "./routes/cart.routes";
import wishlistRoutes from "./routes/wishlist.routes";
import addressRoutes from "./routes/address.routes";
import orderRoutes from "./routes/order.routes";
import path from "path";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/orders", orderRoutes);

// Serve static files from the uploads directory
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/", (_, res) => {
    res.json({
        success: true,
        message: "SD Smart Backend Running",
    });
});

export default app;
// Trigger restart
