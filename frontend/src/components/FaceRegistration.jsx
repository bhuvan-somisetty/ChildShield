import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, Trash2, CheckCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const FaceRegistration = () => {
  const { token, activeChild, setActiveChild } = useAuth();
  const webcamRef = useRef(null);
  
  const [activeSlot, setActiveSlot] = useState(null); // numeric index 0 to 3
  const [loading, setLoading] = useState(false);

  const capture = useCallback(async (slotIndex) => {
    const imageSrc = webcamRef.current.getScreenshot();
    if(!imageSrc) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/children/${activeChild.id}/face`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ slot: slotIndex, imageStr: imageSrc })
      });
      const data = await res.json();
      if(data.success && data.child) {
        setActiveChild(data.child); // Update global contextual child safely
      }
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
      setActiveSlot(null);
    }
  }, [webcamRef, activeChild, token, setActiveChild]);

  const deleteFace = async (slotIndex) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/children/${activeChild.id}/face`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ slot: slotIndex, imageStr: null }) // delete is setting to null
      });
      const data = await res.json();
      if(data.success && data.child) setActiveChild(data.child);
    } catch(err) {}
    setLoading(false);
  };

  if(!activeChild) return null;

  const validFaces = activeChild.authorizedFaces || [];
  
  return (
    <div style={{ padding: '24px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginTop: '24px' }}>
      <h3 style={{ fontSize: '18px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Camera size={20} color="var(--accent-cyan)" /> Facial Biometric Enrollment
      </h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
        Register up to four authorized faces for {activeChild.name}. These will be used for AI Face Presence Verification.
      </p>

      {activeSlot !== null ? (
        <div className="glass-panel animate-fade-in" style={{ textAlign: 'center', background: '#000', borderRadius: '16px', overflow: 'hidden', position: 'relative' }}>
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
            <button onClick={() => capture(activeSlot)} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: 'var(--accent-cyan)', color: '#000', fontWeight: '600', cursor: 'pointer', boxShadow: 'var(--shadow-neon-cyan)' }}>Capture Face {activeSlot + 1}</button>
          </div>
        </div>
      ) : (
        <div className="responsive-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', display: 'grid' }}>
          {[0, 1, 2, 3].map(slotIndex => {
            const hasFace = !!validFaces[slotIndex];
            const faceImg = hasFace ? validFaces[slotIndex].image : null;
            return (
              <div key={slotIndex} style={{ border: '1px dashed rgba(255,255,255,0.2)', padding: '16px', borderRadius: '12px', textAlign: 'center', background: hasFace ? 'rgba(0,240,255,0.05)' : 'transparent' }}>
                {hasFace ? (
                  <>
                    <img src={faceImg} alt={`Face ${slotIndex + 1}`} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', marginBottom: '12px', border: '2px solid var(--accent-cyan)' }} />
                    <div style={{ color: 'var(--accent-green)', fontWeight: '600', fontSize: '12px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><CheckCircle size={14} /> Enrolled</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'center' }}>
                      <button onClick={() => setActiveSlot(slotIndex)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '6px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '11px' }}><RefreshCw size={12}/> Retake</button>
                      <button onClick={() => deleteFace(slotIndex)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--accent-red)', color: 'var(--accent-red)', padding: '6px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '11px' }}><Trash2 size={12}/> Delete</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                      <Camera size={20} color="var(--text-muted)" />
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '12px' }}>Face {slotIndex + 1}</div>
                    {/* Ensure sequential alignment so they can't register Slot 4 without Slot 1 */}
                    <button 
                      disabled={loading || (slotIndex > 0 && !validFaces[slotIndex - 1])} 
                      onClick={() => setActiveSlot(slotIndex)} 
                      style={{ background: (slotIndex > 0 && !validFaces[slotIndex - 1]) ? 'rgba(255,255,255,0.05)' : 'var(--accent-cyan)', border: 'none', color: '#000', padding: '8px', width: '100%', borderRadius: '6px', cursor: (slotIndex > 0 && !validFaces[slotIndex - 1]) ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '11px' }}
                    >
                      {loading ? '...' : '+ Add'}
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default FaceRegistration;
