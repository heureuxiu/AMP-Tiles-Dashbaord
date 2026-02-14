const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Product {
  _id: string;
  name: string;
  sku: string;
  description: string;
  category: string;
  finish: string;
  size?: string;
  price: number;
  stock: number;
  unit: string;
  image?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  token?: string;
  user?: User;
  products?: Product[];
  product?: Product;
  count?: number;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = localStorage.getItem('amp_token');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...(options.headers as Record<string, string>),
        },
        credentials: 'include', // Include cookies
      });

      // Handle non-JSON responses
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        throw new Error('Invalid JSON response from server');
      }

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      // Re-throw if it's already an Error with a message
      if (error instanceof Error) {
        throw error;
      }
      // Handle unknown error types
      throw new Error('Network error occurred');
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(name: string, email: string, password: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  async getMe() {
    return this.request('/auth/me', {
      method: 'GET',
    });
  }

  async updateDetails(name: string, email: string) {
    return this.request('/auth/updatedetails', {
      method: 'PUT',
      body: JSON.stringify({ name, email }),
    });
  }

  async updatePassword(currentPassword: string, newPassword: string) {
    return this.request('/auth/updatepassword', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  // Product endpoints
  async getProducts(params?: {
    search?: string;
    category?: string;
    finish?: string;
    status?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.finish) queryParams.append('finish', params.finish);
    if (params?.status) queryParams.append('status', params.status);

    const query = queryParams.toString();
    return this.request(`/products${query ? `?${query}` : ''}`, {
      method: 'GET',
    });
  }

  async getProduct(id: string) {
    return this.request(`/products/${id}`, {
      method: 'GET',
    });
  }

  async createProduct(productData: {
    name: string;
    sku: string;
    description?: string;
    category: string;
    finish: string;
    size?: string;
    price: number;
    stock?: number;
    unit?: string;
    image?: string;
  }) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(id: string, productData: Partial<{
    name: string;
    sku: string;
    description?: string;
    category: string;
    finish: string;
    size?: string;
    price: number;
    stock?: number;
    unit?: string;
    image?: string;
    isActive?: boolean;
  }>) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }

  async deleteProduct(id: string) {
    return this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  async updateStock(id: string, quantity: number, type: 'add' | 'subtract') {
    return this.request(`/products/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity, type }),
    });
  }

  // Stock Management endpoints
  async getStockTransactions(params?: {
    productId?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.productId) queryParams.append('productId', params.productId);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return this.request(`/stock/transactions${query ? `?${query}` : ''}`, {
      method: 'GET',
    });
  }

  async getStockTransaction(id: string) {
    return this.request(`/stock/transactions/${id}`, {
      method: 'GET',
    });
  }

  async createStockTransaction(data: {
    productId: string;
    type: 'stock-in' | 'stock-out';
    quantity: number;
    remarks?: string;
  }) {
    return this.request('/stock/update', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getStockStats() {
    return this.request('/stock/stats', {
      method: 'GET',
    });
  }

  async getProductHistory(productId: string, limit?: number) {
    const query = limit ? `?limit=${limit}` : '';
    return this.request(`/stock/history/${productId}${query}`, {
      method: 'GET',
    });
  }

  // Quotation Management endpoints
  async getQuotations(params?: {
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);

    const query = queryParams.toString();
    return this.request(`/quotations${query ? `?${query}` : ''}`, {
      method: 'GET',
    });
  }

  async getQuotation(id: string) {
    return this.request(`/quotations/${id}`, {
      method: 'GET',
    });
  }

  async createQuotation(data: {
    customerName: string;
    customerPhone?: string;
    customerEmail?: string;
    customerAddress?: string;
    quotationDate?: string;
    validUntil?: string;
    items: Array<{
      product: string;
      quantity: number;
      rate: number;
    }>;
    discount?: number;
    discountType?: 'percentage' | 'fixed';
    taxRate?: number;
    notes?: string;
    terms?: string;
    status?: string;
  }) {
    return this.request('/quotations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateQuotation(id: string, data: {
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    customerAddress?: string;
    quotationDate?: string;
    validUntil?: string;
    items?: Array<{
      product: string;
      quantity: number;
      rate: number;
    }>;
    discount?: number;
    discountType?: 'percentage' | 'fixed';
    taxRate?: number;
    notes?: string;
    terms?: string;
    status?: string;
  }) {
    return this.request(`/quotations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteQuotation(id: string) {
    return this.request(`/quotations/${id}`, {
      method: 'DELETE',
    });
  }

  async convertQuotationToInvoice(id: string) {
    return this.request(`/quotations/${id}/convert`, {
      method: 'POST',
    });
  }

  async getQuotationStats() {
    return this.request('/quotations/stats/summary', {
      method: 'GET',
    });
  }
}

export const api = new ApiClient(API_URL);
