import { ENV } from "@/config/env";

export async function apiFetch<T>(
    endpoint: string,
    options?: RequestInit
): Promise<T> {
    const baseUrl = ENV.API_BASE_URL.replace(/\/$/, "");
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    
    const response = await fetch(`${baseUrl}${cleanEndpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options?.headers,
        },
    });

    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
    }

    return response.json();
}
