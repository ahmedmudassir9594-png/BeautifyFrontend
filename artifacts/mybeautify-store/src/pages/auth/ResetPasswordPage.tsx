import { useState, useEffect, type FormEvent } from 'react';
import { Link, useSearch } from 'wouter';
import {
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { resetPassword } from '@/services/auth/auth.service';
import '@/styles/reset-password.css';

export default function ResetPasswordPage() {
  const searchString = useSearch();

  // Extract reset token from URL query parameters (supports reactive wouter search + window.location fallback)
  const [token, setToken] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('token') || '';
    }
    return '';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentQuery = window.location.search || searchString;
      const params = new URLSearchParams(currentQuery);
      const urlToken = params.get('token');
      if (urlToken) {
        setToken(urlToken.trim());
      }
    }
  }, [searchString]);

  // Form Fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Password Visibility Toggles
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // States
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ newPassword?: string; confirmNewPassword?: string }>({});
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isTokenInvalid, setIsTokenInvalid] = useState(false);

  // Validate on load if token is completely missing
  const hasToken = Boolean(token && token.trim().length > 0);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setFieldErrors({});

    const tokenToSubmit = token ? token.trim() : '';

    // Verify token presence
    if (!tokenToSubmit) {
      setErrorMessage('Reset password link is invalid or missing.');
      setIsTokenInvalid(true);
      return;
    }

    // Client-side validations
    const errors: { newPassword?: string; confirmNewPassword?: string } = {};

    if (!newPassword) {
      errors.newPassword = 'New password is required.';
    } else if (newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters.';
    }

    if (!confirmNewPassword) {
      errors.confirmNewPassword = 'Confirm your new password.';
    } else if (newPassword !== confirmNewPassword) {
      errors.confirmNewPassword = 'Passwords do not match.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    setIsTokenInvalid(false);

    try {
      await resetPassword({
        token: tokenToSubmit,
        newPassword,
      });

      setIsSuccess(true);
      setErrorMessage('');
      setIsTokenInvalid(false);
    } catch (err: any) {
      const msg = err?.message || 'Password reset failed. Please request a new reset link.';
      const lower = msg.toLowerCase();
      if (lower.includes('token') || lower.includes('expired') || lower.includes('invalid') || lower.includes('not found')) {
        setIsTokenInvalid(true);
      } else {
        setIsTokenInvalid(false);
      }
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-page-container">
      {/* Botanical Corner Decorative Line Art (SVG) */}
      <svg
        className="reset-decor-leaf-tr"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M190 10C150 40 130 90 120 140M190 10C165 30 150 60 148 90C165 75 185 60 190 10ZM120 140C110 110 95 85 70 70C75 100 95 125 120 140ZM148 90C130 75 110 70 85 75C100 95 120 105 148 90ZM120 140C130 165 145 180 170 185C165 160 145 145 120 140Z"
          stroke="#d2a3ac"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <svg
        className="reset-decor-leaf-bl"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M10 190C45 155 70 120 95 70M10 190C25 160 35 130 30 100C48 115 65 135 10 190ZM95 70C80 95 65 115 40 125C52 100 70 80 95 70ZM30 100C45 80 65 75 90 80C75 100 55 110 30 100Z"
          stroke="#d9abb3"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <div className="reset-decor-glow-br" aria-hidden="true" />

      {/* Main Container */}
      <div className="reset-content-wrapper">
        {/* ================= LEFT SECTION: Brand & Reset Hero ================= */}
        <section className="reset-hero-col" aria-label="Brand introduction">
          <Link href="/" className="reset-brand-lockup" title="Return to MyBeautify Home">
            <img
              src="/mybeautify-mark.png"
              alt="MyBeautify Brand Mark"
              className="reset-brand-logo-img"
            />
            <div className="reset-brand-text-block">
              <span className="reset-brand-title">MyBeautify</span>
              <span className="reset-brand-tagline">YOUR DAILY GLOW</span>
            </div>
          </Link>

          {/* Security lock illustration */}
          <div className="reset-illustration-container">
            <img
              src="/reset-password-illustration.jpg"
              alt="Security padlock nestled in rose petals"
              className="reset-illustration-img"
            />
          </div>

          <h1 className="reset-hero-heading">Reset Your Password</h1>
          <p className="reset-hero-subtitle">
            Don’t worry, it happens! Enter your new password below and get back to your beauty journey.
          </p>

          {/* Subtle floral decorative divider */}
          <div className="reset-floral-divider" aria-hidden="true">
            <span className="reset-floral-line" />
            <svg
              className="reset-floral-icon"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 4C12 4 14.5 8 14.5 11.5C14.5 13.5 13.5 15 12 15C10.5 15 9.5 13.5 9.5 11.5C9.5 8 12 4 12 4Z"
                fill="#b85a73"
              />
              <path
                d="M12 15C9.5 15 6 12 5 10C5 12.5 7 16 12 16.5C17 16 19 12.5 19 10C18 12 14.5 15 12 15Z"
                fill="#b85a73"
                opacity="0.85"
              />
              <path
                d="M4 17C7 18 10 18.5 12 18.5C14 18.5 17 18 20 17C18 20 14 20.5 12 20.5C10 20.5 6 20 4 17Z"
                fill="#b85a73"
                opacity="0.6"
              />
            </svg>
            <span className="reset-floral-line right" />
          </div>
        </section>

        {/* ================= RIGHT SECTION: Reset Password Card ================= */}
        <section className="reset-card-col" aria-label="Reset password form">
          <div className="reset-card">
            {/* Top Security Lock Badge */}
            <div className="reset-badge-header" aria-hidden="true">
              <span className="reset-badge-line" />
              <div className="reset-badge-circle">
                <Lock size={18} strokeWidth={2.2} />
              </div>
              <span className="reset-badge-line" />
            </div>

            {/* Success State */}
            {isSuccess ? (
              <div className="reset-success-card" data-testid="reset-password-success-view">
                <div className="reset-success-icon-badge">
                  <CheckCircle2 size={30} strokeWidth={2.4} />
                </div>
                <h2 className="reset-success-title">Password Reset Successfully</h2>
                <p className="reset-success-desc">
                  Your password has been updated successfully. You can now log in with your new password.
                </p>
                <Link
                  href="/sign-in"
                  className="reset-submit-btn"
                  data-testid="button-success-back-to-login"
                >
                  <span>Back to Login</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              <>
                <h2 className="reset-card-title">Create New Password</h2>
                <p className="reset-card-desc">
                  Your new password must be at least 8 characters and include a mix of letters, numbers and symbols.
                </p>

                {/* Missing token alert notice on page load */}
                {!hasToken && (
                  <div className="reset-alert warning" role="alert" data-testid="alert-missing-token">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <div>
                      <div><strong>Reset link is missing or invalid.</strong></div>
                      <div>We could not detect a valid password reset token in this URL. Please request a new reset link.</div>
                      <Link href="/sign-in" className="reset-alert-action-btn">
                        Go to Login & Request Link →
                      </Link>
                    </div>
                  </div>
                )}

                {/* General or Backend Error Message */}
                {errorMessage && (
                  <div className="reset-alert error" role="alert" data-testid="alert-reset-error">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <div>
                      <div>{errorMessage}</div>
                      {isTokenInvalid && (
                        <Link href="/sign-in" className="reset-alert-action-btn">
                          Request New Reset Link →
                        </Link>
                      )}
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="reset-form" noValidate>
                  {/* Field 1: New Password */}
                  <div className="reset-field-group">
                    <div
                      className={`reset-input-wrapper ${
                        fieldErrors.newPassword ? 'error' : ''
                      }`}
                    >
                      <Lock size={17} className="reset-field-icon" aria-hidden="true" />
                      <input
                        id="newPassword"
                        name="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="New Password"
                        aria-label="New Password"
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          if (fieldErrors.newPassword) {
                            setFieldErrors((prev) => ({ ...prev, newPassword: undefined }));
                          }
                        }}
                        disabled={loading || !hasToken}
                        className="reset-input"
                        autoComplete="new-password"
                        data-testid="input-new-password"
                      />
                      <button
                        type="button"
                        className="reset-eye-btn"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                        tabIndex={-1}
                        data-testid="button-toggle-new-password"
                      >
                        {showNewPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                    {fieldErrors.newPassword && (
                      <span className="reset-inline-error" role="alert">
                        {fieldErrors.newPassword}
                      </span>
                    )}
                  </div>

                  {/* Field 2: Confirm New Password */}
                  <div className="reset-field-group">
                    <div
                      className={`reset-input-wrapper ${
                        fieldErrors.confirmNewPassword ? 'error' : ''
                      }`}
                    >
                      <Lock size={17} className="reset-field-icon" aria-hidden="true" />
                      <input
                        id="confirmNewPassword"
                        name="confirmNewPassword"
                        type={showConfirmNewPassword ? 'text' : 'password'}
                        placeholder="Confirm New Password"
                        aria-label="Confirm New Password"
                        value={confirmNewPassword}
                        onChange={(e) => {
                          setConfirmNewPassword(e.target.value);
                          if (fieldErrors.confirmNewPassword) {
                            setFieldErrors((prev) => ({ ...prev, confirmNewPassword: undefined }));
                          }
                        }}
                        disabled={loading || !hasToken}
                        className="reset-input"
                        autoComplete="new-password"
                        data-testid="input-confirm-password"
                      />
                      <button
                        type="button"
                        className="reset-eye-btn"
                        onClick={() => setShowConfirmNewPassword((prev) => !prev)}
                        aria-label={showConfirmNewPassword ? 'Hide confirm password' : 'Show confirm password'}
                        tabIndex={-1}
                        data-testid="button-toggle-confirm-password"
                      >
                        {showConfirmNewPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                    {fieldErrors.confirmNewPassword && (
                      <span className="reset-inline-error" role="alert">
                        {fieldErrors.confirmNewPassword}
                      </span>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="reset-submit-btn"
                    disabled={loading || !hasToken}
                    data-testid="button-reset-password"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={17} className="animate-spin" />
                        <span>Resetting Password...</span>
                      </>
                    ) : (
                      <>
                        <span>Reset Password</span>
                        <span className="reset-btn-arrow">→</span>
                      </>
                    )}
                  </button>

                  {/* Back to Login link */}
                  <div className="reset-back-link-wrap">
                    <Link
                      href="/sign-in"
                      className="reset-back-link"
                      data-testid="link-back-to-login"
                    >
                      <span>← Back to Login</span>
                    </Link>
                  </div>
                </form>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
