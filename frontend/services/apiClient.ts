const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

class ApiClient {
  private getAuthToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("skillswap_access_token");
  }

  public setTokens(accessToken: string, refreshToken?: string) {
    if (typeof window !== "undefined") {
      localStorage.setItem("skillswap_access_token", accessToken);
      if (refreshToken) {
        localStorage.setItem("skillswap_refresh_token", refreshToken);
      }
    }
  }

  public clearTokens() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("skillswap_access_token");
      localStorage.removeItem("skillswap_refresh_token");
    }
  }

  public async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getAuthToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    // If body is not FormData, default to application/json
    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = `${API_BASE_URL}${cleanEndpoint}`;

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

    // Handle HTTP errors
    if (!response.ok) {
      let errorMessage = "An error occurred";
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || JSON.stringify(errorData);
      } catch {
        errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
      }

      // If 401 Unauthorized, handle token expiration/logout
      if (response.status === 401 && typeof window !== "undefined") {
        this.clearTokens();
      }

      throw new Error(errorMessage);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  public get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  public post<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    const isFormData = body instanceof FormData;
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: isFormData ? body : JSON.stringify(body),
    });
  }

  public put<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    const isFormData = body instanceof FormData;
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: isFormData ? body : JSON.stringify(body),
    });
  }

  public patch<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }

  public delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

export const apiClient = new ApiClient();
