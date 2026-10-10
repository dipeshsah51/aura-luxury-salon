import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

const getClientDeviceInfo = () => {
  try {
    let deviceId = localStorage.getItem('aura_trusted_device_id');
    if (!deviceId) {
      deviceId = 'dev_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
      try {
        localStorage.setItem('aura_trusted_device_id', deviceId);
      } catch {}
    }

    const ua = typeof navigator !== 'undefined' ? (navigator.userAgent || '') : '';
    const screenRes = (typeof window !== 'undefined' && window.screen)
      ? `${window.screen.width || ''}x${window.screen.height || ''}`
      : '';
    const tz = (typeof Intl !== 'undefined' && Intl.DateTimeFormat)
      ? (Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata')
      : 'Asia/Kolkata';
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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('aura_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('aura_token') || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('aura_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('aura_user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('aura_token', token);
    } else {
      localStorage.removeItem('aura_token');
    }
  }, [token]);

  const login = async (email, password, deviceInfo = {}) => {
    setLoading(true);
    try {
      const finalDeviceInfo = (deviceInfo && Object.keys(deviceInfo).length > 0)
        ? deviceInfo
        : getClientDeviceInfo();
      const res = await api.login({ email, password, deviceInfo: finalDeviceInfo });
      if (res.requiresOtp) {
        const safeUser = res.user || { role: 'admin', email: res.email || email, name: 'Salon Director' };
        return {
          success: true,
          requiresOtp: true,
          email: res.email || email,
          user: safeUser,
          message: res.message
        };
      }
      setUser(res.user);
      setToken(res.token);
      return { success: true, user: res.user };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password, phone) => {
    setLoading(true);
    try {
      const res = await api.register({ name, email, password, phone });
      setUser(res.user);
      setToken(res.token);
      return { success: true, user: res.user };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async (email, purpose = 'register', name = '') => {
    setLoading(true);
    try {
      const res = await api.sendOtp({ email, purpose, name });
      return { success: true, data: res };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const verifyOtpRegister = async (data) => {
    setLoading(true);
    try {
      const res = await api.verifyOtpRegister(data);
      setUser(res.user);
      setToken(res.token);
      return { success: true, user: res.user, data: res };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const verifyOtpLogin = async (email, otp, deviceInfo = {}) => {
    setLoading(true);
    try {
      const finalDeviceInfo = (deviceInfo && Object.keys(deviceInfo).length > 0)
        ? deviceInfo
        : getClientDeviceInfo();
      const res = await api.verifyOtpLogin({ email, otp, deviceInfo: finalDeviceInfo });
      setUser(res.user);
      setToken(res.token);
      return { success: true, user: res.user, data: res };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async (role = 'admin') => {
    if (role === 'admin') {
      return login('dsah56631@gmail.com', 'Dip@1234');
    } else {
      return login('sophia@example.com', 'password123');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('aura_user');
    localStorage.removeItem('aura_token');
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      register,
      sendOtp,
      verifyOtpRegister,
      verifyOtpLogin,
      demoLogin,
      logout,
      isAdmin: user?.role === 'admin'
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
