import React, { useState } from 'react';
import { 
  ShieldCheck, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  KeyRound, 
  Zap,
  Globe,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import '../../styles/glassmorphism.css';

export default function AuthPage({ onLoginSuccess }) {
  const { login } = useAuth();
  const { settings } = useSettings();

  const [roleMode, setRoleMode] = useState('super'); // 'super' or 'user'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [shakeCard, setShakeCard] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleTabChange = (mode) => {
    setRoleMode(mode);
    setErrorMessage('');
    setUsername('');
    setPassword('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMsg('');

    if (!username.trim() || !password.trim()) {
      setErrorMessage('Please enter both username and password');
      triggerShake();
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await login(username, password, roleMode === 'super' ? 'Super Admin' : 'User Admin');
      setSuccessMsg(`Authenticated as ${user.role}. Access Granted.`);
      
      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess(user);
        }
      }, 700);
    } catch (err) {
      setErrorMessage(err.message || 'Invalid username or password credentials');
      triggerShake();
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerShake = () => {
    setShakeCard(true);
    setTimeout(() => setShakeCard(false), 500);
  };

  return (
    <div className="glass-page-bg">
      {/* Background Animated Gradient Mesh & Glowing Orbs */}
      <div className="glass-orb glass-orb-1" />
      <div className="glass-orb glass-orb-2" />
      <div className="glass-orb glass-orb-3" />

      {/* Center Glass Card Container */}
      <div className={`glass-card ${shakeCard ? 'glass-card-shake' : ''}`}>
        
        {/* Brand Header */}
        <div className="glass-brand">
          <div className="glass-logo-wrapper">
            <img 
              src="/logo.png" 
              alt="Logo" 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="%236366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>';
              }}
            />
          </div>
          <h1 className="glass-title">
            {settings.company?.name || 'Web Pros Africa'}
          </h1>
          <p className="glass-subtitle">
            Secure Administrator Authentication & Gatekeeper
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="glass-tabs">
          <button
            type="button"
            className={`glass-tab ${roleMode === 'super' ? 'active' : ''}`}
            onClick={() => handleTabChange('super')}
          >
            <ShieldCheck size={16} color={roleMode === 'super' ? '#34d399' : 'currentColor'} />
            Super Admin
          </button>

          <button
            type="button"
            className={`glass-tab ${roleMode === 'user' ? 'active' : ''}`}
            onClick={() => handleTabChange('user')}
          >
            <UserCheck size={16} color={roleMode === 'user' ? '#818cf8' : 'currentColor'} />
            User Admin
          </button>
        </div>

        {/* Error Alert Shake Banner */}
        {errorMessage && (
          <div className="glass-alert-error">
            <AlertCircle size={18} flexShrink={0} color="#ef4444" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Alert Banner */}
        {successMsg && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: '#34d399',
            borderRadius: '12px',
            padding: '12px 14px',
            fontSize: '0.8rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <CheckCircle2 size={18} flexShrink={0} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit}>
          {/* Username Input */}
          <div className="glass-field-group">
            <label className="glass-label" htmlFor="username">
              Username or Administrator ID
            </label>
            <div className="glass-input-wrapper">
              <User size={18} className="glass-input-icon" />
              <input
                id="username"
                type="text"
                className="glass-input"
                placeholder="Enter admin username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="glass-field-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="glass-label" htmlFor="password" style={{ margin: 0 }}>
                Password
              </label>
              <span className="glass-badge-super">
                {roleMode === 'super' ? 'FULL PRIVILEGES' : 'RESTRICTED PRIVILEGES'}
              </span>
            </div>
            
            <div className="glass-input-wrapper">
              <Lock size={18} className="glass-input-icon" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="glass-input"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="glass-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Remember Me Options */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
            fontSize: '0.8rem',
            color: '#94a3b8'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: '#6366f1', borderRadius: '4px' }}
              />
              Remember session
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="glass-btn-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <KeyRound size={18} />
                <span>Sign In as {roleMode === 'super' ? 'Super Admin' : 'User Admin'}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Security Footer */}
        <div className="glass-footer-security">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={14} color="#10b981" />
            <span>256-Bit SSL Encrypted</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Globe size={14} color="#06b6d4" />
            <span>Enterprise Gateway</span>
          </div>
        </div>

      </div>
    </div>
  );
}
