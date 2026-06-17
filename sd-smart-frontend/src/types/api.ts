/**
 * API Response Types
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
}

/**
 * Auth Types
 */
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface SignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyCodeRequest {
  email: string;
  code: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Product Types
 */
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discountPrice?: number;
  images: string[];
  category: string;
  rating: number;
  reviews: number;
  inStock: boolean;
  quantity: number;
  specifications?: Record<string, string>;
  modelNumber?: string;
  productId?: string;
  availableStock?: number;
  stockIn?: number;
  stockOut?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: "price" | "rating" | "newest";
  sortOrder?: "asc" | "desc";
}

export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Cart Types
 */
export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  addedAt: string;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  updatedAt: string;
}

export interface AddToCartRequest {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  cartItemId: string;
  quantity: number;
}

/**
 * Order Types
 */
export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  userId: string;
  orderNumber: string;
  items: OrderItem[];
  totalAmount: number;
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: "card" | "upi" | "netbanking";
  paymentStatus: "pending" | "completed" | "failed";
  orderStatus: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  items: CartItem[];
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: "card" | "upi" | "netbanking";
}

export interface Address {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

/**
 * Wishlist Types
 */
export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  product: Product;
  addedAt: string;
}

export interface Wishlist {
  id: string;
  userId: string;
  items: WishlistItem[];
  totalItems: number;
  updatedAt: string;
}

/**
 * Review Types
 */
export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  images?: string[];
  helpful: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewRequest {
  productId: string;
  rating: number;
  title: string;
  comment: string;
  images?: File[];
}

/**
 * Category Types
 */
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  productCount: number;
  parentCategory?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Search Types
 */
export interface SearchResult {
  products: Product[];
  categories: Category[];
  suggestions: string[];
  total: number;
}
