import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  LayoutDashboard, Calendar, Scissors, Users, Clock,
  DollarSign, CheckCircle2, XCircle, AlertCircle, Plus,
  Trash2, Edit, Save, Lock, Shield, Search, TrendingUp,
  Mail, Phone, Smartphone, ChevronRight, BarChart3, Star,
  LogOut, ArrowLeft, Check, Store, Globe, UserCheck, X,
  KeyRound, RefreshCw, Sparkles
} from 'lucide-react';
import { AuraEmblem } from '../components/BrandLogo';

export default function AdminPortal({ onLogout, onSwitchToCustomer }) {
  const { user, isAdmin, login, verifyOtpLogin, sendOtp, demoLogin } = useAuth();
  const { showToast, showSimulatedDispatch } = useNotification();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'appointments', 'services', 'staff', 'schedule', 'customers', 'notifications'
  const [loading, setLoading] = useState(false);

  // Data states
  const [analytics, setAnalytics] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [workingHours, setWorkingHours] = useState({});
  const [blockedDates, setBlockedDates] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Gmail SMTP Outbound Configuration
  const [smtpConfig, setSmtpConfig] = useState({ host: 'smtp.gmail.com', port: 587, user: 'dsah56631@gmail.com', hasPass: false });
  const [appPasswordInput, setAppPasswordInput] = useState('');
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [testEmailInput, setTestEmailInput] = useState('dsah56631@gmail.com');
  const [testingSmtp, setTestingSmtp] = useState(false);

  // Appointment filters
  const [apptFilterStatus, setApptFilterStatus] = useState('all');
  const [apptFilterStaff, setApptFilterStaff] = useState('all');
  const [apptSearch, setApptSearch] = useState('');

  // Modals state
  const [serviceModal, setServiceModal] = useState({ open: false, editing: null });
  const [serviceForm, setServiceForm] = useState({
    name: '', category: 'Hair Styling', price: 90, duration: 60, description: '', image: '', popular: false
  });

  const [staffModal, setStaffModal] = useState({ open: false, editing: null });
  const [staffForm, setStaffForm] = useState({
    name: '', role: 'Master Stylist', bio: '', specialties: '', avatar: '', workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  });

  const [blockDateModal, setBlockDateModal] = useState(false);
  const [blockDateForm, setBlockDateForm] = useState({ date: '', reason: 'Private Event / Holiday', staffId: '' });

  // Customer modal state (Walk-In / Offline Customer)
  const [customerModal, setCustomerModal] = useState({ open: false, editing: null });
  const [customerForm, setCustomerForm] = useState({
    name: '', phone: '', email: '', totalSpent: 0, totalVisits: 1, vipStatus: false, notes: ''
  });

  // Walk-in / Offline Service Booking Modal
  const [walkInModal, setWalkInModal] = useState(false);
  const [walkInForm, setWalkInForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    serviceId: '',
    staffId: '',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '11:00 AM',
    status: 'completed',
    paymentStatus: 'paid_at_salon',
    notes: 'Walk-in client service'
  });

  // Admin gate state
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Director 2FA OTP state
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSentMessage, setOtpSentMessage] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(60);
  const [canResendOtp, setCanResendOtp] = useState(false);

  // OTP Countdown timer
  useEffect(() => {
    let timer;
    if (otpStep && otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    } else if (otpCountdown === 0) {
      setCanResendOtp(true);
    }
    return () => clearInterval(timer);
  }, [otpStep, otpCountdown]);

  // Initial load when admin is authenticated
  useEffect(() => {
    if (isAdmin) {
      loadAllAdminData();
    }
  }, [isAdmin]);

  const getClientDeviceInfo = () => {
    try {
      let deviceId = localStorage.getItem('aura_trusted_device_id');
      if (!deviceId) {
        deviceId = 'dev_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
        localStorage.setItem('aura_trusted_device_id', deviceId);
      }

      const ua = navigator.userAgent || '';
      const screenRes = `${window.screen.width || ''}x${window.screen.height || ''}`;
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
      const isMobile = /Mobi|Android|iPhone|iPad/i.test(ua);
      let deviceName = 'Desktop PC';
      if (/iPhone/i.test(ua)) deviceName = 'Apple iPhone';
      else if (/iPad/i.test(ua)) deviceName = 'Apple iPad';
      else if (/Android/i.test(ua)) {
        const m = ua.match(/Android\s+([0-9\.]+);\s*([^;)]+)/);
        deviceName = m ? `Android Device (${m[2].trim()})` : 'Android Device';
      } else if (/Macintosh|Mac OS X/i.test(ua)) deviceName = 'Macintosh / MacBook';
      else if (/Windows/i.test(ua)) deviceName = 'Windows PC';

      return {
        deviceId,
        userAgent: ua,
        screenResolution: screenRes,
        timezone: tz,
        isMobile,
        deviceName
      };
    } catch {
      return {};
    }
  };

  const handleAdminSignIn = async (e) => {
    if (e) e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const deviceInfo = getClientDeviceInfo();
      const res = await login(adminEmail, adminPassword, deviceInfo);
      if (!res.success) {
        setLoginError(res.error || "Authentication failed. Please verify credentials.");
        showToast(res.error || "Login failed", "error");
      } else if (res.requiresOtp) {
        setOtpStep(true);
        setOtpCountdown(60);
        setCanResendOtp(false);
        setOtpCode('');
        setOtpSentMessage(res.message || "A 6-digit OTP has been sent to your Gmail.");
        showToast("A 6-digit OTP has been sent to your Gmail", "info");
      } else if (res.user && res.user.role !== 'admin') {
        setLoginError("Access denied: You must be a Salon Director or Administrator to access this suite.");
        showToast("Access denied: Not an administrator account", "error");
      } else {
        showToast(`Welcome Director ${res.user?.name || 'Director'}`, "success");
      }
    } catch (err) {
      setLoginError(err.message || "Login failed");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleVerifyAdminOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanOtp = otpCode.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setLoginError("Please enter the complete 6-digit verification code from your Gmail.");
      return;
    }
    setOtpLoading(true);
    setLoginError('');
    try {
      const deviceInfo = getClientDeviceInfo();
      const res = await verifyOtpLogin(adminEmail, cleanOtp, deviceInfo);
      if (!res.success) {
        setLoginError(res.error || "Invalid or expired security code. Please check your Gmail.");
        showToast(res.error || "Verification failed", "error");
      } else if (res.user && res.user.role !== 'admin') {
        setLoginError("Access denied: Account is not an administrator.");
        showToast("Access denied: Not an administrator account", "error");
      } else {
        setOtpStep(false);
        setOtpCode('');
        showToast(`Director Identity Confirmed! Welcome, ${res.user?.name || 'Director'}`, "success");
      }
    } catch (err) {
      setLoginError(err.message || "Verification failed");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendAdminOtp = async () => {
    setOtpLoading(true);
    setLoginError('');
    try {
      const res = await sendOtp(adminEmail, 'admin_login', 'Salon Director');
      if (res.success) {
        setOtpCountdown(60);
        setCanResendOtp(false);
        showToast("New Director 2FA code dispatched to your Gmail!", "success");
      } else {
        setLoginError(res.error || "Failed to resend security code");
      }
    } catch (err) {
      setLoginError(err.message || "Failed to resend security code");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleQuickDirectorLogin = async () => {
    // Fills the required credentials and triggers authentic sign-in with 2FA dispatch
    setAdminEmail('dsah56631@gmail.com');
    setAdminPassword('Dip@1234');
    setLoginLoading(true);
    setLoginError('');
    try {
      const deviceInfo = getClientDeviceInfo();
      const res = await login('dsah56631@gmail.com', 'Dip@1234', deviceInfo);
      if (res.requiresOtp) {
        setOtpStep(true);
        setOtpCountdown(60);
        setCanResendOtp(false);
        setOtpCode('');
        setOtpSentMessage(res.message || "A 6-digit OTP has been sent to your Gmail.");
        showToast("A 6-digit OTP has been sent to your Gmail", "info");
      } else if (res.success) {
        showToast("Authenticated as Salon Director", "success");
      } else {
        setLoginError(res.error);
        showToast(res.error, "error");
      }
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [rev, apts, srvs, stf, hours, blk, cust, notifs, smtp] = await Promise.all([
        api.getRevenueAnalytics(),
        api.getAppointments(),
        api.getServices(),
        api.getStaff(),
        api.getWorkingHours(),
        api.getBlockedDates(),
        api.getCustomers(),
        api.getNotifications(),
        api.getSmtpSettings().catch(() => null)
      ]);

      setAnalytics(rev);
      setAppointments(apts);
      setServices(srvs);
      setStaffList(stf);
      setWorkingHours(hours);
      setBlockedDates(blk);
      setCustomers(cust);
      setNotifications(notifs);
      if (smtp) setSmtpConfig(smtp);
    } catch (err) {
      showToast("Error loading admin data: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSmtpSettings = async (e) => {
    e.preventDefault();
    if (!appPasswordInput.trim()) {
      showToast("Please enter your 16-character Google App Password.", "error");
      return;
    }
    setSavingSmtp(true);
    try {
      const res = await api.saveSmtpSettings({
        host: 'smtp.gmail.com',
        port: 587,
        user: 'dsah56631@gmail.com',
        pass: appPasswordInput.trim()
      });
      if (res.settings) setSmtpConfig(res.settings);
      setAppPasswordInput('');
      showToast("Gmail App Password saved! Real email delivery is now active.", "success");
    } catch (err) {
      showToast("Failed to save SMTP settings: " + err.message, "error");
    } finally {
      setSavingSmtp(false);
    }
  };

  const handleTestSmtp = async (e) => {
    e.preventDefault();
    if (!testEmailInput || !testEmailInput.includes('@')) {
      showToast("Please enter a valid recipient email for the test.", "error");
      return;
    }
    setTestingSmtp(true);
    try {
      const res = await api.testSmtp({ testEmail: testEmailInput.trim() });
      showToast(res.message || "Test email delivered successfully!", "success");
    } catch (err) {
      showToast("Test email failed: " + err.message, "error");
    } finally {
      setTestingSmtp(false);
    }
  };

  // Appointment status change
  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await api.updateAppointmentStatus(id, newStatus);
      showToast(`Appointment marked as ${newStatus}`, "success");
      const [updated, rev, updatedCust] = await Promise.all([
        api.getAppointments(),
        api.getRevenueAnalytics(),
        api.getCustomers()
      ]);
      setAppointments(updated);
      setAnalytics(rev);
      setCustomers(updatedCust);
    } catch (err) {
      showToast("Failed to update status: " + (err.message || ''), "error");
    }
  };

  // Customer Management (Walk-In Offline Guests & Inactive Guests)
  const handleOpenCustomerModal = (cust = null) => {
    if (cust) {
      setCustomerModal({ open: true, editing: cust });
      setCustomerForm({
        name: cust.name || '',
        phone: cust.phone || '',
        email: cust.email || '',
        totalSpent: cust.totalSpent || 0,
        totalVisits: cust.totalVisits || 1,
        vipStatus: Boolean(cust.vipStatus),
        notes: cust.notes || ''
      });
    } else {
      setCustomerModal({ open: true, editing: null });
      setCustomerForm({
        name: '', phone: '', email: '', totalSpent: 0, totalVisits: 1, vipStatus: false, notes: ''
      });
    }
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (!customerForm.name.trim()) {
      showToast("Please enter customer name", "error");
      return;
    }
    try {
      if (customerModal.editing) {
        await api.updateCustomer(customerModal.editing.id, customerForm);
        showToast("Customer details updated successfully", "success");
      } else {
        await api.createCustomer(customerForm);
        showToast("Walk-in customer added to directory", "success");
      }
      setCustomerModal({ open: false, editing: null });
      const [updatedCust, rev] = await Promise.all([
        api.getCustomers(),
        api.getRevenueAnalytics()
      ]);
      setCustomers(updatedCust);
      setAnalytics(rev);
    } catch (err) {
      showToast(err.message || "Failed to save customer", "error");
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (!window.confirm("Are you sure you want to remove this customer from the directory?")) return;
    try {
      await api.deleteCustomer(id);
      showToast("Customer record removed", "success");
      setCustomers(prev => prev.filter(c => c.id !== id));
      const rev = await api.getRevenueAnalytics();
      setAnalytics(rev);
    } catch (err) {
      showToast(err.message || "Failed to delete customer", "error");
    }
  };

  // Service CRUD
  const handleOpenServiceModal = (srv = null) => {
    if (srv) {
      setServiceModal({ open: true, editing: srv });
      setServiceForm({ ...srv });
    } else {
      setServiceModal({ open: true, editing: null });
      setServiceForm({
        name: '', category: 'Hair Styling', price: 90, duration: 60,
        description: '', image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80', popular: false
      });
    }
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    try {
      if (serviceModal.editing) {
        await api.updateService(serviceModal.editing.id, serviceForm);
        showToast("Service updated successfully", "success");
      } else {
        await api.createService(serviceForm);
        showToast("New service created", "success");
      }
      setServiceModal({ open: false, editing: null });
      const updated = await api.getServices();
      setServices(updated);
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm("Are you sure you want to delete this service?")) return;
    try {
      await api.deleteService(id);
      showToast("Service removed", "success");
      setServices(services.filter(s => s.id !== id));
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // Staff CRUD
  const handleOpenStaffModal = (st = null) => {
    if (st) {
      setStaffModal({ open: true, editing: st });
      setStaffForm({
        name: st.name,
        role: st.role,
        bio: st.bio || '',
        specialties: (st.specialties || []).join(', '),
        avatar: st.avatar || '',
        workingDays: st.workingDays || []
      });
    } else {
      setStaffModal({ open: true, editing: null });
      setStaffForm({
        name: '',
        role: 'Master Stylist',
        bio: '',
        specialties: 'Haircuts, Color, Blowout',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      });
    }
  };

  const handleSaveStaff = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: staffForm.name,
        role: staffForm.role,
        bio: staffForm.bio,
        avatar: staffForm.avatar,
        specialties: typeof staffForm.specialties === 'string'
          ? staffForm.specialties.split(',').map(s => s.trim()).filter(Boolean)
          : staffForm.specialties,
        workingDays: staffForm.workingDays
      };

      if (staffModal.editing) {
        await api.updateStaff(staffModal.editing.id, payload);
        showToast("Staff profile updated", "success");
      } else {
        await api.createStaff(payload);
        showToast("New staff member added", "success");
      }
      setStaffModal({ open: false, editing: null });
      const updated = await api.getStaff();
      setStaffList(updated);
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleDeleteStaff = async (id) => {
    if (!window.confirm("Remove this staff member from the salon?")) return;
    try {
      await api.deleteStaff(id);
      showToast("Staff member removed", "success");
      setStaffList(staffList.filter(s => s.id !== id));
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // Schedule & Working Hours
  const handleSaveHours = async () => {
    try {
      await api.updateWorkingHours(workingHours);
      showToast("Salon working hours saved", "success");
    } catch (err) {
      showToast("Failed to save hours", "error");
    }
  };

  // Blocked Dates
  const handleAddBlockedDate = async (e) => {
    e.preventDefault();
    if (!blockDateForm.date) return;
    try {
      await api.addBlockedDate({
        date: blockDateForm.date,
        reason: blockDateForm.reason,
        staffId: blockDateForm.staffId || null
      });
      showToast("Date blocked successfully", "success");
      setBlockDateModal(false);
      const blk = await api.getBlockedDates();
      setBlockedDates(blk);
    } catch (err) {
      showToast("Failed to block date", "error");
    }
  };

  const handleDeleteBlockedDate = async (id) => {
    try {
      await api.deleteBlockedDate(id);
      showToast("Blocked date removed", "success");
      setBlockedDates(blockedDates.filter(b => b.id !== id));
    } catch (err) {
      showToast("Failed to unblock date", "error");
    }
  };

  // Walk-In Service Creation
  const handleCreateWalkInBooking = async (e) => {
    e.preventDefault();
    if (!walkInForm.customerName.trim() || !walkInForm.customerPhone.trim()) {
      showToast("Please provide customer name and phone number.", "error");
      return;
    }

    try {
      const selectedService = services.find(s => s.id === walkInForm.serviceId) || services[0];
      const selectedStaff = staffList.find(st => st.id === walkInForm.staffId) || staffList[0];

      const cleanPhone = walkInForm.customerPhone.replace(/[^0-9]/g, '');
      const payload = {
        customerName: walkInForm.customerName.trim(),
        customerPhone: walkInForm.customerPhone.trim(),
        customerEmail: walkInForm.customerEmail.trim() || `walkin_${cleanPhone || Date.now()}@auraa.kesug.com`,
        serviceId: selectedService?.id,
        serviceName: selectedService?.name,
        servicePrice: selectedService?.price,
        staffId: selectedStaff?.id,
        staffName: selectedStaff?.name,
        date: walkInForm.date || new Date().toISOString().split('T')[0],
        timeSlot: walkInForm.timeSlot || '12:00 PM',
        status: walkInForm.status,
        source: 'offline',
        paymentStatus: walkInForm.paymentStatus,
        notes: walkInForm.notes
      };

      await api.bookAppointment(payload);
      showToast(
        walkInForm.status === 'completed'
          ? "✓ Walk-in service completed & offline revenue updated!"
          : "Walk-in appointment recorded",
        "success"
      );
      setWalkInModal(false);
      setWalkInForm({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        serviceId: '',
        staffId: '',
        date: new Date().toISOString().split('T')[0],
        timeSlot: '11:00 AM',
        status: 'completed',
        paymentStatus: 'paid_at_salon',
        notes: 'Walk-in client service'
      });

      // Live update all relevant datasets
      const [apts, rev, cust] = await Promise.all([
        api.getAppointments(),
        api.getRevenueAnalytics(),
        api.getCustomers()
      ]);
      setAppointments(apts);
      setAnalytics(rev);
      setCustomers(cust);
    } catch (err) {
      showToast("Failed to record walk-in: " + err.message, "error");
    }
  };

  // Filtered appointments
  const filteredAppointments = appointments.filter(a => {
    if (apptFilterStatus === 'online') {
      if ((a.source || 'online') === 'offline') return false;
    } else if (apptFilterStatus === 'offline') {
      if ((a.source || '') !== 'offline') return false;
    } else if (apptFilterStatus !== 'all' && a.status !== apptFilterStatus) {
      return false;
    }
    if (apptFilterStaff !== 'all' && a.staffId !== apptFilterStaff) return false;
    if (apptSearch) {
      const q = apptSearch.toLowerCase();
      const match = a.customerName?.toLowerCase().includes(q) ||
                    a.bookingCode?.toLowerCase().includes(q) ||
                    a.serviceName?.toLowerCase().includes(q) ||
                    a.customerPhone?.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Dedicated Admin Login Gate if not authenticated
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#070A10] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Ambient gold glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative w-full max-w-md bg-slate-900/95 border border-gold-500/30 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
          <div className="text-center space-y-3 mb-7">
            <div className="flex justify-center">
              <AuraEmblem size={56} animated={false} />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold tracking-widest text-white">AURA DIRECTOR</h2>
              <p className="text-xs text-gold-400 font-semibold uppercase tracking-wider mt-1">Management Suite • Staff Portal</p>
            </div>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              Restricted executive access for salon management, financial analytics, schedule control &amp; staff operations.
            </p>
          </div>

          {loginError && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          {otpSentMessage && otpStep && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{otpSentMessage}</span>
            </div>
          )}

          <form onSubmit={otpStep ? handleVerifyAdminOtp : handleAdminSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Director Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="Enter Director Email"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 focus:border-gold-400 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Security Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter Password"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 focus:border-gold-400 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition"
                />
              </div>
            </div>

            {/* Same page down on password: OTP option */}
            {otpStep && (
              <div className="p-3.5 rounded-xl bg-slate-800/90 border border-gold-500/40 space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-gold-400 uppercase tracking-wider">
                    Enter 6-Digit OTP Code
                  </label>
                  {canResendOtp ? (
                    <button
                      type="button"
                      onClick={handleResendAdminOtp}
                      disabled={otpLoading}
                      className="text-[11px] text-gold-400 hover:text-gold-300 font-semibold transition flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Resend OTP
                    </button>
                  ) : (
                    <span className="text-slate-500 font-mono text-[11px]">
                      Resend in {otpCountdown}s
                    </span>
                  )}
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-gold-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    autoFocus
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="0 0 0 0 0 0"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-gold-500/40 focus:border-gold-400 rounded-xl text-center font-mono font-bold tracking-[0.3em] text-white placeholder-slate-600 outline-none transition"
                  />
                </div>
              </div>
            )}

            <div className="p-2.5 rounded-xl bg-gold-500/10 border border-gold-500/20 text-[11px] text-gold-300 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-gold-400 shrink-0" />
              <span>A 6-digit OTP will be sent to your Gmail</span>
            </div>

            <button
              type="submit"
              disabled={loginLoading || otpLoading}
              className="btn-gold w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-gold-500/20 flex items-center justify-center gap-2 mt-2"
            >
              {loginLoading || otpLoading ? 'Authenticating...' : 'Authenticate'}
            </button>
          </form>

          {/* Director Login */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase tracking-widest text-center mb-2.5">
              Director Login
            </div>
            <button
              type="button"
              onClick={handleQuickDirectorLogin}
              disabled={loginLoading || otpLoading}
              className="w-full py-2.5 px-3 rounded-xl bg-gold-500/10 hover:bg-gold-500/20 border border-gold-500/30 text-xs font-semibold text-gold-300 transition flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4 text-gold-400" />
              <span>Click Salon Director Login</span>
            </button>
          </div>

          {/* Return to Client Site button */}
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={onSwitchToCustomer || onLogout}
              className="text-xs text-slate-400 hover:text-white transition flex items-center justify-center gap-1.5 mx-auto py-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Customer Website
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0E17] text-slate-100 flex flex-col md:flex-row">
      
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900/90 border-r border-slate-800 p-4 shrink-0 flex flex-col justify-between">
        <div>
          {/* Brand header */}
          <div className="p-3 mb-4 rounded-xl bg-gradient-to-r from-gold-500/10 to-transparent border border-gold-500/20">
            <div className="flex items-center gap-3">
              <AuraEmblem size={34} animated={false} />
              <div>
                <h2 className="font-serif font-bold text-white tracking-wide text-sm">AURA DIRECTOR</h2>
                <span className="text-[10px] text-gold-400 uppercase tracking-widest">Management Suite</span>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {[
              { id: 'overview', label: 'Revenue & Analytics', icon: LayoutDashboard },
              { id: 'appointments', label: 'Appointments Book', icon: Calendar, badge: appointments.filter(a => a.status === 'pending').length },
              { id: 'services', label: 'Services Menu', icon: Scissors },
              { id: 'staff', label: 'Barbers & Stylists', icon: Users },
              { id: 'schedule', label: 'Hours & Blocked Dates', icon: Clock },
              { id: 'customers', label: 'Customer Directory', icon: Star },
              { id: 'notifications', label: 'SMS & Email Outbox', icon: Smartphone, badge: notifications.length }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition ${
                    isActive
                      ? 'bg-gold-500 text-black shadow-lg shadow-gold-500/20 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge > 0 && (
                    <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
                      isActive ? 'bg-black text-gold-400' : 'bg-gold-500/20 text-gold-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Switcher */}
        <div className="pt-4 border-t border-slate-800 mt-6 space-y-3">
          <div className="text-[11px] text-slate-400 px-1 flex flex-col">
            <span className="text-slate-500 text-[10px] uppercase tracking-wider">Logged in as:</span>
            <strong className="text-gold-300 font-semibold">{user?.name || 'Salon Director'}</strong>
            <span className="text-[10px] text-slate-500 truncate">{user?.email || 'dsah56631@gmail.com'}</span>
          </div>
          <button
            onClick={onLogout || onSwitchToCustomer}
            className="w-full py-2 px-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs font-semibold text-rose-300 hover:bg-rose-500 hover:text-white transition flex items-center justify-center gap-1.5 shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out to Client Site
          </button>
        </div>
      </aside>

      {/* Main Admin Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {/* Top Director Bar */}
        <div className="mb-6 pb-4 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300 font-medium">AURA Director Workspace</span>
            <span className="text-slate-600">•</span>
            <span className="text-gold-400 font-semibold uppercase tracking-wider text-[11px]">Exclusive Admin Mode</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadAllAdminData}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 border border-slate-700 transition flex items-center gap-1"
            >
              ↻ {loading ? 'Syncing...' : 'Live Refresh'}
            </button>
            <button
              onClick={onLogout || onSwitchToCustomer}
              className="px-3 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-[11px] font-medium text-rose-300 hover:bg-rose-500 hover:text-white transition flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* TAB 1: REVENUE & OVERVIEW DASHBOARD */}
        {activeTab === 'overview' && analytics && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-serif text-2xl md:text-3xl font-bold text-white">Revenue & Executive Overview</h1>
                <p className="text-xs text-slate-400 mt-0.5">Real-time salon KPIs, earnings, and booking performance</p>
              </div>
              <button
                onClick={loadAllAdminData}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 transition"
              >
                ↻ Refresh Live Data
              </button>
            </div>

            {/* Primary Revenue KPI Cards (Online vs Offline Walk-In Revenue) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Gross Total Revenue */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-gold-500/40 relative overflow-hidden shadow-xl">
                <div className="flex items-center justify-between text-xs text-gold-400 font-semibold uppercase tracking-wider">
                  <span>Gross Salon Revenue</span>
                  <DollarSign className="w-4 h-4 text-gold-400" />
                </div>
                <div className="text-2xl md:text-3xl font-serif font-bold text-white mt-1.5">
                  ₹{(analytics.totalRevenue || 0).toLocaleString('en-IN')}
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> {analytics.completedCount || 0} completed
                  </span>
                  <span className="text-slate-400">Total Earned</span>
                </div>
              </div>

              {/* Online Website Revenue */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-cyan-500/30 relative overflow-hidden shadow-lg">
                <div className="flex items-center justify-between text-xs text-cyan-400 font-semibold uppercase tracking-wider">
                  <span>Online Bookings</span>
                  <Globe className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-2xl md:text-3xl font-serif font-bold text-white mt-1.5">
                  ₹{(analytics.onlineRevenue || 0).toLocaleString('en-IN')}
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-cyan-300 font-medium">
                    {analytics.onlineCompletedCount || 0} completed online
                  </span>
                  <span className="text-slate-500">
                    ₹{(analytics.onlineAverageTicket || 0).toLocaleString('en-IN')} avg
                  </span>
                </div>
              </div>

              {/* Offline Walk-In Revenue */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-amber-500/30 relative overflow-hidden shadow-lg">
                <div className="flex items-center justify-between text-xs text-amber-400 font-semibold uppercase tracking-wider">
                  <span>Offline / Walk-In</span>
                  <Store className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl md:text-3xl font-serif font-bold text-white mt-1.5">
                  ₹{(analytics.offlineRevenue || 0).toLocaleString('en-IN')}
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-amber-300 font-medium">
                    {analytics.offlineCompletedCount || 0} completed in salon
                  </span>
                  <span className="text-slate-500">
                    ₹{(analytics.offlineAverageTicket || 0).toLocaleString('en-IN')} avg
                  </span>
                </div>
              </div>

              {/* Average Ticket Size */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  <span>Average Ticket</span>
                  <BarChart3 className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-2xl md:text-3xl font-serif font-bold text-white mt-1.5">
                  ₹{(analytics.averageTicketValue || 0).toLocaleString('en-IN')}
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Per completed guest</span>
                  <span className="text-gold-400 font-medium">{customers.length} Guests in DB</span>
                </div>
              </div>
            </div>

            {/* Status Command Strip: Confirmed, Completed, Cancelled, and Pending */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white uppercase tracking-wider text-[11px]">
                  Appointment & Booking Status Breakdown
                </span>
                <span className="text-slate-400 text-[11px]">
                  Total Reservations: <strong className="text-white">{analytics.statusCounts?.total ?? appointments.length}</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Confirmed Count */}
                <div className="p-3 rounded-xl bg-slate-800/60 border border-sky-500/20 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-[10px] uppercase font-bold text-sky-400 tracking-wider">Confirmed</div>
                    <div className="text-xl font-serif font-bold text-white">
                      {analytics.statusCounts?.confirmed || 0}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>

                {/* Completed Count */}
                <div className="p-3 rounded-xl bg-slate-800/60 border border-emerald-500/20 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Completed</div>
                    <div className="text-xl font-serif font-bold text-white">
                      {analytics.statusCounts?.completed || 0}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                </div>

                {/* Cancelled Count (Prominently displayed alongside Confirmed & Completed) */}
                <div className="p-3 rounded-xl bg-slate-800/60 border border-rose-500/20 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">Cancelled</div>
                    <div className="text-xl font-serif font-bold text-white">
                      {analytics.statusCounts?.cancelled || 0}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
                    <XCircle className="w-4 h-4" />
                  </div>
                </div>

                {/* Pending Approval Count */}
                <div className="p-3 rounded-xl bg-slate-800/60 border border-amber-500/20 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Pending</div>
                    <div className="text-xl font-serif font-bold text-white">
                      {analytics.statusCounts?.pending || 0}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Revenue Channel Split Bar (Online vs Walk-In) */}
              {(analytics.totalRevenue || 0) > 0 && (
                <div className="pt-2">
                  <div className="flex justify-between text-[11px] mb-1.5 font-medium">
                    <span className="text-cyan-400 flex items-center gap-1">
                      <Globe className="w-3 h-3" /> Online Web Share: {Math.round(((analytics.onlineRevenue || 0) / analytics.totalRevenue) * 100)}%
                    </span>
                    <span className="text-amber-400 flex items-center gap-1">
                      <Store className="w-3 h-3" /> Offline Walk-In Share: {Math.round(((analytics.offlineRevenue || 0) / analytics.totalRevenue) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden flex">
                    <div
                      className="bg-cyan-500 h-2.5 transition-all duration-500"
                      style={{ width: `${Math.round(((analytics.onlineRevenue || 0) / analytics.totalRevenue) * 100)}%` }}
                    />
                    <div
                      className="bg-amber-500 h-2.5 transition-all duration-500"
                      style={{ width: `${Math.round(((analytics.offlineRevenue || 0) / analytics.totalRevenue) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Visual Revenue Bars & Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Monthly revenue bar visualization */}
              <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800">
                <h3 className="font-serif text-lg font-bold text-white mb-1 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-gold-400" /> Monthly Revenue Trajectory
                </h3>
                <p className="text-xs text-slate-400 mb-6">Real-time earnings from completed client reservations</p>

                <div className="space-y-4">
                  {(!analytics.monthlyRevenue || analytics.monthlyRevenue.length === 0 || (analytics.totalRevenue || 0) === 0) ? (
                    <div className="py-12 text-center text-slate-500 text-xs">
                      No completed appointment revenue recorded yet. Mark appointments as completed to see monthly revenue trajectory.
                    </div>
                  ) : (
                    analytics.monthlyRevenue.map((item) => {
                      const maxRev = Math.max(analytics.totalRevenue || 1, 5000);
                      const pct = Math.min(100, Math.round(((item.revenue || 0) / maxRev) * 100));
                      return (
                        <div key={item.month} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold text-slate-300">{item.month} 2026</span>
                            <span className="font-mono text-gold-300 font-bold">
                              ₹{(item.revenue || 0).toLocaleString('en-IN')} ({item.bookings || 0} completed)
                            </span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-amber-600 to-gold-400 h-3 rounded-full transition-all duration-500"
                              style={{ width: `${Math.max(pct, (item.revenue || 0) > 0 ? 5 : 0)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Top Stylists & Services Leaderboard */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
                <div>
                  <h3 className="font-serif text-base font-bold text-white mb-3">Top Services by Revenue</h3>
                  <div className="space-y-2.5">
                    {(!analytics.topServices || analytics.topServices.length === 0) ? (
                      <div className="text-slate-500 text-xs py-4 text-center">No completed services yet</div>
                    ) : (
                      analytics.topServices.map((srv, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs p-2 rounded-lg bg-slate-800/60">
                          <span className="truncate max-w-[160px] text-slate-200">{srv.name}</span>
                          <span className="font-mono font-bold text-gold-300">₹{(srv.revenue || 0).toLocaleString('en-IN')}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <h3 className="font-serif text-base font-bold text-white mb-3">Top Stylists</h3>
                  <div className="space-y-2.5">
                    {(!analytics.topStaff || analytics.topStaff.length === 0) ? (
                      <div className="text-slate-500 text-xs py-4 text-center">No completed bookings yet</div>
                    ) : (
                      analytics.topStaff.map((st, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs p-2 rounded-lg bg-slate-800/60">
                          <span className="truncate max-w-[160px] text-slate-200">{st.name}</span>
                          <span className="font-mono font-bold text-gold-300">{st.count} completed</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: APPOINTMENTS MANAGER */}
        {activeTab === 'appointments' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-serif text-2xl font-bold text-white">Appointments & Services</h1>
                <p className="text-xs text-slate-400 mt-0.5">Manage online client bookings and record offline walk-in services</p>
              </div>
              <button
                onClick={() => setWalkInModal(true)}
                className="btn-gold px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-gold-500/20"
              >
                <Store className="w-4 h-4" /> + Record Walk-In Service
              </button>
            </div>

            {/* Quick Status Filter Pills (Highlighting Confirmed, Completed, Cancelled, and Channels) */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setApptFilterStatus('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  apptFilterStatus === 'all'
                    ? 'bg-gold-500 text-black font-bold shadow-md'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                All ({appointments.length})
              </button>
              <button
                onClick={() => setApptFilterStatus('confirmed')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                  apptFilterStatus === 'confirmed'
                    ? 'bg-sky-500 text-white font-bold shadow-md'
                    : 'bg-slate-800/80 text-sky-400 hover:bg-slate-800'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed ({analytics?.statusCounts?.confirmed || appointments.filter(a => a.status === 'confirmed').length})
              </button>
              <button
                onClick={() => setApptFilterStatus('completed')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                  apptFilterStatus === 'completed'
                    ? 'bg-emerald-500 text-black font-bold shadow-md'
                    : 'bg-slate-800/80 text-emerald-400 hover:bg-slate-800'
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" /> Completed ({analytics?.statusCounts?.completed || appointments.filter(a => a.status === 'completed').length})
              </button>
              <button
                onClick={() => setApptFilterStatus('cancelled')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                  apptFilterStatus === 'cancelled'
                    ? 'bg-rose-500 text-white font-bold shadow-md'
                    : 'bg-slate-800/80 text-rose-400 hover:bg-slate-800'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" /> Cancelled ({analytics?.statusCounts?.cancelled || appointments.filter(a => a.status === 'cancelled').length})
              </button>
              <button
                onClick={() => setApptFilterStatus('offline')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                  apptFilterStatus === 'offline'
                    ? 'bg-amber-500 text-black font-bold shadow-md'
                    : 'bg-slate-800/80 text-amber-400 hover:bg-slate-800'
                }`}
              >
                <Store className="w-3.5 h-3.5" /> Walk-Ins ({appointments.filter(a => (a.source || '') === 'offline').length})
              </button>
              <button
                onClick={() => setApptFilterStatus('online')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                  apptFilterStatus === 'online'
                    ? 'bg-cyan-500 text-black font-bold shadow-md'
                    : 'bg-slate-800/80 text-cyan-400 hover:bg-slate-800'
                }`}
              >
                <Globe className="w-3.5 h-3.5" /> Online Web ({appointments.filter(a => (a.source || 'online') !== 'offline').length})
              </button>
            </div>

            {/* Filter controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Status Dropdown</label>
                <select
                  value={apptFilterStatus}
                  onChange={(e) => setApptFilterStatus(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                >
                  <option value="all">All Appointments ({appointments.length})</option>
                  <option value="confirmed">Confirmed Only</option>
                  <option value="completed">Completed Only</option>
                  <option value="cancelled">Cancelled Only</option>
                  <option value="pending">Pending Approval</option>
                  <option value="offline">Walk-In / Offline Services</option>
                  <option value="online">Online Web Bookings</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Stylist Filter</label>
                <select
                  value={apptFilterStaff}
                  onChange={(e) => setApptFilterStaff(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                >
                  <option value="all">All Barbers & Stylists</option>
                  {staffList.map(st => (
                    <option key={st.id} value={st.id}>{st.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Search Client / Ref</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search name, phone, code..."
                    value={apptSearch}
                    onChange={(e) => setApptSearch(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white"
                  />
                </div>
              </div>
            </div>

            {/* Table of appointments */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Ref & Date</th>
                    <th className="p-3.5">Channel</th>
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5">Service</th>
                    <th className="p-3.5">Stylist</th>
                    <th className="p-3.5">Amount</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        No appointments found matching current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredAppointments.map((apt) => (
                      <tr key={apt.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3.5">
                          <span className="font-mono font-bold text-gold-400 block">{apt.bookingCode}</span>
                          <span className="text-slate-400 text-[11px]">{apt.date} at {apt.timeSlot}</span>
                        </td>
                        <td className="p-3.5">
                          {apt.source === 'offline' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 inline-flex items-center gap-1 whitespace-nowrap">
                              <Store className="w-3 h-3" /> Walk-In
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 inline-flex items-center gap-1 whitespace-nowrap">
                              <Globe className="w-3 h-3" /> Online
                            </span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span className="font-semibold text-white block">{apt.customerName}</span>
                          <span className="text-slate-400 text-[11px] block">{apt.customerPhone}</span>
                          <span className="text-slate-500 text-[10px] truncate max-w-[140px] block">{apt.customerEmail}</span>
                        </td>
                        <td className="p-3.5">
                          <span className="text-slate-200 font-medium block">{apt.serviceName}</span>
                          <span className="text-slate-500 text-[11px]">{apt.serviceDuration} mins</span>
                        </td>
                        <td className="p-3.5 text-slate-300 font-medium">
                          {apt.staffName}
                        </td>
                        <td className="p-3.5 font-serif font-bold text-gold-300">
                          ₹{apt.totalAmount?.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            apt.status === 'confirmed'
                              ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                              : apt.status === 'completed'
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : apt.status === 'cancelled'
                              ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                              : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          }`}>
                            {apt.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                          {apt.status === 'pending' && (
                            <button
                              onClick={() => handleStatusUpdate(apt.id, 'confirmed')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-black font-semibold transition text-xs"
                              title="Approve booking"
                            >
                              Approve
                            </button>
                          )}
                          {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                            <button
                              onClick={() => handleStatusUpdate(apt.id, 'completed')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600/30 text-emerald-300 hover:bg-emerald-500 hover:text-black font-semibold transition text-xs shadow-sm"
                              title="Mark as completed & record salon revenue"
                            >
                              ✓ Complete
                            </button>
                          )}
                          {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                            <button
                              onClick={() => handleStatusUpdate(apt.id, 'cancelled')}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white transition text-xs"
                              title="Cancel appointment"
                            >
                              Cancel
                            </button>
                          )}
                          {apt.status === 'completed' && (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-bold text-[11px] inline-flex items-center gap-1">
                              <Check className="w-3.5 h-3.5 stroke-[3]" /> Completed
                            </span>
                          )}
                          {apt.status === 'cancelled' && (
                            <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/30 font-medium text-[11px]">
                              Cancelled
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: SERVICES MANAGEMENT (ADD / EDIT / DELETE) */}
        {activeTab === 'services' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-serif text-2xl font-bold text-white">Services Menu Management</h1>
                <p className="text-xs text-slate-400 mt-0.5">Add, edit pricing, update duration, or remove salon services</p>
              </div>
              <button
                onClick={() => handleOpenServiceModal()}
                className="btn-gold flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
              >
                <Plus className="w-4 h-4" /> Add New Service
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service) => (
                <div key={service.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-4 flex flex-col justify-between">
                  <div>
                    <div className="relative h-32 rounded-xl overflow-hidden mb-3">
                      <img src={service.image} alt={service.name} className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2 bg-slate-950/80 px-2 py-0.5 rounded text-[10px] font-semibold text-gold-400 border border-gold-500/20">
                        {service.category}
                      </div>
                      <div className="absolute top-2 right-2 bg-slate-950/80 px-2 py-0.5 rounded text-[10px] font-bold text-white">
                        ₹{service.price?.toLocaleString('en-IN')}
                      </div>
                    </div>

                    <h4 className="font-serif font-bold text-white text-base leading-snug">{service.name}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">{service.description}</p>
                    <div className="text-xs text-slate-500 mt-2 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" /> {service.duration} mins
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 mt-4 flex items-center justify-between">
                    <span className="text-[11px] text-gold-400">★ {service.rating} ({service.reviewsCount} reviews)</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenServiceModal(service)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteService(service.id)}
                        className="p-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900 text-rose-300 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: STAFF MANAGEMENT */}
        {activeTab === 'staff' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-serif text-2xl font-bold text-white">Barbers & Stylists Management</h1>
                <p className="text-xs text-slate-400 mt-0.5">Manage team members, roles, specialties, and schedules</p>
              </div>
              <button
                onClick={() => handleOpenStaffModal()}
                className="btn-gold flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
              >
                <Plus className="w-4 h-4" /> Add Master Artisan
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {staffList.map((st) => (
                <div key={st.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 flex flex-col justify-between">
                  <div className="flex items-start gap-4">
                    <img
                      src={st.avatar}
                      alt={st.name}
                      className="w-16 h-16 rounded-2xl object-cover border border-gold-500/30 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif font-bold text-white text-base">{st.name}</h4>
                        <span className="text-xs text-gold-400 font-semibold">★ {st.rating}</span>
                      </div>
                      <p className="text-xs text-gold-300/80 mb-2">{st.role}</p>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">{st.bio}</p>
                      
                      <div className="flex flex-wrap gap-1 mb-2">
                        {st.specialties?.map((sp, idx) => (
                          <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {sp}
                          </span>
                        ))}
                      </div>

                      <div className="text-[11px] text-slate-400">
                        Working Days: <strong className="text-slate-300">{st.workingDays?.join(', ')}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 mt-4 flex justify-end gap-2">
                    <button
                      onClick={() => handleOpenStaffModal(st)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit Profile
                    </button>
                    <button
                      onClick={() => handleDeleteStaff(st.id)}
                      className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900 text-rose-300 text-xs font-medium flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: WORKING HOURS & BLOCKED DATES */}
        {activeTab === 'schedule' && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Salon Working Hours Section */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-serif text-xl font-bold text-white">Salon Weekly Working Hours</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Control opening and closing time slots per weekday</p>
                </div>
                <button
                  onClick={handleSaveHours}
                  className="btn-gold flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
                >
                  <Save className="w-4 h-4" /> Save Operating Hours
                </button>
              </div>

              <div className="divide-y divide-slate-800">
                {Object.keys(workingHours).map((day) => {
                  const dayData = workingHours[day] || { open: "09:00", close: "19:00", isOpen: true };
                  return (
                    <div key={day} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 w-36">
                        <input
                          type="checkbox"
                          checked={dayData.isOpen}
                          onChange={(e) => {
                            setWorkingHours({
                              ...workingHours,
                              [day]: { ...dayData, isOpen: e.target.checked }
                            });
                          }}
                          className="w-4 h-4 rounded text-gold-500 focus:ring-gold-400 bg-slate-800 border-slate-700"
                        />
                        <span className={`text-sm font-semibold ${dayData.isOpen ? 'text-white' : 'text-slate-500 line-through'}`}>
                          {day}
                        </span>
                      </div>

                      {dayData.isOpen ? (
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-slate-400">Open:</span>
                          <input
                            type="time"
                            value={dayData.open}
                            onChange={(e) => {
                              setWorkingHours({
                                ...workingHours,
                                [day]: { ...dayData, open: e.target.value }
                              });
                            }}
                            className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-white"
                          />
                          <span className="text-slate-400">Close:</span>
                          <input
                            type="time"
                            value={dayData.close}
                            onChange={(e) => {
                              setWorkingHours({
                                ...workingHours,
                                [day]: { ...dayData, close: e.target.value }
                              });
                            }}
                            className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-white"
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-rose-400 font-medium">Closed for bookings</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Blocked Dates Section */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-serif text-xl font-bold text-white">Block Unavailable Dates & Holidays</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Dates added here are immediately disabled in customer booking calendar</p>
                </div>
                <button
                  onClick={() => setBlockDateModal(true)}
                  className="btn-gold flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
                >
                  <Plus className="w-4 h-4" /> Block Date
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {blockedDates.length === 0 ? (
                  <div className="col-span-2 p-6 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                    No blocked dates configured. The salon is open according to regular weekly hours.
                  </div>
                ) : (
                  blockedDates.map((block) => (
                    <div key={block.id} className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-rose-400 font-mono">{block.date}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/40">
                            {block.staffId ? 'Stylist Off' : 'Entire Salon Closed'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">{block.reason}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteBlockedDate(block.id)}
                        className="p-1.5 rounded-lg bg-slate-700 hover:bg-rose-900 text-slate-300 hover:text-white transition"
                        title="Unblock date"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 6: CUSTOMERS MANAGEMENT */}
        {activeTab === 'customers' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-serif text-2xl font-bold text-white">Customer Relationship Directory</h1>
                <p className="text-xs text-slate-400 mt-0.5">Track customer visit histories, lifetime spend, preferences, and offline salon guests</p>
              </div>
              <button
                onClick={() => handleOpenCustomerModal()}
                className="btn-gold flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-lg"
              >
                <Plus className="w-4 h-4" /> Add Walk-In Customer
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {customers.length === 0 ? (
                <div className="col-span-3 p-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-slate-900/40">
                  <Users className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                  <p className="font-medium text-slate-300 text-sm">Customer directory is currently empty</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Clients will automatically appear here when appointments are booked and completed, or you can register offline walk-in guests using the button above.
                  </p>
                </div>
              ) : (
                customers.map((c) => (
                  <div key={c.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 relative group">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-serif font-bold text-white text-base truncate">{c.name}</h4>
                        <span className="text-xs text-slate-400 truncate block">{c.email}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {c.vipStatus && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gold-500/20 text-gold-300 border border-gold-500/40">
                            VIP
                          </span>
                        )}
                        <button
                          onClick={() => handleOpenCustomerModal(c)}
                          className="p-1 rounded-lg text-slate-400 hover:text-gold-400 hover:bg-slate-800 transition"
                          title="Edit customer details"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(c.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                          title="Remove customer from directory"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 block">Total Visits</span>
                        <span className="font-bold text-white text-sm">{c.totalVisits || 0}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Lifetime Spend</span>
                        <span className="font-bold text-gold-300 text-sm font-serif">₹{(c.totalSpent || 0).toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-300">
                      <span className="text-slate-500 block text-[11px]">Phone:</span>
                      {c.phone}
                    </div>

                    {c.notes && (
                      <div className="p-2.5 rounded-lg bg-slate-800/50 text-[11px] text-slate-300 italic border border-slate-800">
                        "{c.notes}"
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 7: NOTIFICATIONS AUDIT LOG & GMAIL SMTP ENGINE */}
        {activeTab === 'notifications' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h1 className="font-serif text-2xl font-bold text-white">SMS & Email Outbox & Gmail SMTP</h1>
              <p className="text-xs text-slate-400 mt-0.5">Manage live outbound email delivery and view all customer confirmations</p>
            </div>

            {/* GMAIL SMTP SETTINGS CARD */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-gold-500/30 shadow-xl space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold text-white">Gmail SMTP Outbound Engine</h3>
                    <p className="text-xs text-slate-400">Delivers verification OTPs & appointment confirmations directly to user Gmail inboxes</p>
                  </div>
                </div>
                <div>
                  {smtpConfig.hasPass ? (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Gmail SMTP Connected
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      App Password Needed
                    </span>
                  )}
                </div>
              </div>

              {/* Status details & config grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Column 1: Google App Password configuration */}
                <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gold-400">Google App Password Setup</h4>
                  <div className="text-xs text-slate-300 space-y-1">
                    <div>Sender: <strong className="text-white font-mono">dsah56631@gmail.com</strong></div>
                    <div>Host: <span className="text-slate-400 font-mono">smtp.gmail.com:587 (STARTTLS)</span></div>
                  </div>

                  <form onSubmit={handleSaveSmtpSettings} className="space-y-2.5 pt-2">
                    <label className="block text-xs font-medium text-slate-300">
                      16-Character Google App Password:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        placeholder="e.g. abcd efgh ijkl mnop"
                        value={appPasswordInput}
                        onChange={(e) => setAppPasswordInput(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-gold-400"
                      />
                      <button
                        type="submit"
                        disabled={savingSmtp}
                        className="btn-gold px-4 py-2 rounded-lg text-xs font-bold tracking-wide uppercase shrink-0"
                      >
                        {savingSmtp ? 'Saving...' : 'Save Password'}
                      </button>
                    </div>
                  </form>

                  {/* 30-sec Google App Password guide */}
                  <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                    <div className="font-semibold text-gold-300 flex items-center gap-1">
                      ℹ️ How to get your 16-character code in 1 minute:
                    </div>
                    <ol className="list-decimal list-inside space-y-0.5 text-slate-400 pl-1">
                      <li>Log into <strong className="text-white">dsah56631@gmail.com</strong> in your browser.</li>
                      <li>Visit <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-gold-400 underline font-mono">myaccount.google.com/apppasswords</a>.</li>
                      <li>Type app name "Aura Salon" & click <strong>Create</strong>.</li>
                      <li>Paste the generated 16 letters into the box above!</li>
                    </ol>
                  </div>
                </div>

                {/* Column 2: Test Email Delivery */}
                <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gold-400">Live Delivery Verification</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Send a real test email to any inbox to verify outbound Gmail delivery in real time:
                    </p>

                    <form onSubmit={handleTestSmtp} className="space-y-2.5 pt-3">
                      <label className="block text-xs font-medium text-slate-300">
                        Recipient Email Address:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          required
                          placeholder="client@gmail.com"
                          value={testEmailInput}
                          onChange={(e) => setTestEmailInput(e.target.value)}
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-gold-400"
                        />
                        <button
                          type="submit"
                          disabled={testingSmtp}
                          className="px-4 py-2 rounded-lg bg-slate-800 border border-gold-500/40 text-gold-300 hover:bg-gold-500 hover:text-black font-semibold text-xs transition uppercase shrink-0"
                        >
                          {testingSmtp ? 'Sending...' : 'Send Test'}
                        </button>
                      </div>
                    </form>
                  </div>

                  <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-[11px] text-emerald-300">
                    ✓ All user verification OTPs during sign in/register are automatically delivered to each individual user's Gmail inbox!
                  </div>
                </div>

              </div>
            </div>

            {/* LIVE OUTBOX DISPATCH LOG */}
            <div className="pt-2">
              <h2 className="font-serif text-lg font-bold text-white mb-3">Appointment Confirmations Outbox Log</h2>
            </div>

            <div className="space-y-3">
              {notifications.map((notif) => (
                <div key={notif.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-800 border border-gold-500/20 text-gold-400 mt-0.5">
                    {notif.type === 'sms' ? <Smartphone className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white uppercase">{notif.type}</span>
                        <span className="text-xs text-slate-400">To: {notif.recipient}</span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {new Date(notif.sentAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-gold-300 mt-1">{notif.subject}</div>
                    <p className="text-xs text-slate-300 mt-1 whitespace-pre-line bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60 font-mono">
                      {notif.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* MODAL: ADD / EDIT SERVICE */}
      {serviceModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-gold-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-serif text-lg font-bold text-white mb-4">
              {serviceModal.editing ? 'Edit Service' : 'Add New Service'}
            </h3>
            <form onSubmit={handleSaveService} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Service Name</label>
                <input
                  type="text"
                  required
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category</label>
                  <input
                    type="text"
                    required
                    value={serviceForm.category}
                    onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={serviceForm.price}
                    onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    required
                    value={serviceForm.duration}
                    onChange={(e) => setServiceForm({ ...serviceForm, duration: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Image URL</label>
                  <input
                    type="text"
                    value={serviceForm.image}
                    onChange={(e) => setServiceForm({ ...serviceForm, image: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description</label>
                <textarea
                  rows={2}
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setServiceModal({ open: false, editing: null })}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-400"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-gold px-5 py-2 rounded-lg font-bold">
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT STAFF */}
      {staffModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-gold-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-serif text-lg font-bold text-white mb-4">
              {staffModal.editing ? 'Edit Staff Profile' : 'Add New Artisan'}
            </h3>
            <form onSubmit={handleSaveStaff} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Role / Title</label>
                <input
                  type="text"
                  required
                  value={staffForm.role}
                  onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Specialties (comma-separated)</label>
                <input
                  type="text"
                  value={staffForm.specialties}
                  onChange={(e) => setStaffForm({ ...staffForm, specialties: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Avatar Photo URL</label>
                <input
                  type="text"
                  value={staffForm.avatar}
                  onChange={(e) => setStaffForm({ ...staffForm, avatar: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Biography</label>
                <textarea
                  rows={2}
                  value={staffForm.bio}
                  onChange={(e) => setStaffForm({ ...staffForm, bio: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setStaffModal({ open: false, editing: null })}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-400"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-gold px-5 py-2 rounded-lg font-bold">
                  Save Artisan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BLOCK DATE */}
      {blockDateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-gold-500/30 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-serif text-lg font-bold text-white mb-4">Block Unavailable Date</h3>
            <form onSubmit={handleAddBlockedDate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Date to Block *</label>
                <input
                  type="date"
                  required
                  value={blockDateForm.date}
                  onChange={(e) => setBlockDateForm({ ...blockDateForm, date: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Reason (Holiday / Event)</label>
                <input
                  type="text"
                  value={blockDateForm.reason}
                  onChange={(e) => setBlockDateForm({ ...blockDateForm, reason: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setBlockDateModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-400"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-gold px-5 py-2 rounded-lg font-bold">
                  Confirm Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT CUSTOMER */}
      {customerModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-gold-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-serif text-lg font-bold text-white mb-4">
              {customerModal.editing ? 'Edit Customer Details' : 'Add Walk-In / Offline Customer'}
            </h3>
            <form onSubmit={handleSaveCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Nair"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Mobile Phone *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98401 23456"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="client@example.com (auto-generated if blank)"
                  value={customerForm.email}
                  onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Total Visits</label>
                  <input
                    type="number"
                    min={0}
                    value={customerForm.totalVisits}
                    onChange={(e) => setCustomerForm({ ...customerForm, totalVisits: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Lifetime Spend (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={customerForm.totalSpent}
                    onChange={(e) => setCustomerForm({ ...customerForm, totalSpent: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Hair / Skin Notes / Preferences</label>
                <textarea
                  rows={2}
                  placeholder="Allergies, preferred styling, walk-in notes..."
                  value={customerForm.notes}
                  onChange={(e) => setCustomerForm({ ...customerForm, notes: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="vipStatusCheck"
                  checked={customerForm.vipStatus}
                  onChange={(e) => setCustomerForm({ ...customerForm, vipStatus: e.target.checked })}
                  className="rounded bg-slate-800 border-slate-700 text-gold-400 focus:ring-0"
                />
                <label htmlFor="vipStatusCheck" className="text-slate-300 font-medium cursor-pointer">Mark as VIP Guest</label>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setCustomerModal({ open: false, editing: null })}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-gold px-5 py-2 rounded-lg font-bold">
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RECORD WALK-IN / OFFLINE SERVICE */}
      {walkInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border border-gold-500/30 rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setWalkInModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-xl bg-gold-500/20 text-gold-400">
                <Store className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-serif text-lg font-bold text-white">Record Offline / Walk-In Service</h3>
                <p className="text-[11px] text-slate-400">Log in-salon walk-in guest, assign specialist, and record offline revenue</p>
              </div>
            </div>

            <form onSubmit={handleCreateWalkInBooking} className="space-y-3.5 mt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Guest Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma"
                    value={walkInForm.customerName}
                    onChange={(e) => setWalkInForm({ ...walkInForm, customerName: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98401 23456"
                    value={walkInForm.customerPhone}
                    onChange={(e) => setWalkInForm({ ...walkInForm, customerPhone: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="guest@example.com (optional)"
                  value={walkInForm.customerEmail}
                  onChange={(e) => setWalkInForm({ ...walkInForm, customerEmail: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Select Service *</label>
                <select
                  required
                  value={walkInForm.serviceId}
                  onChange={(e) => setWalkInForm({ ...walkInForm, serviceId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-medium"
                >
                  <option value="">-- Choose Salon Service --</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} — ₹{s.price?.toLocaleString('en-IN')} ({s.duration} mins)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Assigned Stylist / Specialist</label>
                <select
                  value={walkInForm.staffId}
                  onChange={(e) => setWalkInForm({ ...walkInForm, staffId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                >
                  <option value="">-- Any Available Stylist --</option>
                  {staffList.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Service Date</label>
                  <input
                    type="date"
                    value={walkInForm.date}
                    onChange={(e) => setWalkInForm({ ...walkInForm, date: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Time</label>
                  <input
                    type="text"
                    value={walkInForm.timeSlot}
                    onChange={(e) => setWalkInForm({ ...walkInForm, timeSlot: e.target.value })}
                    placeholder="e.g. 02:30 PM"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Service Status</label>
                  <select
                    value={walkInForm.status}
                    onChange={(e) => setWalkInForm({ ...walkInForm, status: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-semibold text-emerald-400"
                  >
                    <option value="completed">✓ Completed & Paid (Records Offline Revenue)</option>
                    <option value="confirmed">● Confirmed (Waiting / In Salon)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Payment Method</label>
                  <select
                    value={walkInForm.paymentStatus}
                    onChange={(e) => setWalkInForm({ ...walkInForm, paymentStatus: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  >
                    <option value="paid_cash">Cash at Reception</option>
                    <option value="paid_upi">UPI / GPay / PhonePe</option>
                    <option value="paid_card">Credit / Debit Card</option>
                    <option value="pay_at_salon">Pay Later at Salon</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Special Notes</label>
                <input
                  type="text"
                  placeholder="Styling preferences, bridal notes, etc."
                  value={walkInForm.notes}
                  onChange={(e) => setWalkInForm({ ...walkInForm, notes: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setWalkInModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-gold px-5 py-2 rounded-lg font-bold flex items-center gap-1.5 shadow-lg">
                  <Check className="w-4 h-4 stroke-[3]" /> Save & Record Walk-In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
