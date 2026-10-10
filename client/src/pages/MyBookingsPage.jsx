import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import RescheduleModal from '../components/RescheduleModal';
import {
  Calendar, Clock, User, Scissors, XCircle, RotateCcw,
  Sparkles, ShieldCheck, Mail, Phone, Search, AlertCircle
} from 'lucide-react';

export default function MyBookingsPage({ onOpenBooking }) {
  const { user } = useAuth();
  const { showToast, showSimulatedDispatch } = useNotification();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lookupEmail, setLookupEmail] = useState(user?.email || 'sophia@example.com');
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' or 'past'
  const [rescheduleTarget, setRescheduleTarget] = useState(null);

  useEffect(() => {
    if (user?.email) {
      setLookupEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    fetchAppointments();
  }, [lookupEmail]);

  const fetchAppointments = async () => {
    if (!lookupEmail) return;
    setLoading(true);
    try {
      const data = await api.getAppointments({ customerEmail: lookupEmail });
      setAppointments(data);
    } catch (err) {
      showToast("Unable to load booking records", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (id, bookingCode) => {
    if (!window.confirm(`Are you sure you want to cancel appointment ${bookingCode}?`)) {
      return;
    }

    try {
      const res = await api.cancelAppointment(id, "Cancelled by client via online portal");
      showToast("Appointment successfully cancelled", "success");
      if (res.notifications) {
        showSimulatedDispatch(res.notifications);
      }
      fetchAppointments();
    } catch (err) {
      showToast(err.message || "Failed to cancel", "error");
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingList = appointments.filter(a => a.date >= todayStr && a.status !== 'cancelled');
  const pastList = appointments.filter(a => a.date < todayStr || a.status === 'cancelled' || a.status === 'completed');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs uppercase tracking-widest text-gold-400 font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Client Concierge
          </span>
          <h1 className="font-serif text-3xl font-bold text-white mt-1">
            My Appointments & History
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review, reschedule, or cancel your luxury salon reservations
          </p>
        </div>

        {/* Email Lookup form if guest or switching accounts */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2 rounded-xl">
          <Mail className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
          <input
            type="email"
            value={lookupEmail}
            onChange={(e) => setLookupEmail(e.target.value)}
            placeholder="Search by client email..."
            className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-48"
          />
          <button
            onClick={fetchAppointments}
            className="px-3 py-1 rounded-lg bg-gold-500 text-black text-xs font-semibold hover:bg-gold-400 transition"
          >
            Find
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 mb-6 gap-6">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`pb-3 text-sm font-semibold tracking-wide border-b-2 transition flex items-center gap-2 ${
            activeTab === 'upcoming'
              ? 'border-gold-400 text-gold-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Upcoming Reservations ({upcomingList.length})
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`pb-3 text-sm font-semibold tracking-wide border-b-2 transition flex items-center gap-2 ${
            activeTab === 'past'
              ? 'border-gold-400 text-gold-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Past & Cancelled ({pastList.length})
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs">Fetching your luxury appointments...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && ((activeTab === 'upcoming' && upcomingList.length === 0) || (activeTab === 'past' && pastList.length === 0)) && (
        <div className="py-16 px-4 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg text-white font-bold">No Appointments Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {activeTab === 'upcoming'
              ? 'You have no upcoming appointments reserved. Treat yourself to a bespoke salon ritual.'
              : 'No past booking records found under this email.'}
          </p>
          {activeTab === 'upcoming' && (
            <button
              onClick={() => onOpenBooking && onOpenBooking()}
              className="btn-gold mt-4 px-6 py-2 rounded-xl text-xs font-bold"
            >
              Book New Appointment
            </button>
          )}
        </div>
      )}

      {/* Appointments List */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(activeTab === 'upcoming' ? upcomingList : pastList).map((apt) => {
            const isConfirmed = apt.status === 'confirmed';
            const isPending = apt.status === 'pending';
            const isCancelled = apt.status === 'cancelled';
            const isCompleted = apt.status === 'completed';

            return (
              <div
                key={apt.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg relative overflow-hidden flex flex-col justify-between"
              >
                {/* Status chip */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono tracking-wider font-semibold text-gold-400 bg-gold-500/10 px-2 py-0.5 rounded border border-gold-500/20">
                    {apt.bookingCode}
                  </span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
                      isConfirmed
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : isPending
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        : isCancelled
                        ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                        : 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                    }`}
                  >
                    {apt.status.toUpperCase()}
                  </span>
                </div>

                {/* Service Details */}
                <div>
                  <h3 className="font-serif text-lg font-bold text-white mb-1">
                    {apt.serviceName}
                  </h3>
                  <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-3">
                    <User className="w-3.5 h-3.5 text-gold-400" />
                    <span>Stylist: <strong className="text-slate-200">{apt.staffName}</strong></span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 grid grid-cols-2 gap-2 text-xs mb-4">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Calendar className="w-3.5 h-3.5 text-gold-400" />
                      <span>{apt.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-gold-400" />
                      <span>{apt.timeSlot} ({apt.serviceDuration}m)</span>
                    </div>
                  </div>

                  {apt.notes && (
                    <p className="text-xs text-slate-400 italic mb-3">
                      Note: "{apt.notes}"
                    </p>
                  )}
                </div>

                {/* Card Footer with Price and Actions */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase text-slate-500 block">Total Rate</span>
                    <span className="text-base font-serif font-bold text-gold-300">₹{apt.totalAmount?.toLocaleString('en-IN')}</span>
                  </div>

                  {/* Actions for upcoming */}
                  {activeTab === 'upcoming' && !isCancelled && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setRescheduleTarget(apt)}
                        className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-medium text-slate-200 hover:border-gold-400 hover:text-gold-300 transition flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Reschedule
                      </button>
                      <button
                        onClick={() => handleCancelBooking(apt.id, apt.bookingCode)}
                        className="px-3 py-1.5 rounded-lg border border-rose-500/30 bg-rose-950/30 text-xs font-medium text-rose-300 hover:bg-rose-900/50 transition flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Cancel
                      </button>
                    </div>
                  )}

                  {/* Actions for past */}
                  {activeTab === 'past' && (
                    <button
                      onClick={() => onOpenBooking && onOpenBooking(null, null)}
                      className="px-3 py-1.5 rounded-lg bg-gold-500/10 border border-gold-500/30 text-xs font-semibold text-gold-300 hover:bg-gold-500 hover:text-black transition"
                    >
                      Book Again
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleTarget && (
        <RescheduleModal
          isOpen={Boolean(rescheduleTarget)}
          appointment={rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
          onRescheduled={() => {
            setRescheduleTarget(null);
            fetchAppointments();
          }}
        />
      )}

    </div>
  );
}
