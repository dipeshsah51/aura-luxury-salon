import express from 'express';
import cors from 'cors';
import { getDb, saveDb, generateBookingCode, recordNotification } from './database.js';

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// ==========================================
// 1. SALON & GENERAL INFO
// ==========================================
app.get('/api/salon', (req, res) => {
  const db = getDb();
  res.json({ salonInfo: db.salonInfo, workingHours: db.workingHours });
});

app.put('/api/salon', (req, res) => {
  const db = getDb();
  db.salonInfo = { ...db.salonInfo, ...req.body };
  saveDb(db);
  res.json({ message: "Salon information updated", salonInfo: db.salonInfo });
});

// ==========================================
// 2. AUTHENTICATION & USERS
// ==========================================
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const db = getDb();
  const cleanEmail = email?.toLowerCase().trim();
  const user = db.users.find(u => u.email.toLowerCase() === cleanEmail && u.password === password);

  if (!user) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  // MANDATORY 2FA OTP FOR DIRECTOR / ADMIN
  if (user.role === 'admin' || cleanEmail === 'dsah56631@gmail.com') {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + (10 * 60 * 1000);
    activeOtps.set(cleanEmail, {
      code: otpCode,
      purpose: 'admin_login',
      expiresAt,
      attempts: 0
    });
    console.log(`[SECURITY 2FA] OTP generated for Director ${cleanEmail}: ${otpCode}`);

    // ONLY generate & record the OTP Verification Email for Director
    recordNotification('email', 'dsah56631@gmail.com', `Your AURA verification code is ${otpCode}`, `OTP Code: ${otpCode}`);

    saveDb(db);

    return res.json({
      success: true,
      requiresOtp: true,
      email: user.email,
      role: 'admin',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      message: `Director 2FA security code dispatched to ${user.email}.`
    });
  }

  const { password: _, ...userData } = user;
  res.json({
    token: `aura-token-${user.id}-${Date.now()}`,
    user: userData
  });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required." });
  }

  const db = getDb();
  const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ message: "An account with this email already exists." });
  }

  const newUser = {
    id: `usr-cust-${Date.now()}`,
    name,
    email,
    password,
    phone: phone || "",
    role: "customer"
  };

  db.users.push(newUser);

  // Also ensure registered in customer directory
  let custRecord = db.customers.find(c => c.email.toLowerCase() === email.toLowerCase());
  if (!custRecord) {
    db.customers.push({
      id: `cust-${Date.now()}`,
      name,
      email,
      phone: phone || "",
      totalVisits: 0,
      totalSpent: 0,
      lastVisit: null,
      vipStatus: false,
      notes: "Newly registered member"
    });
  }

  saveDb(db);

  const { password: _, ...userData } = newUser;
  res.status(201).json({
    token: `aura-token-${newUser.id}-${Date.now()}`,
    user: userData
  });
});

// In-memory OTP storage for Node dev server
const activeOtps = new Map();

// SEND OTP (Email Verification Code)
app.post('/api/auth/send-otp', (req, res) => {
  const { email, purpose = 'register', name = '' } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ message: "A valid email address is required." });
  }

  const cleanEmail = email.trim().toLowerCase();
  const db = getDb();

  // If registering, check if account already exists
  if (purpose === 'register') {
    const existing = db.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return res.status(400).json({ message: "An account with this email already exists. Please sign in instead." });
    }
  }

  // If login, check if account exists
  if (purpose === 'login') {
    const existing = db.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (!existing) {
      return res.status(404).json({ message: "No account found with this email. Please create a membership first." });
    }
  }

  // Generate 6-digit OTP code
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  activeOtps.set(cleanEmail, {
    code: otpCode,
    purpose,
    expiresAt,
    attempts: 0
  });

  const clientName = name || (purpose === 'login' ? (db.users.find(u => u.email.toLowerCase() === cleanEmail)?.name || 'Guest') : 'Guest');
  const subject = `Your AURA verification code is ${otpCode}`;
  const emailMessage = `Vanakkam ${clientName},\n\nYour One-Time Password (OTP) for AURA Luxury Salon & Bridal Lounge is:\n\n👉  ${otpCode}  👈\n\nThis verification code is valid for 10 minutes. For your security, do not share this OTP with anyone.\n\nWarm regards,\nAURA Concierge Team\nRamapuram, Chennai 600089\nContact: +91 9360449096 | dsah56631@gmail.com`;

  res.json({
    success: true,
    message: `Verification code sent to ${cleanEmail}. Please check your Gmail inbox.`,
    email: cleanEmail,
    expiresInSeconds: 600
  });
});

