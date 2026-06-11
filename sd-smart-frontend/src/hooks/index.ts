/**
 * Hooks Index
 * Export all custom hooks
 */

export { useAsync, useFetch, useMutation } from "./useApi";
export {
  useLogin,
  useSignup,
  useForgotPassword,
  useVerifyResetCode,
  useResetPassword,
  useGetCurrentUser,
  useUpdateProfile,
  useLogout,
} from "./useAuth";
export {
  useProducts,
  useProduct,
  useSearchProducts,
  useFeaturedProducts,
  useBestsellingProducts,
  useCategories,
} from "./useProducts";
export {
  useCart,
  useAddToCart,
  useUpdateCartItem,
  useRemoveFromCart,
  useClearCart,
  useApplyCoupon,
} from "./useCart";
export {
  useOrders,
  useOrder,
  useCreateOrder,
  useCancelOrder,
  useTrackOrder,
  useDownloadInvoice,
} from "./useOrders";
