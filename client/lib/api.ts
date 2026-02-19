const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://amp-tiles-backend.onrender.com/api'
    : 'http://localhost:5000/api');

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
  // Generic stats payload used across dashboard, lists, and stock pages
  stats?: unknown;
  // Quotation payloads (list + single)
  quotations?: unknown[];
  quotation?: unknown;
  // Invoice payloads (list + single) – use loose typing because different endpoints
  // can return slightly different invoice shapes, and UI files define their own types.
  invoices?: unknown[];
  invoice?: unknown;
  // Purchase order payloads (list + single)
  purchaseOrders?: unknown[];
  purchaseOrder?: unknown;
  // Supplier payloads (list + single)
  suppliers?: unknown[];
  supplier?: unknown;
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
      } catch {
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
    sortOrder?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

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

  // Supplier Management endpoints
  async getSuppliers(params?: {
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return this.request(`/suppliers${query ? `?${query}` : ''}`, {
      method: 'GET',
    });
  }

  async getSupplier(id: string) {
    return this.request(`/suppliers/${id}`, {
      method: 'GET',
    });
  }

  async createSupplier(data: {
    name: string;
    contactPerson?: string;
    phone: string;
    email?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      postcode?: string;
      country?: string;
    };
    website?: string;
    abn?: string;
    notes?: string;
    paymentTerms?: string;
  }) {
    return this.request('/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSupplier(id: string, data: {
    name?: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      postcode?: string;
      country?: string;
    };
    website?: string;
    abn?: string;
    notes?: string;
    status?: string;
    paymentTerms?: string;
  }) {
    return this.request(`/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSupplier(id: string) {
    return this.request(`/suppliers/${id}`, {
      method: 'DELETE',
    });
  }

  async getSupplierStats() {
    return this.request('/suppliers/stats/summary', {
      method: 'GET',
    });
  }

  // Purchase Order Management endpoints
  async getPurchaseOrders(params?: {
    search?: string;
    supplier?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.supplier) queryParams.append('supplier', params.supplier);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const query = queryParams.toString();
    return this.request(`/purchase-orders${query ? `?${query}` : ''}`, {
      method: 'GET',
    });
  }

  async getPurchaseOrder(id: string) {
    return this.request(`/purchase-orders/${id}`, {
      method: 'GET',
    });
  }

  async createPurchaseOrder(data: {
    supplier: string;
    poDate?: string;
    expectedDeliveryDate?: string;
    items: Array<{
      product: string;
      quantity: number;
      rate: number;
    }>;
    taxRate?: number;
    notes?: string;
    terms?: string;
  }) {
    return this.request('/purchase-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePurchaseOrder(id: string, data: {
    supplier?: string;
    poDate?: string;
    expectedDeliveryDate?: string;
    items?: Array<{
      product: string;
      quantity: number;
      rate: number;
    }>;
    taxRate?: number;
    notes?: string;
    terms?: string;
    status?: string;
  }) {
    return this.request(`/purchase-orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async receivePurchaseOrder(id: string) {
    return this.request(`/purchase-orders/${id}/receive`, {
      method: 'POST',
    });
  }

  async deletePurchaseOrder(id: string) {
    return this.request(`/purchase-orders/${id}`, {
      method: 'DELETE',
    });
  }

  async getPurchaseOrderStats() {
    return this.request('/purchase-orders/stats/summary', {
      method: 'GET',
    });
  }

  // Invoice Management endpoints
  async getInvoices(params?: {
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const query = queryParams.toString();
    return this.request(`/invoices${query ? `?${query}` : ''}`, {
      method: 'GET',
    });
  }

  async getInvoice(id: string) {
    return this.request(`/invoices/${id}`, {
      method: 'GET',
    });
  }

  async createInvoice(data: {
    quotation?: string;
    customerName: string;
    customerPhone?: string;
    customerEmail?: string;
    customerAddress?: string;
    invoiceDate?: string;
    dueDate?: string;
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
    return this.request('/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateInvoice(id: string, data: {
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    customerAddress?: string;
    invoiceDate?: string;
    dueDate?: string;
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
    return this.request(`/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async markInvoiceAsPaid(id: string, data: {
    paymentMethod?: string;
    paidAmount?: number;
    paidDate?: string;
  }) {
    return this.request(`/invoices/${id}/pay`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteInvoice(id: string) {
    return this.request(`/invoices/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Fetch invoice PDF as blob (for download). Uses same auth as other requests.
   */
  async getInvoicePdfBlob(id: string): Promise<Blob> {
    const token = localStorage.getItem('amp_token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${this.baseURL}/invoices/${id}/pdf`, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const errText = await response.text();
      let message = `HTTP ${response.status}`;
      try {
        const j = JSON.parse(errText);
        if (j.message) message = j.message;
      } catch {
        if (errText) message = errText;
      }
      throw new Error(message);
    }

    return response.blob();
  }

  async getInvoiceStats() {
    return this.request('/invoices/stats/summary', {
      method: 'GET',
    });
  }
}

export const api = new ApiClient(API_URL);