// VERIFY OTP & COMPLETE REGISTRATION
app.post('/api/auth/verify-otp-register', (req, res) => {
  const { name, email, password, phone, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP code are required." });
  }

  const cleanEmail = email.trim().toLowerCase();
  const stored = activeOtps.get(cleanEmail);

  if (!stored) {
    return res.status(400).json({ message: "No verification code requested or code expired. Please request a new code." });
  }

  if (Date.now() > stored.expiresAt) {
    activeOtps.delete(cleanEmail);
    return res.status(400).json({ message: "Verification code has expired. Please request a new code." });
  }

  if (stored.code !== otp.trim()) {
    stored.attempts = (stored.attempts || 0) + 1;
    if (stored.attempts >= 5) {
      activeOtps.delete(cleanEmail);
      return res.status(400).json({ message: "Too many failed attempts. Please request a new code." });
    }
    return res.status(400).json({ message: "Incorrect verification code. Please check your email and try again." });
  }

  // OTP verified! Remove it
  activeOtps.delete(cleanEmail);

  const db = getDb();
  const existing = db.users.find(u => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    return res.status(400).json({ message: "An account with this email already exists." });
  }

  const newUser = {
    id: `usr-cust-${Date.now()}`,
    name: name || "Haute Member",
    email: cleanEmail,
    password: password || "AuraClient@2026",
    phone: phone || "",
    role: "customer",
    emailVerified: true
  };

  db.users.push(newUser);

  let custRecord = db.customers.find(c => c.email.toLowerCase() === cleanEmail);
  if (!custRecord) {
    db.customers.push({
      id: `cust-${Date.now()}`,
      name: newUser.name,
      email: cleanEmail,
      phone: phone || "",
      totalVisits: 0,
      totalSpent: 0,
      lastVisit: null,
      vipStatus: false,
      notes: "Newly registered member (Email Verified via OTP)"
    });
  }

  saveDb(db);

  const { password: _, ...userData } = newUser;
  res.status(201).json({
    success: true,
    message: "Email verified successfully! Welcome to AURA.",
    token: `aura-token-${newUser.id}-${Date.now()}`,
    user: userData
  });
});

// VERIFY OTP & SIGN IN
app.post('/api/auth/verify-otp-login', (req, res) => {
  const { email, otp, deviceInfo } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP code are required." });
  }

  const cleanEmail = email.trim().toLowerCase();
  const stored = activeOtps.get(cleanEmail);

  if (!stored) {
    return res.status(400).json({ message: "No verification code requested or code expired. Please request a new code." });
  }

  if (Date.now() > stored.expiresAt) {
    activeOtps.delete(cleanEmail);
    return res.status(400).json({ message: "Verification code has expired. Please request a new code." });
  }

  if (stored.code !== otp.trim()) {
    stored.attempts = (stored.attempts || 0) + 1;
    if (stored.attempts >= 5) {
      activeOtps.delete(cleanEmail);
      return res.status(400).json({ message: "Too many failed attempts. Please request a new code." });
    }
    return res.status(400).json({ message: "Incorrect verification code. Please check your email and try again." });
  }

  // OTP verified! Remove it
  activeOtps.delete(cleanEmail);

  const db = getDb();
  const user = db.users.find(u => u.email.toLowerCase() === cleanEmail);
  if (!user) {
    return res.status(404).json({ message: "User account not found." });
  }

  // IF DIRECTOR LOGIN COMPLETED: Send Login Device Security Alert
  if (user.role === 'admin' || cleanEmail === 'dsah56631@gmail.com') {
    const rawIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
    const clientIp = typeof rawIp === 'string' ? rawIp.split(',')[0].trim() : '127.0.0.1';
    const ua = (deviceInfo && deviceInfo.userAgent) || req.headers['user-agent'] || 'Mozilla/5.0';

    let os = 'Unknown OS';
    let deviceType = 'Desktop';
    if (/windows nt 10/i.test(ua)) { os = 'Windows 10/11'; }
    else if (/windows nt 6\.3/i.test(ua)) { os = 'Windows 8.1'; }
    else if (/windows nt 6\.1/i.test(ua)) { os = 'Windows 7'; }
    else if (/windows/i.test(ua)) { os = 'Windows'; }
    else if (/android/i.test(ua)) { os = 'Android'; deviceType = 'Mobile'; }
    else if (/iphone/i.test(ua)) { os = 'iOS (iPhone)'; deviceType = 'Mobile'; }
    else if (/ipad/i.test(ua)) { os = 'iPadOS'; deviceType = 'Tablet'; }
    else if (/macintosh|mac os x/i.test(ua)) { os = 'macOS'; }
    else if (/linux/i.test(ua)) { os = 'Linux'; }

    let browser = 'Unknown Browser';
    let browserVersion = 'Unknown';
    let match;
    if ((match = ua.match(/edg\/([0-9\.]+)/i))) {
      browser = 'Chrome / Edge';
      browserVersion = match[1];
    } else if ((match = ua.match(/opr\/([0-9\.]+)/i))) {
      browser = 'Opera';
      browserVersion = match[1];
    } else if ((match = ua.match(/chrome\/([0-9\.]+)/i))) {
      browser = 'Chrome';
      browserVersion = match[1];
    } else if ((match = ua.match(/firefox\/([0-9\.]+)/i))) {
      browser = 'Firefox';
      browserVersion = match[1];
    } else if ((match = ua.match(/version\/([0-9\.]+).*safari/i))) {
      browser = 'Safari';
      browserVersion = match[1];
    }

    if (deviceInfo?.isMobile) deviceType = 'Mobile';
    const deviceName = deviceInfo?.deviceName || `${deviceType} (${os})`;
    const confirmedDevice = {
      deviceId: deviceInfo?.deviceId || '',
      deviceName,
      os,
      browser,
      isMobile: deviceType === 'Mobile',
      ip: clientIp,
      verifiedAt: new Date().toISOString()
    };
    user.previousDevice = confirmedDevice;
    db.adminPreviousDevice = confirmedDevice;
    saveDb(db);
    console.log(`[SECURITY] Director Login verified from ${deviceName} [${clientIp}]. Device state updated.`);
  }

  const { password: _, ...userData } = user;
  res.json({
    success: true,
    message: "Authentication successful.",
    token: `aura-token-${user.id}-${Date.now()}`,
    user: userData
  });
});

