import { useState, useRef, useEffect, useCallback } from 'react';
import { HiExclamationCircle } from 'react-icons/hi';

const OTP_LENGTH = 6;
const RESEND_DELAY = 60;

function formatTime(s) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export default function OTPVerification({ onVerify, onResend, email, loading }) {
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [timer, setTimer] = useState(RESEND_DELAY);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef([]);

  // Countdown timer
  useEffect(() => {
    if (timer <= 0) {
      setCanResend(true);
      return;
    }
    const id = setTimeout(() => setTimer((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timer]);

  const focusInput = (index) => {
    inputRefs.current[index]?.focus();
  };

  const handleChange = (index, value) => {
    // Accept only single digit
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setError('');
    if (digit && index < OTP_LENGTH - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const next = [...digits];
        next[index] = '';
        setDigits(next);
      } else if (index > 0) {
        focusInput(index - 1);
        const next = [...digits];
        next[index - 1] = '';
        setDigits(next);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      focusInput(index - 1);
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      focusInput(index + 1);
    }
  };

  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill('');
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    setError('');
    focusInput(Math.min(pasted.length, OTP_LENGTH - 1));
  }, []);

  const handleVerify = () => {
    const code = digits.join('');
    if (code.length < OTP_LENGTH) {
      setError('Please enter all 6 digits.');
      return;
    }
    onVerify(code);
  };

  const handleResend = () => {
    if (!canResend) return;
    setDigits(Array(OTP_LENGTH).fill(''));
    setError('');
    setTimer(RESEND_DELAY);
    setCanResend(false);
    focusInput(0);
    onResend();
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
        We sent a 6-digit code to{' '}
        <span className="font-medium text-gray-700 dark:text-gray-300">{email}</span>.
        Enter it below to verify your account.
      </p>

      {/* OTP inputs */}
      <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => (inputRefs.current[i] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            autoFocus={i === 0}
            className={`h-12 w-10 sm:w-12 rounded-lg border-2 text-center text-lg font-bold bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition focus:outline-none focus:ring-2 ${
              error
                ? 'border-red-400 dark:border-red-600 focus:border-red-500 focus:ring-red-500/20'
                : digit
                ? 'border-blue-500 dark:border-blue-400 focus:border-blue-500 focus:ring-blue-500/20'
                : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500/20'
            }`}
            aria-label={`OTP digit ${i + 1}`}
          />
        ))}
      </div>

      {error && (
        <div className="flex items-center justify-center gap-2 text-sm text-red-600 dark:text-red-400">
          <HiExclamationCircle />
          <span>{error}</span>
        </div>
      )}

      {/* Verify button */}
      <button
        type="button"
        onClick={handleVerify}
        disabled={loading}
        className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-2.5 text-sm font-semibold shadow-md shadow-blue-500/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Verifying…
          </span>
        ) : (
          'Verify Code'
        )}
      </button>

      {/* Resend */}
      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        Didn't receive the code?{' '}
        {canResend ? (
          <button
            type="button"
            onClick={handleResend}
            className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            Resend
          </button>
        ) : (
          <span className="font-medium text-gray-400 dark:text-gray-500">
            Resend in {formatTime(timer)}
          </span>
        )}
      </p>
    </div>
  );
}
