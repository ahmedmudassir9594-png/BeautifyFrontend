import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Mail,
  Lock,
  User as UserIcon,
  Phone,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
} from 'lucide-react';
import { login, register, forgotPassword } from '@/services/auth/auth.service';
import { hasAdminRole } from '@/utils/auth';
export { hasAdminRole };
import '@/styles/auth.css';

interface AuthPageProps {
  mode: 'login' | 'register';
}

export default function AuthPage({ mode }: AuthPageProps) {
  const [, setLocation] = useLocation();
  const isRegister = mode === 'register';

  // Extract redirect target safely (prevent open redirect attacks)
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const rawRedirect = searchParams.get('redirect');
  const safeRedirect = rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') && !rawRedirect.includes(':')
    ? rawRedirect
    : null;

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Password Visibility toggles (independent for password and confirmPassword)
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // States
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Forgot password modal
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Client-side validations
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    if (isRegister) {
      const cleanName = fullName.trim();
      if (!cleanName || cleanName.length < 2) {
        setErrorMessage('Please enter your full name (at least 2 characters).');
        return;
      }
      if (password.length < 8) {
        setErrorMessage('Password must be at least 8 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please re-enter.');
        return;
      }
    }

    setLoading(true);

    try {
      if (isRegister) {
        // Submit registration payload to real Spring Boot backend
        const res = await register(
          {
            fullName: fullName.trim(),
            email: cleanEmail.toLowerCase(),
            password,
            phoneNumber: phoneNumber.trim() || undefined,
          },
          rememberMe
        );

        setSuccessMessage('Account created successfully! Welcome to Malka Zai.');
        setTimeout(() => {
          setLocation(hasAdminRole(res.user?.role) ? '/admin' : (safeRedirect || '/'));
        }, 600);
      } else {
        // Submit login payload to real Spring Boot backend
        const res = await login(
          {
            email: cleanEmail.toLowerCase(),
            password,
          },
          rememberMe
        );

        setSuccessMessage('Login successful! Welcome back to Malka Zai.');
        setTimeout(() => {
          setLocation(hasAdminRole(res.user?.role) ? '/admin' : (safeRedirect || '/'));
        }, 500);
      }
    } catch (err: any) {
      setErrorMessage(
        err?.message ||
          (isRegister
            ? 'Could not create your account. Please check your information and try again.'
            : 'Invalid email or password. Please try again.')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    const cleanEmail = forgotEmail.trim();
    if (!cleanEmail) {
      setForgotError('Please enter your email address.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await forgotPassword({ email: cleanEmail });
      setForgotSuccess(
        res?.message || 'If an account exists with this email, reset instructions have been sent.'
      );
    } catch (err: any) {
      setForgotError(
        err?.message || 'Could not send reset link. Please check the email and try again.'
      );
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      {/* Decorative Botanical Corner Flourishes matching reference */}
      <svg
        className="auth-botanical-deco auth-botanical-tl"
        viewBox="0 0 160 160"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M10,150 C20,110 50,60 120,20" />
        <path d="M35,115 C45,100 65,95 75,105 C65,115 45,120 35,115 Z" fill="currentColor" fillOpacity="0.08" />
        <path d="M60,85 C75,70 95,72 100,85 C90,95 70,95 60,85 Z" fill="currentColor" fillOpacity="0.08" />
        <path d="M90,50 C105,38 125,42 128,55 C118,65 98,62 90,50 Z" fill="currentColor" fillOpacity="0.08" />
        <path d="M120,20 C135,10 150,15 152,25 C142,35 125,32 120,20 Z" fill="currentColor" fillOpacity="0.08" />
      </svg>

      <svg
        className="auth-botanical-deco auth-botanical-br"
        viewBox="0 0 160 160"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M150,10 C140,50 110,100 40,140" />
        <path d="M125,45 C115,60 95,65 85,55 C95,45 115,40 125,45 Z" fill="currentColor" fillOpacity="0.08" />
        <path d="M100,75 C85,90 65,88 60,75 C70,65 90,65 100,75 Z" fill="currentColor" fillOpacity="0.08" />
        <path d="M70,110 C55,122 35,118 32,105 C42,95 62,98 70,110 Z" fill="currentColor" fillOpacity="0.08" />
      </svg>

      <svg
        className="auth-botanical-deco auth-botanical-tr"
        viewBox="0 0 120 120"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M110,10 C90,30 80,60 85,95" />
        <path d="M95,35 C85,42 75,38 72,30 C80,24 90,28 95,35 Z" fill="currentColor" fillOpacity="0.06" />
        <path d="M85,65 C75,70 68,62 65,55 C74,50 82,56 85,65 Z" fill="currentColor" fillOpacity="0.06" />
      </svg>

      <div className="auth-luxury-card">
        {/* ================= LEFT SIDE: Malka Zai Branding & Jewellery Visual ================= */}
        <div className="auth-visual-col">
          <Link href="/" className="auth-brand-lockup" title="Return to Malka Zai Home">
            <img
              src="/malka-zai-emblem.png"
              alt="Malka Zai Monogram and Crown"
              className="auth-brand-logo-img"
            />
            <h2 className="auth-brand-title">MALKA ZAI</h2>
          </Link>

          {/* Thin gold ornamental divider beneath brand name */}
          <div className="auth-ornament-divider" aria-hidden="true">
            <span className="auth-ornament-line" />
            <span className="auth-ornament-symbol">❖</span>
            <span className="auth-ornament-line" />
          </div>

          {/* Fine jewellery imagery at bottom of left panel */}
          <div className="auth-visual-media-box">
            <img
              src="/malka-zai-signup-jewels.jpg"
              alt="Malka Zai Fine Jewellery Collection"
              className="auth-visual-media-img"
              loading="lazy"
            />
          </div>
        </div>

        {/* ================= RIGHT SIDE: Authentication Form ================= */}
        <div className="auth-form-col">
          {/* Top Navigation Row */}
          <div className="auth-top-nav-bar">
            <Link href={safeRedirect || '/'} className="auth-back-link" title="Return to store">
              <ArrowLeft size={15} />
              <span>Back to Store</span>
            </Link>

            <div className="auth-top-switch">
              <span className="auth-top-divider">|</span>
              <span>{isRegister ? 'Already a member?' : 'New here?'}</span>
              <Link
                href={
                  isRegister
                    ? (safeRedirect ? `/sign-in?redirect=${encodeURIComponent(safeRedirect)}` : '/sign-in')
                    : (safeRedirect ? `/register?redirect=${encodeURIComponent(safeRedirect)}` : '/register')
                }
                className="auth-pill-btn"
                data-testid="link-auth-top-switch"
              >
                {isRegister ? 'Sign In' : 'Sign Up'}
              </Link>
            </div>
          </div>

          {/* Form Header */}
          <div className="auth-form-header">
            <h1 className="auth-main-title">
              {isRegister ? 'Create Your Account' : 'Welcome Back'}
            </h1>
            <p className="auth-main-subtitle">
              {isRegister
                ? 'Begin your Malka Zai journey.'
                : 'Enter your email and password to access your account.'}
            </p>
          </div>

          {/* Error & Success Feedback */}
          {errorMessage && (
            <div className="auth-alert-box error" role="alert" data-testid="status-auth-error">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="auth-alert-box success" role="status" data-testid="status-auth-success">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Main Auth Form */}
          <form className="auth-form-body" onSubmit={handleAuthSubmit} noValidate>
            {/* 1. Full Name (Sign Up only) */}
            {isRegister && (
              <div className="auth-field-row">
                <div className="auth-input-wrapper">
                  <UserIcon size={18} className="auth-field-icon" aria-hidden="true" />
                  <input
                    type="text"
                    className="auth-text-input"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    minLength={2}
                    autoComplete="name"
                    aria-label="Full Name"
                    data-testid="input-fullname"
                  />
                </div>
              </div>
            )}

            {/* 2. Email Address */}
            <div className="auth-field-row">
              <div className="auth-input-wrapper">
                <Mail size={18} className="auth-field-icon" aria-hidden="true" />
                <input
                  type="email"
                  className="auth-text-input"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  aria-label="Email Address"
                  data-testid="input-email"
                />
              </div>
            </div>

            {/* 3. Phone Number (Sign Up only, optional) */}
            {isRegister && (
              <div className="auth-field-row">
                <div className="auth-input-wrapper">
                  <Phone size={18} className="auth-field-icon" aria-hidden="true" />
                  <input
                    type="tel"
                    className="auth-text-input"
                    placeholder="Phone Number (Optional)"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    autoComplete="tel"
                    aria-label="Phone Number (Optional)"
                    data-testid="input-phone"
                  />
                </div>
              </div>
            )}

            {/* 4. Password Field */}
            <div className="auth-field-row">
              <div className="auth-input-wrapper">
                <Lock size={18} className="auth-field-icon" aria-hidden="true" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-text-input"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={isRegister ? 8 : 6}
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  aria-label="Password"
                  data-testid="input-password"
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  tabIndex={0}
                  data-testid="button-toggle-password"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* 5. Confirm Password (Sign Up only) */}
            {isRegister && (
              <div className="auth-field-row">
                <div className="auth-input-wrapper">
                  <Lock size={18} className="auth-field-icon" aria-hidden="true" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="auth-text-input"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    aria-label="Confirm Password"
                    data-testid="input-confirm-password"
                  />
                  <button
                    type="button"
                    className="auth-eye-btn"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    aria-pressed={showConfirmPassword}
                    tabIndex={0}
                    data-testid="button-toggle-confirm-password"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {/* Remember Me & Forgot Password (Login only) */}
            {!isRegister && (
              <div className="auth-extras-row">
                <label className="auth-remember-label">
                  <input
                    type="checkbox"
                    className="auth-remember-checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    data-testid="checkbox-remember-me"
                  />
                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  className="auth-forgot-btn"
                  onClick={() => {
                    setForgotEmail(email);
                    setForgotModalOpen(true);
                  }}
                  data-testid="button-forgot-password"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {/* Submit Action Button */}
            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
              data-testid="button-submit-auth"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>{isRegister ? 'Creating Account…' : 'Signing In…'}</span>
                </>
              ) : (
                <>
                  <span>{isRegister ? 'CREATE ACCOUNT' : 'SIGN IN'}</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>

            {/* Terms notice on Signup */}
            {isRegister && (
              <p className="auth-terms-note">
                By creating an account, you agree to our{' '}
                <a href="#terms" onClick={(e) => e.preventDefault()}>Terms &amp; Conditions</a>{' '}
                and{' '}
                <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy Policy</a>.
              </p>
            )}
          </form>

          {/* Bottom Switch Prompt */}
          <div className="auth-bottom-prompt">
            <span>{isRegister ? 'Already a member?' : "Don't have an account?"}</span>
            <Link
              href={isRegister ? '/sign-in' : '/register'}
              className="auth-bottom-link"
              data-testid="link-auth-bottom-switch"
            >
              {isRegister ? 'Sign In' : 'Sign Up'}
            </Link>
          </div>
        </div>
      </div>

      {/* ================= FORGOT PASSWORD MODAL ================= */}
      {forgotModalOpen && (
        <div className="auth-modal-backdrop" onClick={() => setForgotModalOpen(false)}>
          <div
            className="auth-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="forgot-password-title"
          >
            <button
              type="button"
              className="auth-modal-close"
              onClick={() => setForgotModalOpen(false)}
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>

            <h3 id="forgot-password-title" className="auth-modal-title">
              Reset Password
            </h3>
            <p className="auth-modal-desc">
              Enter your email address and we will send you instructions to reset your password.
            </p>

            {forgotError && (
              <div className="auth-alert-box error" role="alert" style={{ marginBottom: 12 }}>
                <AlertCircle size={15} />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div className="auth-alert-box success" role="status" style={{ marginBottom: 12 }}>
                <CheckCircle2 size={15} />
                <span>{forgotSuccess}</span>
              </div>
            )}

            {!forgotSuccess && (
              <form onSubmit={handleForgotPasswordSubmit}>
                <div className="auth-input-wrapper" style={{ marginBottom: 14 }}>
                  <Mail size={18} className="auth-field-icon" aria-hidden="true" />
                  <input
                    type="email"
                    className="auth-text-input"
                    placeholder="Enter your account email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    autoFocus
                    aria-label="Account email"
                  />
                </div>

                <button
                  type="submit"
                  className="auth-submit-btn"
                  disabled={forgotLoading}
                >
                  {forgotLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Sending…</span>
                    </>
                  ) : (
                    <span>Send Reset Link →</span>
                  )}
                </button>
              </form>
            )}

            {forgotSuccess && (
              <button
                type="button"
                className="auth-submit-btn"
                style={{ marginTop: 12 }}
                onClick={() => setForgotModalOpen(false)}
              >
                Done
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