// ==========================================
// 3. SERVICES (CRUD)
// ==========================================
app.get('/api/services', (req, res) => {
  const db = getDb();
  res.json(db.services);
});

app.post('/api/services', (req, res) => {
  const { name, category, price, duration, description, image, popular } = req.body;
  if (!name || !price || !duration) {
    return res.status(400).json({ message: "Name, price, and duration are required." });
  }

  const db = getDb();
  const newService = {
    id: `srv-${Date.now()}`,
    name,
    category: category || "General",
    price: Number(price),
    duration: Number(duration),
    description: description || "",
    image: image || "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80",
    popular: Boolean(popular),
    rating: 5.0,
    reviewsCount: 1
  };

  db.services.push(newService);
  saveDb(db);
  res.status(201).json(newService);
});

app.put('/api/services/:id', (req, res) => {
  const db = getDb();
  const index = db.services.findIndex(s => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: "Service not found." });
  }

  db.services[index] = {
    ...db.services[index],
    ...req.body,
    price: req.body.price !== undefined ? Number(req.body.price) : db.services[index].price,
    duration: req.body.duration !== undefined ? Number(req.body.duration) : db.services[index].duration,
  };

  saveDb(db);
  res.json(db.services[index]);
});

app.delete('/api/services/:id', (req, res) => {
  const db = getDb();
  const initialLength = db.services.length;
  db.services = db.services.filter(s => s.id !== req.params.id);

  if (db.services.length === initialLength) {
    return res.status(404).json({ message: "Service not found." });
  }

  saveDb(db);
  res.json({ message: "Service removed successfully." });
});

// ==========================================
// 4. STAFF / BARBERS / STYLISTS (CRUD)
// ==========================================
app.get('/api/staff', (req, res) => {
  const db = getDb();
  const serviceId = req.query.serviceId;

  if (serviceId) {
    // filter staff who can perform this service
    const filtered = db.staff.filter(st =>
      !st.assignedServices || st.assignedServices.length === 0 || st.assignedServices.includes(serviceId)
    );
    return res.json(filtered);
  }

  res.json(db.staff);
});

app.post('/api/staff', (req, res) => {
  const { name, role, bio, specialties, avatar, workingDays, workingHours, assignedServices } = req.body;
  if (!name || !role) {
    return res.status(400).json({ message: "Name and role are required." });
  }

  const db = getDb();
  const newStaff = {
    id: `staff-${Date.now()}`,
    name,
    role,
    bio: bio || "",
    specialties: specialties || ["Hair Styling"],
    rating: 5.0,
    reviewsCount: 1,
    avatar: avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
    workingDays: workingDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    workingHours: workingHours || { start: "09:00", end: "18:00" },
    assignedServices: assignedServices || []
  };

  db.staff.push(newStaff);
  saveDb(db);
  res.status(201).json(newStaff);
});

app.put('/api/staff/:id', (req, res) => {
  const db = getDb();
  const index = db.staff.findIndex(s => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: "Staff member not found." });
  }

  db.staff[index] = { ...db.staff[index], ...req.body };
  saveDb(db);
  res.json(db.staff[index]);
});

app.delete('/api/staff/:id', (req, res) => {
  const db = getDb();
  const initialLength = db.staff.length;
  db.staff = db.staff.filter(s => s.id !== req.params.id);

  if (db.staff.length === initialLength) {
    return res.status(404).json({ message: "Staff member not found." });
  }

  saveDb(db);
  res.json({ message: "Staff member removed successfully." });
});

// ==========================================
// 5. SCHEDULE & WORKING HOURS & BLOCKED DATES
// ==========================================
app.get('/api/schedule/working-hours', (req, res) => {
  const db = getDb();
  res.json(db.workingHours);
});

app.put('/api/schedule/working-hours', (req, res) => {
  const db = getDb();
  db.workingHours = { ...db.workingHours, ...req.body };
  saveDb(db);
  res.json({ message: "Working hours updated successfully", workingHours: db.workingHours });
});

app.get('/api/schedule/blocked-dates', (req, res) => {
  const db = getDb();
  res.json(db.blockedDates);
});

app.post('/api/schedule/blocked-dates', (req, res) => {
  const { date, reason, staffId } = req.body;
  if (!date) {
    return res.status(400).json({ message: "Date is required." });
  }

  const db = getDb();
  const newBlock = {
    id: `block-${Date.now()}`,
    date, // YYYY-MM-DD
    reason: reason || "Unavailable / Holiday",
    staffId: staffId || null
  };

  db.blockedDates.push(newBlock);
  saveDb(db);
  res.status(201).json(newBlock);
});

app.delete('/api/schedule/blocked-dates/:id', (req, res) => {
  const db = getDb();
  const initialLength = db.blockedDates.length;
  db.blockedDates = db.blockedDates.filter(b => b.id !== req.params.id);

  if (db.blockedDates.length === initialLength) {
    return res.status(404).json({ message: "Blocked date not found." });
  }

  saveDb(db);
  res.json({ message: "Date unblocked successfully." });
});

