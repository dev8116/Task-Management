import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import API from '../../api/axios';
import './SelfieVerificationModal.css';

const SelfieVerificationModal = ({ open, check, onVerified, onFailedOrMissed }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [selfieBlob, setSelfieBlob] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState('');

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (e) {
      toast.error('Camera permission denied');
    }
  };

  useEffect(() => {
    if (!open) return;

    setSelfieBlob(null);
    setSelfiePreview('');
    startCamera();

    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, check?._id]);

  if (!open || !check?._id) return null;

  const captureSelfie = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setSelfieBlob(blob);
        setSelfiePreview(URL.createObjectURL(blob));
        toast.success('Selfie captured!');
      },
      'image/jpeg',
      0.9
    );
  };

  const submit = async () => {
    if (!selfieBlob) {
      toast.error('Please capture a selfie first');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('selfie', selfieBlob, 'selfie.jpg');

      const res = await API.post(`/attendance/selfie-check/${check._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(res.data?.message || 'Selfie verification successful');
      stopCamera();
      onVerified?.(res.data?.attendance);
    } catch (err) {
      const msg = err.response?.data?.message || 'Selfie verification failed';
      toast.error(msg);
      stopCamera();
      onFailedOrMissed?.(err.response?.data?.attendance || null);
    } finally {
      setLoading(false);
    }
  };

  const skip = async () => {
    setLoading(true);
    try {
      const res = await API.post(`/attendance/selfie-check/${check._id}/skip`, null, {
        meta: { background: true },
      });

      toast.warn(res.data?.message || 'Skipped selfie verification');
      stopCamera();
      onFailedOrMissed?.(res.data?.attendance || null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Skip failed');
      stopCamera();
      onFailedOrMissed?.(err.response?.data?.attendance || null);
    } finally {
      setLoading(false);
    }
  };

  const deadlineText = check.responseDeadline ? new Date(check.responseDeadline).toLocaleTimeString() : '';

  return (
    <div className="ft-modal-overlay">
      <div className="ft-modal ft-modal-lg svm-modal" role="dialog" aria-modal="true">
        <div className="ft-modal-header">
          <h3>Selfie Verification Required</h3>
        </div>

        <div className="ft-modal-body">
          <p className="svm-warning">
            Please take selfie within 2 minutes. You can miss 1 time. On the 2nd miss you will be automatically checked out.
          </p>
          <p className="svm-deadline">Deadline: {deadlineText}</p>

          <div className="svm-camera">
            <video ref={videoRef} className="svm-video" />
            <canvas ref={canvasRef} className="svm-canvas" />
            {selfiePreview ? <img className="svm-preview" src={selfiePreview} alt="Selfie preview" /> : null}
          </div>
        </div>

        <div className="ft-modal-footer svm-actions">
          <button className="svm-btn" onClick={captureSelfie} disabled={loading}>
            Capture Selfie
          </button>
          <button className="svm-btn primary" onClick={submit} disabled={loading || !selfieBlob}>
            {loading ? 'Verifying...' : 'Submit & Verify'}
          </button>
          <button className="svm-btn danger" onClick={skip} disabled={loading}>
            Skip
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelfieVerificationModal;