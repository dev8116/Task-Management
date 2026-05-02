import React, { useEffect, useRef, useState } from 'react';
import API from '../../api/axios';
import DataTable from '../../components/Common/DataTable';
import { toast } from 'react-toastify';
import { FiLogIn, FiLogOut, FiCamera, FiCheckCircle } from 'react-icons/fi';
import '../Employee/MyAttendance.css';

const isAfter6PM = () => {
  const d = new Date();
  const h = d.getHours();
  const m = d.getMinutes();
  return h > 18 || (h === 18 && m >= 0);
};

const summarizeSelfieChecks = (row) => {
  const checks = Array.isArray(row?.selfieChecks) ? row.selfieChecks : [];
  if (!checks.length) return '—';

  const counts = checks.reduce(
    (acc, c) => {
      const s = c?.status;
      if (s === 'verified') acc.verified += 1;
      else if (s === 'failed') acc.failed += 1;
      else if (s === 'missed') acc.missed += 1;
      else if (s === 'pending') acc.pending += 1;
      return acc;
    },
    { verified: 0, failed: 0, missed: 0, pending: 0 }
  );

  return `V:${counts.verified} F:${counts.failed} M:${counts.missed} P:${counts.pending}`;
};

const ManagerAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [todayStatus, setTodayStatus] = useState(null);

  const [cameraOn, setCameraOn] = useState(false);
  const [selfieBlob, setSelfieBlob] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState('');

  const [otLoading, setOtLoading] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    fetchData();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      const [attRes, todayRes] = await Promise.all([
        API.get('/attendance'),
        API.get('/attendance/today'),
      ]);
      setAttendance(attRes.data || []);
      setTodayStatus(todayRes.data);
    } catch (err) {
      toast.error('Failed to fetch attendance');
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
    } catch (err) {
      toast.error('Camera permission denied');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraOn(false);
  };

  const captureSelfie = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      setSelfieBlob(blob);
      setSelfiePreview(URL.createObjectURL(blob));
      toast.success('Selfie captured!');
    }, 'image/jpeg', 0.9);
  };

  const submitFaceAttendance = async (endpoint) => {
    if (!selfieBlob) {
      toast.error('Please capture a selfie first');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('selfie', selfieBlob, 'selfie.jpg');

      await API.post(`/attendance/${endpoint}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(endpoint.includes('check-in') ? 'Checked in successfully!' : 'Checked out successfully!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Face verification failed');
    }
  };

  const handleCheckIn = () => submitFaceAttendance('face-check-in');
  const handleCheckOut = () => submitFaceAttendance('face-check-out');

  const overtimeCheckIn = async () => {
    setOtLoading(true);
    try {
      await API.post('/attendance/overtime-check-in');
      toast.success('Overtime checked in!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Overtime check-in failed');
    } finally {
      setOtLoading(false);
    }
  };

  const overtimeCheckOut = async () => {
    setOtLoading(true);
    try {
      await API.post('/attendance/overtime-check-out');
      toast.success('Overtime checked out!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Overtime check-out failed');
    } finally {
      setOtLoading(false);
    }
  };

  const formatTime = (d) => (d ? new Date(d).toLocaleTimeString() : '--');

  const hasCheckedIn = !!todayStatus?.checkIn;
  const hasCheckedOut = !!todayStatus?.checkOut;

  const hasOtIn = !!todayStatus?.overtimeCheckIn;
  const hasOtOut = !!todayStatus?.overtimeCheckOut;

  const showOvertimeButtons = isAfter6PM() && hasCheckedOut;

  const columns = [
    { header: 'Date', accessor: 'date' },
    { header: 'Check In', render: (row) => formatTime(row.checkIn) },
    { header: 'Check Out', render: (row) => formatTime(row.checkOut) },
    { header: 'Total Hours', render: (row) => (row.totalHours ? `${row.totalHours}h` : '--') },

    { header: 'OT In', render: (row) => formatTime(row.overtimeCheckIn) },
    { header: 'OT Out', render: (row) => formatTime(row.overtimeCheckOut) },
    { header: 'OT Hours', render: (row) => (row.overtimeHours ? `${row.overtimeHours}h` : '--') },

    // NEW optional columns
    { header: 'Selfie Checks', render: (row) => summarizeSelfieChecks(row) },
    { header: 'Auto Checkout Reason', render: (row) => row.autoCheckoutReason || '—' },

    {
      header: 'Status',
      render: (row) => (
        <span className={`status-badge ${row.status?.toLowerCase().replace(/ /g, '-')}`}>
          {row.status}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header"><h2>My Attendance</h2></div>

      <div className="camera-card">
        <div className="camera-actions">
          {!cameraOn ? (
            <button className="camera-btn" onClick={startCamera}>
              <FiCamera /> Open Camera
            </button>
          ) : (
            <button className="camera-btn stop" onClick={stopCamera}>
              Stop Camera
            </button>
          )}
          <button className="camera-btn capture" onClick={captureSelfie} disabled={!cameraOn}>
            <FiCheckCircle /> Capture Selfie
          </button>
        </div>

        <div className="camera-preview">
          <video ref={videoRef} className="camera-video" />
          <canvas ref={canvasRef} className="camera-canvas" />
          {selfiePreview && <img src={selfiePreview} alt="Selfie" className="selfie-preview" />}
        </div>
      </div>

      <div className="today-status">
        <div className="today-status-item">
          <div className="label">Today's Date</div>
          <div className="value">{new Date().toLocaleDateString()}</div>
        </div>
        <div className="today-status-item">
          <div className="label">Check In</div>
          <div className="value">{hasCheckedIn ? formatTime(todayStatus.checkIn) : 'Not yet'}</div>
        </div>
        <div className="today-status-item">
          <div className="label">Check Out</div>
          <div className="value">{hasCheckedOut ? formatTime(todayStatus.checkOut) : 'Not yet'}</div>
        </div>
        <div className="today-status-item">
          <div className="label">Status</div>
          <div className="value">
            {hasCheckedOut ? '✅ Completed' : hasCheckedIn ? '🟢 Working' : '⏳ Not Started'}
          </div>
        </div>

        <div className="today-status-item">
          <div className="label">Overtime</div>
          <div className="value">
            {hasOtOut
              ? `✅ Completed (${todayStatus?.overtimeHours || 0}h)`
              : hasOtIn
              ? '🟠 In Overtime'
              : '—'}
          </div>
        </div>
      </div>

      <div className="attendance-actions">
        <button className="attendance-btn check-in" onClick={handleCheckIn} disabled={hasCheckedIn}>
          <FiLogIn /> {hasCheckedIn ? 'Already Checked In' : 'Check In'}
        </button>
        <button className="attendance-btn check-out" onClick={handleCheckOut} disabled={!hasCheckedIn || hasCheckedOut}>
          <FiLogOut /> {hasCheckedOut ? 'Already Checked Out' : 'Check Out'}
        </button>
      </div>

      {showOvertimeButtons && (
        <div className="attendance-actions overtime-actions">
          <button
            className="attendance-btn overtime-in"
            onClick={overtimeCheckIn}
            disabled={otLoading || hasOtIn}
          >
            <FiLogIn /> {hasOtIn ? 'OT Checked In' : 'Overtime Check In'}
          </button>
          <button
            className="attendance-btn overtime-out"
            onClick={overtimeCheckOut}
            disabled={otLoading || !hasOtIn || hasOtOut}
          >
            <FiLogOut /> {hasOtOut ? 'OT Checked Out' : 'Overtime Check Out'}
          </button>
        </div>
      )}

      <DataTable title={`Attendance History (${attendance.length})`} columns={columns} data={attendance} />
    </div>
  );
};

export default ManagerAttendance;