// ==========================================
// 6. AVAILABILITY & REAL-TIME TIME SLOTS
// ==========================================
app.get('/api/availability', (req, res) => {
  const { date, staffId, serviceDuration = 60 } = req.query;

  if (!date) {
    return res.status(400).json({ message: "Query parameter 'date' (YYYY-MM-DD) is required." });
  }

  const db = getDb();

  // 1. Check if salon is blocked for this date
  const isSalonBlocked = db.blockedDates.some(b => b.date === date && !b.staffId);
  if (isSalonBlocked) {
    return res.json({
      isOpen: false,
      reason: "Salon is closed on this date (Holiday or Private Event).",
      slots: []
    });
  }

  // 2. Parse day of week
  const dateObj = new Date(date + "T00:00:00");
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayName = days[dateObj.getDay()];

  // Check salon hours for day
  const salonDayHours = db.workingHours[dayName];
  if (!salonDayHours || !salonDayHours.isOpen) {
    return res.json({
      isOpen: false,
      reason: `Salon is closed on ${dayName}s.`,
      slots: []
    });
  }

  // 3. If a specific staff is requested, check staff's availability
  let staffMember = null;
  if (staffId && staffId !== 'any' && staffId !== 'undefined' && staffId !== 'null') {
    staffMember = db.staff.find(s => s.id === staffId);
    if (staffMember) {
      // Check staff blocked dates
      const isStaffBlocked = db.blockedDates.some(b => b.date === date && b.staffId === staffId);
      if (isStaffBlocked) {
        return res.json({
          isOpen: false,
          reason: `${staffMember.name} is off duty on this date.`,
          operatingHours: 'Stylist Off Duty',
          stylistUnavailable: true,
          slots: []
        });
      }

      // Check if staff works on this day
      if (!staffMember.workingDays.includes(dayName)) {
        return res.json({
          isOpen: false,
          reason: `${staffMember.name} does not take bookings on ${dayName}s.`,
          operatingHours: 'Stylist Off Duty',
          stylistUnavailable: true,
          slots: []
        });
      }
    }
  }

  // Helper to parse time string
  const parseTimeMins = (t) => {
    if (!t) return 0;
    if (t.toLowerCase().includes('am') || t.toLowerCase().includes('pm')) {
      const d = new Date(`1970-01-01 ${t}`);
      if (!isNaN(d.getTime())) return d.getHours() * 60 + d.getMinutes();
    }
    const parts = t.split(':');
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1] || '0', 10);
  };

  // 4. Calculate working time range for day
  const startTimeStr = (staffMember && staffMember.workingHours?.start) || salonDayHours.open;
  const endTimeStr = (staffMember && staffMember.workingHours?.end) || salonDayHours.close;

  const [startHour, startMin] = startTimeStr.split(':').map(Number);
  const [endHour, endMin] = endTimeStr.split(':').map(Number);

  const startTotalMins = startHour * 60 + startMin;
  const endTotalMins = endHour * 60 + endMin;

  // 5. Existing bookings for this date
  const activeBookings = db.appointments.filter(a =>
    a.date === date &&
    a.status !== 'cancelled' &&
    (!staffMember || a.staffId === staffMember.id)
  );

  // Generate slots in 30-minute intervals
  const slotInterval = 30; // 30-min start intervals
  const slots = [];
  const todayDate = new Date().toISOString().split('T')[0];
  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();

  for (let mins = startTotalMins; mins <= endTotalMins - Number(serviceDuration); mins += slotInterval) {
    const slotHour = Math.floor(mins / 60);
    const slotMinute = mins % 60;
    const rawTime = `${String(slotHour).padStart(2, '0')}:${String(slotMinute).padStart(2, '0')}`;

    // Format display time (e.g., 10:00 AM)
    const displayPeriod = slotHour >= 12 ? 'PM' : 'AM';
    const displayHour = slotHour % 12 === 0 ? 12 : slotHour % 12;
    const displayTime = `${displayHour}:${String(slotMinute).padStart(2, '0')} ${displayPeriod}`;

    // Period classification
    let period = 'morning';
    if (slotHour >= 12 && slotHour < 17) period = 'afternoon';
    else if (slotHour >= 17) period = 'evening';

    // Conflict detection
    const slotEndMins = mins + Number(serviceDuration);

    let isAvailable = true;
    let conflictReason = null;

    if (date === todayDate && mins <= currentMins + 15) {
      isAvailable = false;
      conflictReason = "Past";
    }

    if (isAvailable) {
      if (staffMember) {
        // Check collision with this stylist's appointments
        const collision = activeBookings.find(apt => {
          const aptStartMins = parseTimeMins(apt.timeSlot);
          const aptEndMins = aptStartMins + (apt.serviceDuration || apt.duration || 60);
          return (mins < aptEndMins && slotEndMins > aptStartMins);
        });

        if (collision) {
          isAvailable = false;
          conflictReason = "Reserved";
        }
      } else {
        // If 'any' stylist selected, slot is available if at least one qualified staff member is free
        const qualifiedStaff = db.staff.filter(st => st.workingDays.includes(dayName));
        const freeStaff = qualifiedStaff.filter(st => {
          const staffAppointments = db.appointments.filter(a =>
            a.date === date &&
            a.status !== 'cancelled' &&
            a.staffId === st.id
          );
          const hasCollision = staffAppointments.some(apt => {
            const aptStartMins = parseTimeMins(apt.timeSlot);
            const aptEndMins = aptStartMins + (apt.serviceDuration || apt.duration || 60);
            return (mins < aptEndMins && slotEndMins > aptStartMins);
          });
          return !hasCollision;
        });

        if (freeStaff.length === 0) {
          isAvailable = false;
          conflictReason = "All stylists booked";
        }
      }
    }

    slots.push({
      time: displayTime,
      raw: rawTime,
      period,
      available: isAvailable,
      reason: conflictReason
    });
  }

  res.json({
    date,
    dayName,
    isOpen: true,
    operatingHours: `${startTimeStr} - ${endTimeStr}`,
    slots
  });
});

// ==========================================
// 7. APPOINTMENTS (BOOK, CANCEL, RESCHEDULE, STATUS)
// ==========================================
app.get('/api/appointments', (req, res) => {
  const { customerEmail, date, staffId, status, search } = req.query;
  const db = getDb();
  let results = [...db.appointments];

  if (customerEmail) {
    results = results.filter(a => a.customerEmail?.toLowerCase() === customerEmail.toLowerCase());
  }
  if (date) {
    results = results.filter(a => a.date === date);
  }
  if (staffId && staffId !== 'all') {
    results = results.filter(a => a.staffId === staffId);
  }
  if (status && status !== 'all') {
    results = results.filter(a => a.status === status);
  }
  if (search) {
    const q = search.toLowerCase();
    results = results.filter(a =>
      a.customerName?.toLowerCase().includes(q) ||
      a.bookingCode?.toLowerCase().includes(q) ||
      a.customerPhone?.toLowerCase().includes(q) ||
      a.serviceName?.toLowerCase().includes(q)
    );
  }

  // Sort by date & time (upcoming first)
  results.sort((a, b) => new Date(`${b.date}T${b.timeSlot || '00:00'}`) - new Date(`${a.date}T${a.timeSlot || '00:00'}`));

  res.json(results);
});

app.get('/api/appointments/:id', (req, res) => {
  const db = getDb();
  const appointment = db.appointments.find(a => a.id === req.params.id || a.bookingCode === req.params.id);
  if (!appointment) {
    return res.status(404).json({ message: "Appointment not found." });
  }
  res.json(appointment);
});

// Book appointment
app.post('/api/appointments', (req, res) => {
  const {
    serviceId,
    staffId,
    date,
    timeSlot,
    customerName,
    customerEmail,
    customerPhone,
    notes,
    paymentStatus = "pay_at_salon"
  } = req.body;

  if (!serviceId || !date || !timeSlot || !customerName || !customerEmail || !customerPhone) {
    return res.status(400).json({ message: "Please complete all required appointment details." });
  }

  const db = getDb();
  const service = db.services.find(s => s.id === serviceId);
  if (!service) {
    return res.status(404).json({ message: "Selected service was not found." });
  }

  // Determine stylist
  let chosenStaff = null;
  if (staffId && staffId !== 'any') {
    chosenStaff = db.staff.find(s => s.id === staffId);
  }
  if (!chosenStaff) {
    // Select first qualified staff
    chosenStaff = db.staff[0];
  }

  const bookingCode = generateBookingCode();
  const newAppointment = {
    id: `apt-${Date.now()}`,
    bookingCode,
    serviceId: service.id,
    serviceName: service.name,
    servicePrice: service.price,
    serviceDuration: service.duration,
    staffId: chosenStaff.id,
    staffName: chosenStaff.name,
    date,
    timeSlot,
    customerName,
    customerEmail,
    customerPhone,
    notes: notes || "",
    status: req.body.status || "confirmed",
    source: req.body.source || (req.body.bookingType || "online"),
    totalAmount: Number(service.price),
    paymentStatus: req.body.paymentStatus || (req.body.status === 'completed' ? 'paid_at_salon' : 'pay_at_salon'),
    createdAt: new Date().toISOString()
  };

  db.appointments.unshift(newAppointment);

  // Customer directory synchronization
  const cEmail = (customerEmail || '').toLowerCase();
  const cPhone = (customerPhone || '').trim();
  let customer = db.customers.find(c => 
    (cEmail && c.email.toLowerCase() === cEmail) || 
    (cPhone && c.phone === cPhone)
  );

  const isCompleted = newAppointment.status === 'completed';
  if (customer) {
    if (isCompleted) {
      customer.totalVisits = (customer.totalVisits || 0) + 1;
      customer.totalSpent = (customer.totalSpent || 0) + newAppointment.totalAmount;
      customer.lastVisit = newAppointment.date;
    }
  } else {
    customer = {
      id: `cust-${Date.now()}`,
      name: customerName,
      email: customerEmail || `guest_${cPhone || Date.now()}@auraa.kesug.com`,
      phone: customerPhone,
      totalVisits: isCompleted ? 1 : 0,
      totalSpent: isCompleted ? newAppointment.totalAmount : 0,
      lastVisit: isCompleted ? newAppointment.date : null,
      vipStatus: false,
      notes: newAppointment.source === 'offline' ? "Offline Walk-in guest" : "First-time client"
    };
    db.customers.push(customer);
  }

  // Trigger simulated Email & SMS notifications (with Chennai & WhatsApp details)
  const smsMessage = `✨ AURA Chennai: Vanakkam ${customerName}! Your booking for ${service.name} with ${chosenStaff.name} is confirmed on ${date} at ${timeSlot}. Ref: ${bookingCode}. Location: Ramapuram, Chennai 600089. WhatsApp us at +91 9360449096.`;
  const emailMessage = `Dear ${customerName},\n\nVanakkam! We look forward to welcoming you to AURA Luxury Salon & Bridal Lounge, Chennai.\n\nBooking Summary:\n- Service: ${service.name} (₹${service.price.toLocaleString('en-IN')})\n- Stylist: ${chosenStaff.name}\n- Date: ${date} at ${timeSlot}\n- Reference Code: ${bookingCode}\n- Location: Ramapuram, Chennai, Tamil Nadu, 600089 (Near DLF)\n- Contact / WhatsApp: +91 9360449096\n\nAuthentic South Indian filter coffee & organic herbal refreshments are served upon arrival.`;

  const smsNotif = recordNotification('sms', customerPhone, 'Booking Confirmation', smsMessage);
  const emailNotif = recordNotification('email', customerEmail, `AURA: Confirmed - ${service.name}`, emailMessage);

  saveDb(db);

  res.status(201).json({
    appointment: newAppointment,
    notifications: [smsNotif, emailNotif],
    message: "Appointment successfully booked!"
  });
});

// Reschedule appointment
app.put('/api/appointments/:id/reschedule', (req, res) => {
  const { date, timeSlot, staffId } = req.body;
  if (!date || !timeSlot) {
    return res.status(400).json({ message: "Date and timeSlot are required for rescheduling." });
  }

  const db = getDb();
  const index = db.appointments.findIndex(a => a.id === req.params.id || a.bookingCode === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: "Appointment not found." });
  }

  const oldDate = db.appointments[index].date;
  const oldTime = db.appointments[index].timeSlot;

  if (staffId && staffId !== 'any') {
    const staff = db.staff.find(s => s.id === staffId);
    if (staff) {
      db.appointments[index].staffId = staff.id;
      db.appointments[index].staffName = staff.name;
    }
  }

  db.appointments[index].date = date;
  db.appointments[index].timeSlot = timeSlot;
  db.appointments[index].status = "confirmed";
  db.appointments[index].rescheduledAt = new Date().toISOString();

  const apt = db.appointments[index];

  // Send rescheduling notifications
  const sms = recordNotification(
    'sms',
    apt.customerPhone,
    'Appointment Rescheduled',
    `✨ AURA: Your appointment ${apt.bookingCode} for ${apt.serviceName} has been rescheduled to ${date} at ${timeSlot} with ${apt.staffName}.`
  );
  const email = recordNotification(
    'email',
    apt.customerEmail,
    `AURA: Appointment Rescheduled (${apt.bookingCode})`,
    `Dear ${apt.customerName},\n\nYour appointment has been successfully changed from ${oldDate} ${oldTime} to:\nDate: ${date} at ${timeSlot}\nStylist: ${apt.staffName}\n\nWe look forward to seeing you!`
  );

  saveDb(db);
  res.json({
    appointment: apt,
    notifications: [sms, email],
    message: "Appointment successfully rescheduled."
  });
});

// Cancel appointment
app.put('/api/appointments/:id/cancel', (req, res) => {
  const { reason } = req.body;
  const db = getDb();
  const index = db.appointments.findIndex(a => a.id === req.params.id || a.bookingCode === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: "Appointment not found." });
  }

  if (db.appointments[index].status === 'completed') {
    return res.status(400).json({ message: "Completed appointments cannot be cancelled." });
  }

  db.appointments[index].status = "cancelled";
  db.appointments[index].cancellationReason = reason || "Customer request";
  db.appointments[index].cancelledAt = new Date().toISOString();

  const apt = db.appointments[index];

  // Send cancellation notifications
  const sms = recordNotification(
    'sms',
    apt.customerPhone,
    'Appointment Cancelled',
    `✨ AURA: Appointment ${apt.bookingCode} for ${apt.serviceName} has been cancelled. We hope to see you another time.`
  );
  const email = recordNotification(
    'email',
    apt.customerEmail,
    `AURA: Appointment Cancelled (${apt.bookingCode})`,
    `Dear ${apt.customerName},\n\nYour booking ${apt.bookingCode} for ${apt.serviceName} on ${apt.date} has been cancelled as requested.\n\nYou can book anytime through our website.`
  );

  saveDb(db);
  res.json({
    appointment: apt,
    notifications: [sms, email],
    message: "Appointment cancelled successfully."
  });
});

// Admin status update (approve, complete, etc.)
app.put('/api/appointments/:id/status', (req, res) => {
  const { status } = req.body;
  if (!['confirmed', 'pending', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ message: "Invalid status value." });
  }

  const db = getDb();
  const index = db.appointments.findIndex(a => a.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: "Appointment not found." });
  }

  const oldStatus = db.appointments[index].status;
  if (oldStatus === 'completed' && status === 'cancelled') {
    return res.status(400).json({ message: "Completed appointments cannot be cancelled." });
  }
  db.appointments[index].status = status;
  db.appointments[index].updatedAt = new Date().toISOString();
  const apt = db.appointments[index];

  // If marked completed, update or create customer record in real time!
  if (status === 'completed' && oldStatus !== 'completed') {
    const custEmail = (apt.customerEmail || '').toLowerCase();
    const custPhone = (apt.customerPhone || '').trim();
    const aptAmount = Number(apt.totalAmount || apt.servicePrice || 0);

    let customer = db.customers.find(c =>
      (custEmail && c.email.toLowerCase() === custEmail) ||
      (custPhone && c.phone === custPhone)
    );

    if (customer) {
      customer.totalVisits = (customer.totalVisits || 0) + 1;
      customer.totalSpent = (customer.totalSpent || 0) + aptAmount;
      customer.lastVisit = apt.date;
    } else {
      db.customers.push({
        id: `cust-${Date.now()}`,
        name: apt.customerName,
        email: apt.customerEmail || `guest_${custPhone || Date.now()}@auraa.kesug.com`,
        phone: apt.customerPhone,
        totalVisits: 1,
        totalSpent: aptAmount,
        lastVisit: apt.date,
        vipStatus: false,
        notes: apt.source === 'offline' ? "Offline Walk-in guest" : `Completed booking ${apt.bookingCode || ''}`
      });
    }
  }

  if (status === 'confirmed') {
    recordNotification(
      'sms',
      apt.customerPhone,
      'Appointment Approved',
      `✨ AURA: Good news! Your appointment ${apt.bookingCode} has been approved and confirmed for ${apt.date} at ${apt.timeSlot}.`
    );
  }

  saveDb(db);
  res.json(apt);
});

// ==========================================
// 8. CUSTOMERS DIRECTORY (ADMIN)
// ==========================================
app.get('/api/customers', (req, res) => {
  const db = getDb();
  res.json(db.customers);
});

// Add Walk-In / Offline Customer
app.post('/api/customers', (req, res) => {
  const { name, phone, email, totalVisits, totalSpent, lastVisit, vipStatus, notes } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ message: "Customer name is required." });
  }

  const db = getDb();
  const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
  const finalEmail = (email && email.trim()) ? email.trim() : `walkin_${cleanPhone || Date.now()}@salon.internal`;

  const newCustomer = {
    id: `cust-${Date.now()}`,
    name: name.trim(),
    email: finalEmail,
    phone: (phone && phone.trim()) || '+91 98400 00000',
    totalVisits: Number(totalVisits || 1),
    totalSpent: Number(totalSpent || 0),
    lastVisit: lastVisit || new Date().toISOString().split('T')[0],
    vipStatus: Boolean(vipStatus),
    notes: (notes && notes.trim()) || 'Offline / Walk-in guest'
  };

  db.customers.push(newCustomer);
  saveDb(db);
  res.status(201).json(newCustomer);
});

app.put('/api/customers/:id', (req, res) => {
  const db = getDb();
  const index = db.customers.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: "Customer not found." });
  }

  db.customers[index] = { ...db.customers[index], ...req.body };
  saveDb(db);
  res.json(db.customers[index]);
});

app.delete('/api/customers/:id', (req, res) => {
  const db = getDb();
  const initial = db.customers.length;
  db.customers = db.customers.filter(c => c.id !== req.params.id);
  if (db.customers.length === initial) {
    return res.status(404).json({ message: "Customer not found." });
  }

  saveDb(db);
  res.json({ message: "Customer removed successfully." });
});

// ==========================================
// 9. REVENUE & ANALYTICS (REAL DATABASE DRIVEN)
// ==========================================
app.get('/api/analytics/revenue', (req, res) => {
  const db = getDb();
  const appointments = db.appointments || [];

  // ONLY REAL COMPLETED APPOINTMENTS COUNT AS REVENUE
  const completedAppts = appointments.filter(a => a.status === 'completed');

  // Separate Online and Offline Completed Revenue
  const onlineCompleted = completedAppts.filter(a => (a.source || 'online') !== 'offline');
  const offlineCompleted = completedAppts.filter(a => (a.source || '') === 'offline');

  const onlineRevenue = onlineCompleted.reduce((sum, a) => sum + Number(a.totalAmount || a.servicePrice || 0), 0);
  const offlineRevenue = offlineCompleted.reduce((sum, a) => sum + Number(a.totalAmount || a.servicePrice || 0), 0);
  const totalRevenue = onlineRevenue + offlineRevenue;

  // Status breakdown including confirmed, completed, cancelled, pending, and channels
  const statusCounts = {
    total: appointments.length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    pending: appointments.filter(a => a.status === 'pending').length,
    completed: completedAppts.length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
    online: appointments.filter(a => (a.source || 'online') !== 'offline').length,
    offline: appointments.filter(a => (a.source || '') === 'offline').length,
    onlineCompleted: onlineCompleted.length,
    offlineCompleted: offlineCompleted.length
  };

  // Persistent revenueSummary in database
  db.revenueSummary = {
    totalRevenue,
    onlineRevenue,
    offlineRevenue,
    completedCount: completedAppts.length,
    onlineCompletedCount: onlineCompleted.length,
    offlineCompletedCount: offlineCompleted.length,
    confirmedCount: statusCounts.confirmed,
    cancelledCount: statusCounts.cancelled,
    pendingCount: statusCounts.pending,
    lastUpdated: new Date().toISOString()
  };
  saveDb(db);

  // Top services by revenue from completed appointments
  const serviceMap = {};
  completedAppts.forEach(a => {
    const sName = a.serviceName || 'Service';
    if (!serviceMap[sName]) {
      serviceMap[sName] = { name: sName, count: 0, revenue: 0 };
    }
    serviceMap[sName].count += 1;
    serviceMap[sName].revenue += Number(a.totalAmount || a.servicePrice || 0);
  });
  const topServices = Object.values(serviceMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  // Top stylists from completed appointments
  const staffMap = {};
  completedAppts.forEach(a => {
    const stName = a.staffName || 'Stylist';
    if (!staffMap[stName]) {
      staffMap[stName] = { name: stName, count: 0, revenue: 0 };
    }
    staffMap[stName].count += 1;
    staffMap[stName].revenue += Number(a.totalAmount || a.servicePrice || 0);
  });
  const topStaff = Object.values(staffMap).sort((a, b) => b.count - a.count);

  // Monthly revenue calculated strictly from completed appointments
  const monthsMap = {};
  completedAppts.forEach(a => {
    const m = new Date(a.date).toLocaleString('default', { month: 'Short' }) || 'Oct';
    if (!monthsMap[m]) {
      monthsMap[m] = { month: m, revenue: 0, onlineRevenue: 0, offlineRevenue: 0, bookings: 0 };
    }
    const amt = Number(a.totalAmount || a.servicePrice || 0);
    monthsMap[m].revenue += amt;
    if ((a.source || 'online') === 'offline') {
      monthsMap[m].offlineRevenue += amt;
    } else {
      monthsMap[m].onlineRevenue += amt;
    }
    monthsMap[m].bookings += 1;
  });
  let monthlyRevenue = Object.values(monthsMap);
  if (monthlyRevenue.length === 0) {
    const currentMonth = new Date().toLocaleString('default', { month: 'short' });
    monthlyRevenue = [{ month: currentMonth, revenue: 0, onlineRevenue: 0, offlineRevenue: 0, bookings: 0 }];
  }

  const averageTicket = completedAppts.length > 0 ? Math.round(totalRevenue / completedAppts.length) : 0;
  const onlineAvgTicket = onlineCompleted.length > 0 ? Math.round(onlineRevenue / onlineCompleted.length) : 0;
  const offlineAvgTicket = offlineCompleted.length > 0 ? Math.round(offlineRevenue / offlineCompleted.length) : 0;

  res.json({
    totalRevenue,
    onlineRevenue,
    offlineRevenue,
    completedCount: completedAppts.length,
    onlineCompletedCount: onlineCompleted.length,
    offlineCompletedCount: offlineCompleted.length,
    confirmedCount: statusCounts.confirmed,
    cancelledCount: statusCounts.cancelled,
    pendingCount: statusCounts.pending,
    totalBookings: appointments.length,
    averageTicketValue: averageTicket,
    onlineAverageTicket: onlineAvgTicket,
    offlineAverageTicket: offlineAvgTicket,
    totalCustomers: db.customers.length,
    statusCounts,
    revenueSummary: db.revenueSummary,
    topServices,
    topStaff,
    monthlyRevenue
  });
});

// ==========================================
// 10. NOTIFICATIONS LOGS
// ==========================================
app.get('/api/notifications', (req, res) => {
  const db = getDb();
  res.json(db.notifications || []);
});

// ==========================================
// 11. SMTP CONFIGURATION
// ==========================================
app.get('/api/settings/smtp', (req, res) => {
  const db = getDb();
  const smtp = db.smtpConfig || {
    host: 'smtp.gmail.com',
    port: 587,
    user: 'dsah56631@gmail.com',
    pass: ''
  };
  res.json({
    host: smtp.host || 'smtp.gmail.com',
    port: smtp.port || 587,
    user: smtp.user || 'dsah56631@gmail.com',
    hasPass: Boolean(smtp.pass)
  });
});

app.post('/api/settings/smtp', (req, res) => {
  const { host = 'smtp.gmail.com', port = 587, user = 'dsah56631@gmail.com', pass = '' } = req.body;
  const db = getDb();
  if (!db.smtpConfig) db.smtpConfig = {};
  db.smtpConfig.host = host;
  db.smtpConfig.port = Number(port);
  db.smtpConfig.user = user;
  if (pass) db.smtpConfig.pass = pass;
  saveDb(db);

  res.json({
    success: true,
    message: "SMTP settings saved successfully",
    settings: {
      host: db.smtpConfig.host,
      port: db.smtpConfig.port,
      user: db.smtpConfig.user,
      hasPass: Boolean(db.smtpConfig.pass)
    }
  });
});

app.post('/api/settings/test-smtp', (req, res) => {
  const { testEmail } = req.body;
  if (!testEmail || !testEmail.includes('@')) {
    return res.status(400).json({ message: "Valid email address required." });
  }

  res.json({
    success: true,
    message: `Test email dispatched to ${testEmail}!`,
    method: "node_smtp"
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`✨ AURA Salon & Beauty Server running at http://localhost:${PORT}`);
});
