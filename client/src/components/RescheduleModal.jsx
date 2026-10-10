import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useNotification } from '../context/NotificationContext';
import { X, Calendar as CalendarIcon, Clock, AlertCircle, Sparkles } from 'lucide-react';

export default function RescheduleModal({ appointment, isOpen, onClose, onRescheduled }) {
  const { showToast, showSimulatedDispatch } = useNotification();
  const [newDate, setNewDate] = useState(() => {
    return appointment?.date || new Date().toISOString().split('T')[0];
  });
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && appointment && newDate) {
      loadSlots();
    }
  }, [isOpen, appointment, newDate]);

  const loadSlots = async () => {
    setLoading(true);
    setSelectedSlot(null);
    try {
      const data = await api.getAvailability(
        newDate,
        appointment.staffId,
        appointment.serviceDuration || 60
      );
      setAvailability(data);
    } catch (err) {
      setAvailability({ isOpen: false, reason: "Unable to load times.", slots: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReschedule = async () => {
    if (!selectedSlot) {
      showToast("Please choose a new time slot", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.rescheduleAppointment(appointment.id, {
        date: newDate,
        timeSlot: selectedSlot.raw,
        staffId: appointment.staffId
      });

      showToast("✨ Appointment rescheduled successfully!", "success");
      if (res.notifications) {
        showSimulatedDispatch(res.notifications);
      }
      if (onRescheduled) onRescheduled(res.appointment);
      onClose();
    } catch (err) {
      showToast(err.message || "Failed to reschedule appointment", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !appointment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0F172A] border border-gold-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900">
          <div>
            <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold-400" /> Reschedule Appointment
            </h3>
            <p className="text-xs text-slate-400">Ref: {appointment.bookingCode} • {appointment.serviceName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current info */}
        <div className="p-4 bg-slate-900/60 border-b border-slate-800 text-xs text-slate-300 flex items-center justify-between">
          <div>
            <span className="text-slate-500 block">Current Schedule</span>
            <span className="font-semibold text-gold-300">{appointment.date} at {appointment.timeSlot}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Stylist</span>
            <span className="font-semibold text-white">{appointment.staffName}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Select New Date
            </label>
            <input
              type="date"
              value={newDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold-400"
            />
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
              <span>Checking stylist schedule...</span>
            </div>
          ) : !availability?.isOpen ? (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs flex gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{availability?.reason || "Unavailable date."}</span>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Select New Time Slot
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                {availability.slots.map((slot, idx) => {
                  const isSelected = selectedSlot?.raw === slot.raw;
                  return (
                    <button
                      key={idx}
                      disabled={!slot.available}
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-2 px-2 text-xs rounded-lg border font-medium transition ${
                        !slot.available
                          ? 'bg-slate-900/30 border-slate-800/60 text-slate-600 line-through cursor-not-allowed'
                          : isSelected
                          ? 'bg-gold-500 text-black border-gold-400 font-bold'
                          : 'bg-slate-900 border-slate-700 text-slate-200 hover:border-gold-400'
                      }`}
                    >
                      {slot.time}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            disabled={!selectedSlot || submitting}
            onClick={handleConfirmReschedule}
            className="btn-gold px-5 py-2 rounded-xl text-xs font-bold"
          >
            {submitting ? 'Updating...' : 'Confirm Reschedule'}
          </button>
        </div>

      </div>
    </div>
  );
}
