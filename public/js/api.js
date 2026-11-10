// API Client and Toast Notification System
const Toast = {
  show(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const colors = {
      success: 'bg-emerald-600 text-white border-emerald-700',
      error: 'bg-rose-600 text-white border-rose-700',
      warning: 'bg-amber-500 text-white border-amber-600',
      info: 'bg-slate-800 text-white border-slate-900'
    };

    const icons = {
      success: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`,
      error: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`,
      warning: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`,
      info: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`
    };

    toast.className = `flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium border transition-all duration-300 transform translate-y-2 opacity-0 ${colors[type] || colors.info}`;
    toast.innerHTML = `
      ${icons[type] || icons.info}
      <div class="flex-1">${message}</div>
    `;

    container.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    }, 10);

    // Auto remove
    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },
  success(msg) { this.show(msg, 'success'); },
  error(msg) { this.show(msg, 'error'); },
  warning(msg) { this.show(msg, 'warning'); },
  info(msg) { this.show(msg, 'info'); }
};

const API = {
  getToken() {
    return localStorage.getItem('token');
  },
  setToken(token) {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  },
  getHeaders(isFormData = false) {
    const headers = {};
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  },

  async request(endpoint, options = {}) {
    const isFormData = options.body instanceof FormData;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(isFormData),
        ...(options.headers || {})
      }
    };

    try {
      const response = await fetch(`/api${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 && !endpoint.includes('/auth/login')) {
          this.setToken(null);
          window.location.reload();
        }
        throw new Error(data.error || 'خطایی در ارتباط با سرور رخ داد.');
      }
      return data;
    } catch (err) {
      throw err;
    }
  },

  // Auth
  async login(username, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    this.setToken(data.token);
    return data;
  },

  async getMe() {
    return await this.request('/auth/me');
  },

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (e) {}
    this.setToken(null);
  },

  // Organizations
  async getOrganizations() {
    return await this.request('/organizations');
  },

  // Requests
  async getRequests(filters = {}) {
    const params = new URLSearchParams();
    if (filters.organization_id) params.append('organization_id', filters.organization_id);
    if (filters.status) params.append('status', filters.status);
    if (filters.request_type) params.append('request_type', filters.request_type);
    if (filters.search) params.append('search', filters.search);

    const query = params.toString() ? `?${params.toString()}` : '';
    return await this.request(`/requests${query}`);
  },

  async getRequest(id) {
    return await this.request(`/requests/${id}`);
  },

  async submitRequest(formData) {
    return await this.request('/requests', {
      method: 'POST',
      body: formData
    });
  },

  async updateStatus(id, status) {
    return await this.request(`/requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  async batchUpdateStatus(ids, status) {
    return await this.request('/requests/batch-status', {
      method: 'POST',
      body: JSON.stringify({ ids, status })
    });
  },

  async deleteRequest(id) {
    return await this.request(`/requests/${id}`, {
      method: 'DELETE'
    });
  },

  // Messages (Officer <-> Admin)
  async getMessages() {
    return await this.request('/messages');
  },

  async getOfficerThread(userId) {
    return await this.request(`/messages/thread/${userId}`);
  },

  async sendMessage(message, target_user_id = null) {
    return await this.request('/messages', {
      method: 'POST',
      body: JSON.stringify({ message, target_user_id })
    });
  },

  async getUnreadMessageCount() {
    return await this.request('/messages/unread-count');
  },

  // Stats & Users (Admin)
  async getStats() {
    return await this.request('/stats');
  },

  async getUsers() {
    return await this.request('/users');
  },

  async createUser(userData) {
    return await this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  async updateUser(id, userData) {
    return await this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }
};

window.Toast = Toast;
window.API = API;
