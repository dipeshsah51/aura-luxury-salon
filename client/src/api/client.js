const API_BASE = '/api';

async function handleResponse(res) {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Salon Info
  getSalonInfo: () => fetch(`${API_BASE}/salon`).then(handleResponse),
  updateSalonInfo: (data) => fetch(`${API_BASE}/salon`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),

  // Auth
  login: (credentials) => fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  }).then(handleResponse),

  register: (data) => fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),

  sendOtp: (data) => fetch(`${API_BASE}/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),

  verifyOtpRegister: (data) => fetch(`${API_BASE}/auth/verify-otp-register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),

  verifyOtpLogin: (data) => fetch(`${API_BASE}/auth/verify-otp-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),

  // Services
  getServices: () => fetch(`${API_BASE}/services`).then(handleResponse),
  createService: (data) => fetch(`${API_BASE}/services`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  updateService: (id, data) => fetch(`${API_BASE}/services/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  deleteService: (id) => fetch(`${API_BASE}/services/${id}`, {
    method: 'DELETE'
  }).then(handleResponse),

  // Staff
  getStaff: (serviceId) => {
    const url = serviceId ? `${API_BASE}/staff?serviceId=${serviceId}` : `${API_BASE}/staff`;
    return fetch(url).then(handleResponse);
  },
  createStaff: (data) => fetch(`${API_BASE}/staff`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  updateStaff: (id, data) => fetch(`${API_BASE}/staff/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  deleteStaff: (id) => fetch(`${API_BASE}/staff/${id}`, {
    method: 'DELETE'
  }).then(handleResponse),

  // Schedule & Blocked Dates
  getWorkingHours: () => fetch(`${API_BASE}/schedule/working-hours`).then(handleResponse),
  updateWorkingHours: (data) => fetch(`${API_BASE}/schedule/working-hours`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  getBlockedDates: () => fetch(`${API_BASE}/schedule/blocked-dates`).then(handleResponse),
  addBlockedDate: (data) => fetch(`${API_BASE}/schedule/blocked-dates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  deleteBlockedDate: (id) => fetch(`${API_BASE}/schedule/blocked-dates/${id}`, {
    method: 'DELETE'
  }).then(handleResponse),

  // Real-Time Slot Availability
  getAvailability: (date, staffId, duration) => {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (staffId && staffId !== 'any' && staffId !== 'undefined' && staffId !== 'null' && typeof staffId === 'string') {
      params.append('staffId', staffId);
    }
    if (duration) params.append('serviceDuration', duration);
    return fetch(`${API_BASE}/availability?${params.toString()}`).then(handleResponse);
  },

  // Appointments
  getAppointments: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.customerEmail) params.append('customerEmail', filters.customerEmail);
    if (filters.date) params.append('date', filters.date);
    if (filters.staffId) params.append('staffId', filters.staffId);
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    return fetch(`${API_BASE}/appointments?${params.toString()}`).then(handleResponse);
  },
  getAppointmentById: (id) => fetch(`${API_BASE}/appointments/${id}`).then(handleResponse),
  bookAppointment: (data) => fetch(`${API_BASE}/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  rescheduleAppointment: (id, data) => fetch(`${API_BASE}/appointments/${id}/reschedule`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  cancelAppointment: (id, reason) => fetch(`${API_BASE}/appointments/${id}/cancel`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason })
  }).then(handleResponse),
  updateAppointmentStatus: (id, status) => fetch(`${API_BASE}/appointments/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  }).then(handleResponse),

  // Customers
  getCustomers: () => fetch(`${API_BASE}/customers`).then(handleResponse),
  createCustomer: (data) => fetch(`${API_BASE}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  updateCustomer: (id, data) => fetch(`${API_BASE}/customers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  deleteCustomer: (id) => fetch(`${API_BASE}/customers/${id}`, {
    method: 'DELETE'
  }).then(handleResponse),

  // Revenue & Analytics
  getRevenueAnalytics: () => fetch(`${API_BASE}/analytics/revenue`).then(handleResponse),

  // Notification logs
  getNotifications: () => fetch(`${API_BASE}/notifications`).then(handleResponse),

  // SMTP Configuration
  getSmtpSettings: () => fetch(`${API_BASE}/settings/smtp`).then(handleResponse),
  saveSmtpSettings: (data) => fetch(`${API_BASE}/settings/smtp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  testSmtp: (data) => fetch(`${API_BASE}/settings/test-smtp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse)
};

