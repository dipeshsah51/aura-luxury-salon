import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  X, Calendar as CalendarIcon, Clock, User, Scissors, Check,
  ChevronRight, ChevronLeft, Sparkles, AlertCircle, ShieldCheck,
  CreditCard, Phone, Mail, FileText, MessageCircle
} from 'lucide-react';

export default function BookingModal({
  isOpen,
  onClose,
  initialService = null,
  initialStaff = null,
  onBookingSuccess
}) {
  const { user } = useAuth();
  const { showToast, showSimulatedDispatch } = useNotification();

  const [step, setStep] = useState(1); // 1: Service, 2: Stylist, 3: Date & Slots, 4: Customer Info, 5: Confirmed
  const [services, setServices] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Selections
  const [selectedService, setSelectedService] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState('any'); // 'any' or staff object
  const [selectedDate, setSelectedDate] = useState(() => {
    // Tomorrow by default
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Time slot fetching state
  const [availabilityData, setAvailabilityData] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Customer form details
  const [customerForm, setCustomerForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    notes: '',
    paymentPreference: 'pay_at_salon'
  });

  // Confirmed booking response
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Update customer form when user logs in
  useEffect(() => {
    if (user) {
      setCustomerForm(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone
      }));
    }
  }, [user]);

  // Load initial services and staff
  useEffect(() => {
    if (isOpen) {
      loadData();
      if (initialService) {
        setSelectedService(initialService);
        setStep(2); // Jump straight to stylist selection
      } else {
        setStep(1);
      }
      if (initialStaff) {
        setSelectedStaff(initialStaff);
      }
    }
  }, [isOpen, initialService, initialStaff]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [srvs, stf] = await Promise.all([
        api.getServices(),
        api.getStaff()
      ]);
      setServices(srvs);
      setStaffList(stf);
    } catch (err) {
      showToast("Failed to load salon options", "error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch available slots whenever date or stylist changes
  useEffect(() => {
    if (step === 3 && selectedDate) {
      fetchSlots();
    }
  }, [step, selectedDate, selectedStaff, selectedService]);

  const fetchSlots = async () => {
    setLoadingSlots(true);
    setSelectedSlot(null);
    try {
      const staffId = (!selectedStaff || selectedStaff === 'any') ? null : (selectedStaff?.id || null);
      const duration = selectedService?.duration || 60;
      const data = await api.getAvailability(selectedDate, staffId, duration);
      setAvailabilityData(data);
    } catch (err) {
      setAvailabilityData({
        isOpen: false,
        reason: err?.message || "Unable to retrieve availability.",
        slots: []
      });
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleNext = () => {
    if (step === 1 && !selectedService) {
      showToast("Please choose a service to proceed", "error");
      return;
    }
    if (step === 3 && !selectedSlot) {
      showToast("Please select an available appointment time slot", "error");
      return;
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!customerForm.name || !customerForm.email || !customerForm.phone) {
      showToast("Please provide your name, email, and mobile number", "error");
      return;
    }

    setLoading(true);
    try {
      const bookingPayload = {
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        servicePrice: selectedService.price,
        duration: selectedService.duration || 60,
        staffId: (!selectedStaff || selectedStaff === 'any') ? null : selectedStaff.id,
        staffName: (!selectedStaff || selectedStaff === 'any') ? 'First Available Stylist' : selectedStaff.name,
        date: selectedDate,
        timeSlot: selectedSlot.raw || selectedSlot.time,
        customerName: customerForm.name,
        customerEmail: customerForm.email,
        customerPhone: customerForm.phone,
        notes: customerForm.notes,
        paymentStatus: customerForm.paymentPreference
      };

      const res = await api.bookAppointment(bookingPayload);
      const appointmentObj = res?.appointment || res;
      setConfirmedBooking(appointmentObj);
      setStep(5); // Confirmed screen

      // Launch Confetti!
      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}

      showToast("✨ Appointment Booked Successfully!", "success");

      // Dispatch simulated SMS/Email notifications
      if (res?.notifications && res.notifications.length > 0) {
        showSimulatedDispatch(res.notifications);
      }

      if (onBookingSuccess) {
        onBookingSuccess(appointmentObj);
      }
    } catch (err) {
      showToast(err.message || "Failed to book appointment", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-[#0F172A] border border-gold-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-white tracking-wide">
                Bespoke Appointment Booking
              </h2>
              <p className="text-xs text-gold-400/80 uppercase tracking-wider">
                Step {step} of 4 • {step === 1 ? 'Select Service' : step === 2 ? 'Select Stylist' : step === 3 ? 'Date & Time' : step === 4 ? 'Client Details' : 'Confirmed'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        {step < 5 && (
          <div className="w-full bg-slate-800 h-1">
            <div
              className="bg-gold-500 h-1 transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {/* STEP 1: SERVICE SELECTION */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-serif font-bold text-white">Choose Your Desired Service</h3>
                <span className="text-xs text-slate-400">{services.length} luxury treatments available</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {services.map((service) => {
                  const isSelected = selectedService?.id === service.id;
                  return (
                    <div
                      key={service.id}
                      onClick={() => setSelectedService(service)}
                      className={`cursor-pointer p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                        isSelected
                          ? 'border-gold-400 bg-gold-500/10 shadow-lg shadow-gold-500/10 ring-1 ring-gold-400'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-gold-400 px-2 py-0.5 rounded bg-gold-500/10 border border-gold-500/20">
                            {service.category}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {service.duration} mins
                          </span>
                        </div>
                        <h4 className="font-semibold text-white text-base leading-tight mb-1">
                          {service.name}
                        </h4>
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {service.description}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800/80">
                        <span className="text-base font-bold text-gold-300">
                          ₹{service.price?.toLocaleString('en-IN')}
                        </span>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border text-xs ${
                          isSelected ? 'bg-gold-500 text-black border-gold-400' : 'border-slate-700 text-slate-600'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: STYLIST / BARBER SELECTION */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-serif font-bold text-white">Select Your Master Artisan</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Choose a dedicated stylist or select first available for earliest openings
                </p>
              </div>

              {/* Any available option */}
              <div
                onClick={() => setSelectedStaff('any')}
                className={`cursor-pointer p-4 rounded-xl border flex items-center justify-between transition-all ${
                  selectedStaff === 'any'
                    ? 'border-gold-400 bg-gold-500/10 ring-1 ring-gold-400'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-800 border border-gold-500/30 flex items-center justify-center text-gold-400 text-lg">
                    ✨
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-sm">First Available Master Artisan</h4>
                    <p className="text-xs text-slate-400">Maximum scheduling flexibility & fastest confirmation</p>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border text-xs ${
                  selectedStaff === 'any' ? 'bg-gold-500 text-black border-gold-400' : 'border-slate-700 text-slate-600'
                }`}>
                  {selectedStaff === 'any' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>

              {/* Staff Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {staffList.map((st) => {
                  const isSelected = selectedStaff?.id === st.id;
                  return (
                    <div
                      key={st.id}
                      onClick={() => setSelectedStaff(st)}
                      className={`cursor-pointer p-4 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-gold-400 bg-gold-500/10 ring-1 ring-gold-400'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={st.avatar}
                          alt={st.name}
                          className="w-12 h-12 rounded-full object-cover border border-gold-500/30 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-white text-sm truncate">{st.name}</h4>
                            <span className="text-xs text-gold-400 font-medium flex items-center gap-1">
                              ★ {st.rating}
                            </span>
                          </div>
                          <p className="text-xs text-gold-300/80 truncate mb-1">{st.role}</p>
                          <div className="flex flex-wrap gap-1">
                            {st.specialties?.slice(0, 2).map((sp, idx) => (
                              <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                                {sp}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: DATE & TIME SLOTS */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-serif font-bold text-white">Choose Date & Reserved Slot</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Available time slots are computed live based on salon hours and stylist availability
                </p>
              </div>

              {/* Date Input */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-gold-400" />
                  <span className="text-sm font-medium text-white">Appointment Date:</span>
                </div>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-gold-400"
                />
              </div>

              {/* Loading Slots */}
              {loadingSlots && (
                <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs">Computing live opening slots...</p>
                </div>
              )}

              {/* Blocked or Closed Notice */}
              {!loadingSlots && availabilityData && !availabilityData.isOpen && (
                <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-start gap-3 text-rose-200">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h5 className="font-semibold text-sm">Unavailable Date</h5>
                    <p className="text-xs text-rose-300/80 mt-0.5">{availabilityData.reason}</p>

                    {/* 1-click fallback if specific stylist is off-duty */}
                    {selectedStaff && selectedStaff !== 'any' && (
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() => setSelectedStaff('any')}
                          className="px-3.5 py-2 rounded-lg bg-gold-500 text-black text-xs font-semibold hover:bg-gold-400 transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Switch to First Available Stylist (View Open Slots)
                        </button>
                      </div>
                    )}

                    <p className="text-xs text-slate-400 mt-2">
                      Please pick another date on the calendar{selectedStaff && selectedStaff !== 'any' ? ' or choose another stylist above' : ''}.
                    </p>
                  </div>
                </div>
              )}

              {/* Available Slots Grid */}
              {!loadingSlots && availabilityData && availabilityData.isOpen && (
                <div className="space-y-4">
                  <div className="text-xs text-slate-400 flex items-center justify-between">
                    <span>
                      Operating Hours: {availabilityData.operatingHours || (availabilityData.hours ? `${availabilityData.hours.open} - ${availabilityData.hours.close}` : '09:00 - 21:00')}
                    </span>
                    <span className="text-gold-400 font-medium">
                      Duration: {selectedService?.duration || 60} mins
                    </span>
                  </div>

                  {availabilityData.slots.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 border border-dashed border-slate-800 rounded-xl">
                      No openings remaining on this date. Please try another day.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(() => {
                        const getSlotPeriod = (s) => {
                          if (s.period) return s.period;
                          const hour = parseInt((s.raw || s.time || '00:00').split(':')[0], 10);
                          if (hour < 12) return 'morning';
                          if (hour < 17) return 'afternoon';
                          return 'evening';
                        };

                        const periods = ['morning', 'afternoon', 'evening'];
                        const renderedAny = periods.some(p => availabilityData.slots.some(s => getSlotPeriod(s) === p));

                        if (!renderedAny && availabilityData.slots.length > 0) {
                          return (
                            <div className="space-y-2">
                              <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-gold-400" />
                                Available Time Slots
                              </h5>
                              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                {availabilityData.slots.map((slot, idx) => {
                                  const isSelected = selectedSlot?.raw === slot.raw;
                                  return (
                                    <button
                                      key={idx}
                                      disabled={!slot.available}
                                      onClick={() => setSelectedSlot(slot)}
                                      className={`py-2 px-2.5 rounded-lg text-xs font-medium border text-center transition-all ${
                                        !slot.available
                                          ? 'bg-slate-900/40 border-slate-800/60 text-slate-600 cursor-not-allowed line-through'
                                          : isSelected
                                          ? 'bg-gold-500 text-black border-gold-400 font-bold shadow-md shadow-gold-500/20'
                                          : 'bg-slate-900 border-slate-700/80 text-slate-200 hover:border-gold-400 hover:bg-slate-800'
                                      }`}
                                    >
                                      {slot.time}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }

                        return periods.map((period) => {
                          const periodSlots = availabilityData.slots.filter(s => getSlotPeriod(s) === period);
                          if (periodSlots.length === 0) return null;

                          return (
                            <div key={period} className="space-y-2">
                              <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-gold-400" />
                                {period} Slots
                              </h5>
                              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                {periodSlots.map((slot, idx) => {
                                  const isSelected = selectedSlot?.raw === slot.raw;
                                  return (
                                    <button
                                      key={idx}
                                      disabled={!slot.available}
                                      onClick={() => setSelectedSlot(slot)}
                                      className={`py-2 px-2.5 rounded-lg text-xs font-medium border text-center transition-all ${
                                        !slot.available
                                          ? 'bg-slate-900/40 border-slate-800/60 text-slate-600 cursor-not-allowed line-through'
                                          : isSelected
                                          ? 'bg-gold-500 text-black border-gold-400 font-bold shadow-md shadow-gold-500/20'
                                          : 'bg-slate-900 border-slate-700/80 text-slate-200 hover:border-gold-400 hover:bg-slate-800'
                                      }`}
                                    >
                                      {slot.time}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: CUSTOMER DETAILS */}
          {step === 4 && (
            <form onSubmit={handleConfirmBooking} className="space-y-4">
              <div>
                <h3 className="text-lg font-serif font-bold text-white">Client Information & Confirmation</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Confirm your contact details to receive your instant SMS & Email access pass
                </p>
              </div>

              {/* Booking Summary Box */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-gold-500/20 flex flex-col sm:flex-row justify-between gap-3">
                <div>
                  <div className="text-xs text-gold-400 font-semibold">{selectedService?.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Stylist: {selectedStaff === 'any' ? 'First Available Master' : selectedStaff?.name}
                  </div>
                  <div className="text-xs text-slate-400">
                    Schedule: {selectedDate} at {selectedSlot?.time} ({selectedService?.duration} mins)
                  </div>
                </div>
                <div className="text-right flex flex-col justify-center">
                  <div className="text-xs text-slate-400 uppercase tracking-wider">Total Value</div>
                  <div className="text-xl font-serif font-bold text-gold-300">₹{selectedService?.price?.toLocaleString('en-IN')}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Full Name *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ananya Krishnan"
                      value={customerForm.name}
                      onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                      className="w-full bg-slate-800/90 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-gold-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email Address (for Receipt) *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      placeholder="ananya@example.com"
                      value={customerForm.email}
                      onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                      className="w-full bg-slate-800/90 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-gold-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number (for SMS & WhatsApp) *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      required
                      placeholder="+91 98401 23456"
                      value={customerForm.phone}
                      onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                      className="w-full bg-slate-800/90 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-gold-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Payment Preference</label>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <select
                      value={customerForm.paymentPreference}
                      onChange={(e) => setCustomerForm({ ...customerForm, paymentPreference: e.target.value })}
                      className="w-full bg-slate-800/90 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-gold-400"
                    >
                      <option value="pay_at_salon">Pay at Salon upon Arrival (UPI / Card / Cash)</option>
                      <option value="paid">Demo Online Prepayment (Simulated)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Special Requests / Hair & Skin Notes (Optional)</label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <textarea
                    rows={2}
                    placeholder="Bridal trial notes, allergies, skin sensitivities..."
                    value={customerForm.notes}
                    onChange={(e) => setCustomerForm({ ...customerForm, notes: e.target.value })}
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-gold-400"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/20 flex items-center gap-2 text-xs text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Complimentary rescheduling or cancellation up to 4 hours in advance.</span>
              </div>
            </form>
          )}

          {/* STEP 5: BOOKING CONFIRMED */}
          {step === 5 && confirmedBooking && (
            <div className="py-6 text-center space-y-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-gold-500/20 border-2 border-gold-400 flex items-center justify-center text-gold-300 text-2xl shadow-xl shadow-gold-500/20">
                ✓
              </div>

              <div>
                <span className="text-xs uppercase tracking-widest text-gold-400 font-semibold">
                  Reservation Confirmed
                </span>
                <h3 className="font-serif text-2xl font-bold text-white mt-1">
                  We Look Forward to Welcoming You
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Booking Reference: <strong className="text-gold-300">{confirmedBooking.bookingCode}</strong>
                </p>
              </div>

              {/* Ticket Card */}
              <div className="max-w-md mx-auto p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-gold-500/30 shadow-2xl text-left space-y-3">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div>
                    <div className="text-xs text-gold-400 font-bold uppercase tracking-wider">AURA Luxury Salon & Bridal Lounge</div>
                    <div className="font-serif font-bold text-white text-base">{confirmedBooking.serviceName}</div>
                  </div>
                  <span className="font-bold text-gold-300 text-lg">₹{confirmedBooking.totalAmount?.toLocaleString('en-IN')}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 block">Artisan / Stylist</span>
                    <span className="font-medium text-slate-200">{confirmedBooking.staffName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Date & Time</span>
                    <span className="font-medium text-slate-200">{confirmedBooking.date} • {confirmedBooking.timeSlot}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Client</span>
                    <span className="font-medium text-slate-200">{confirmedBooking.customerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Status</span>
                    <span className="text-emerald-400 font-semibold uppercase">{confirmedBooking.status}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>📱 SMS dispatched to {confirmedBooking.customerPhone}</span>
                  <span className="text-gold-400 font-semibold">{confirmedBooking.bookingCode}</span>
                </div>
              </div>

              {/* Send Confirmation to WhatsApp Action */}
              <div className="max-w-md mx-auto">
                <a
                  href={`https://wa.me/919360449096?text=${encodeURIComponent(`✨ Hello AURA Salon Chennai! My booking is confirmed.\n\nBooking Code: ${confirmedBooking.bookingCode}\nService: ${confirmedBooking.serviceName}\nStylist: ${confirmedBooking.staffName}\nDate: ${confirmedBooking.date} at ${confirmedBooking.timeSlot}\nClient: ${confirmedBooking.customerName}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition transform hover:scale-[1.02]"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  Send Confirmation to Salon WhatsApp (+91 9360449096)
                </a>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between">
          {step > 1 && step < 5 ? (
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 && (
            <button
              onClick={handleNext}
              disabled={step === 1 && !selectedService}
              className="btn-gold flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold tracking-wide"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {step === 4 && (
            <button
              type="button"
              disabled={loading}
              onClick={handleConfirmBooking}
              className="btn-gold flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold tracking-wide shadow-lg"
            >
              {loading ? 'Confirming...' : 'Confirm Reservation'} <Check className="w-4 h-4" />
            </button>
          )}

          {step === 5 && (
            <button
              onClick={onClose}
              className="btn-gold w-full py-2.5 rounded-xl text-xs font-bold tracking-wide text-center"
            >
              Finish & Done
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
