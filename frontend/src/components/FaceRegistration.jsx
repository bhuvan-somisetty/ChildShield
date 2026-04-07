import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, Trash2, CheckCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const FaceRegistration = () => {
  const { token, activeChild, setActiveChild } = useAuth();
  const webcamRef = useRef(null);
  
  const [activeSlot, setActiveSlot] = useState(null); // 1 or 2
  const [loading, setLoading] = useState(false);

  const capture = useCallback(async (slot) => {
    const imageSrc = webcamRef.current.getScreenshot();
    if(!imageSrc) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/children/${activeChild.id}/face`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ slot, imageStr: imageSrc })
      });
      const data = await res.json();
      if(data.success) {
        setActiveChild(data.child); // Update global contextual child
      }
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
      setActiveSlot(null);
    }
  }, [webcamRef, activeChild, token, setActiveChild]);

  const deleteFace = async (slot) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/children/${activeChild.id}/face`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ slot, imageStr: null }) // delete is just setting to null
      });
      const data = await res.json();
      if(data.success) setActiveChild(data.child);
    } catch(err) {}
    setLoading(false);
  };

  if(!activeChild) return null;

  return (
    <div style={{ padding: '24px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginTop: '24px' }}>
      <h3 style={{ fontSize: '18px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Camera size={20} color="var(--accent-cyan)" /> Facial Biometric Enrollment
      </h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
        Register up to two authorized faces for {activeChild.name}. These will be used for Face Presence Verification simulation.
      </p>

      {activeSlot ? (
        <div style={{ textAlign: 'center', background: '#000', borderRadius: '16px', overflow: 'hidden', position: 'relative' }}>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            width="100%"
            videoConstraints={{ facingMode: "user" }}
            style={{ borderRadius: '16px', display: 'block' }}
          />
          <div style={{ position: 'absolute', bottom: '24px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <button onClick={() => setActiveSlot(null)} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>Cancel</button>
            <button onClick={() => capture(activeSlot)} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: 'var(--accent-cyan)', color: '#000', fontWeight: '600', cursor: 'pointer', boxShadow: 'var(--shadow-neon-cyan)' }}>Capture Face {activeSlot}</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          
          {/* Slot 1 */}
          <div style={{ border: '1px dashed rgba(255,255,255,0.2)', padding: '24px', borderRadius: '12px', textAlign: 'center', background: activeChild.faceEnrollment1 ? 'rgba(0,240,255,0.05)' : 'transparent' }}>
            {activeChild.faceEnrollment1 ? (
              <>
                <img src={activeChild.faceEnrollment1} alt="Face 1" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', marginBottom: '16px', border: '2px solid var(--accent-cyan)' }} />
                <div style={{ color: 'var(--accent-green)', fontWeight: '600', fontSize: '14px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><CheckCircle size={16} /> Enrolled</div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <button onClick={() => setActiveSlot(1)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}><RefreshCw size={12}/> Retake</button>
                  <button onClick={() => deleteFace(1)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--accent-red)', color: 'var(--accent-red)', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}><Trash2 size={12}/> Delete</button>
                </div>
              </>
            ) : (
              <>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Camera size={24} color="var(--text-muted)" />
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>Face 1 Not Enrolled</div>
                <button disabled={loading} onClick={() => setActiveSlot(1)} style={{ background: 'var(--accent-cyan)', border: 'none', color: '#000', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Add Face</button>
              </>
            )}
          </div>

          {/* Slot 2 */}
          <div style={{ border: '1px dashed rgba(255,255,255,0.2)', padding: '24px', borderRadius: '12px', textAlign: 'center', background: activeChild.faceEnrollment2 ? 'rgba(0,240,255,0.05)' : 'transparent' }}>
            {activeChild.faceEnrollment2 ? (
              <>
                <img src={activeChild.faceEnrollment2} alt="Face 2" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', marginBottom: '16px', border: '2px solid var(--accent-cyan)' }} />
                <div style={{ color: 'var(--accent-green)', fontWeight: '600', fontSize: '14px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><CheckCircle size={16} /> Enrolled</div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <button onClick={() => setActiveSlot(2)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}><RefreshCw size={12}/> Retake</button>
                  <button onClick={() => deleteFace(2)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--accent-red)', color: 'var(--accent-red)', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}><Trash2 size={12}/> Delete</button>
                </div>
              </>
            ) : (
              <>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Camera size={24} color="var(--text-muted)" />
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>Face 2 Not Enrolled</div>
                <button disabled={loading} onClick={() => setActiveSlot(2)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Add Face</button>
              </>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

export default FaceRegistration;
