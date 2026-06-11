/**
 * Order Hooks
 */

import { orderService } from "@/services/orderService";
import { Order, CreateOrderRequest } from "@/types/api";
import { useMutation } from "./useApi";
import { useState, useCallback } from "react";

/**
 * Hook to fetch orders
 */
export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchOrders = useCallback(async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      const response = await orderService.getOrders(page, limit);
      setOrders(response.data?.orders || []);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { orders, loading, error, fetchOrders };
};

/**
 * Hook to fetch single order
 */
export const useOrder = (orderId: string) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      const response = await orderService.getOrderById(orderId);
      setOrder(response.data || null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  return { order, loading, error, fetchOrder };
};

/**
 * Hook to create order
 */
export const useCreateOrder = () => {
  const { mutate, ...rest } = useMutation((data: CreateOrderRequest) =>
    orderService.createOrder(data)
  );

  return { createOrder: mutate, ...rest };
};

/**
 * Hook to cancel order
 */
export const useCancelOrder = () => {
  const { mutate, ...rest } = useMutation((orderId: string) =>
    orderService.cancelOrder(orderId)
  );

  return { cancelOrder: mutate, ...rest };
};

/**
 * Hook to track order
 */
export const useTrackOrder = () => {
  const { mutate, ...rest } = useMutation((orderNumber: string) =>
    orderService.getOrderByNumber(orderNumber)
  );

  return { trackOrder: mutate, ...rest };
};

/**
 * Hook to download invoice
 */
export const useDownloadInvoice = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const downloadInvoice = useCallback(async (orderId: string) => {
    try {
      setLoading(true);
      const blob = await orderService.downloadInvoice(orderId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${orderId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { downloadInvoice, loading, error };
};
