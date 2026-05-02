import React, { useState } from 'react';
import API from '../../api/axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import './Login.css';

const ForgotPasswordMobile = () => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await API.post('/auth/forgot-password-mobile', { phone });
      toast.success(res.data?.message || 'If this mobile number is registered, password reset link has been sent.');
      setPhone('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-logo">
          <h1>⚡ FlowTrack</h1>
          <p>Reset your password using registered mobile number</p>
        </div>

        <form onSubmit={submit}>
          <div className="form-group">
            <label>Registered Mobile Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your registered mobile number"
              required
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="login-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Link to="/login">Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordMobile;