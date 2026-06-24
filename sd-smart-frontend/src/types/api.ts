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
  role?: string;
  companyName?: string;
  gstin?: string;
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
  image?: string;
  category: string;
  categoryLabel?: string;
  rating: number;
  reviews: number;
  inStock: boolean;
  quantity: number;
  specifications?: Record<string, string>;
  specs?: any;
  variantDetails?: Record<string, string>;
  modelNumber?: string;
  productId?: string;
  sku?: string;
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
  id: string;
  orderId: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  createdAt: string;
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  status: string;
  remarks?: string;
  updatedBy: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  distributorId: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingAmount: number;
  grandTotal: number;
  invoiceDate: string;
  pdfUrl?: string;
  generatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
  };
  addressId: string;
  address?: Address;
  poNumber?: string;
  paymentMethod: string;
  status: string;
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  deliveryCharges: number;
  discount: number;
  grandTotal: number;
  items: OrderItem[];
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  statusHistory?: OrderStatusHistory[];
  invoice?: Invoice;
  paymentStatus?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  addressId: string;
  paymentMethod: string;
  poNumber?: string;
  couponCode?: string;
}

export interface Address {
  id: string;
  userId: string;
  fullName: string;
  emailAddress?: string;
  mobileNumber: string;
  companyName?: string;
  gstin?: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressRequest {
  fullName: string;
  emailAddress?: string;
  mobileNumber: string;
  companyName?: string;
  gstin?: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

/**
 * Wishlist Types
 */
export interface WishlistItem {
  id: string;
  wishlistId: string;
  productId: string;
  product: Product;
  createdAt: string;
  updatedAt: string;
}

export interface Wishlist {
  id: string;
  userId: string;
  items: WishlistItem[];
  createdAt: string;
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
