import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export const useLivePolling = (endpoint) => {
  const [data, setData] = useState(null);
  const { token, activeChild, isDemoMode } = useAuth();

  useEffect(() => {
    if (!activeChild || !token) return;

    let isMounted = true;

    const fetchData = async () => {
      try {
        const res = await fetch(`${endpoint}?childId=${activeChild.id}&demo=${isDemoMode}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success && isMounted) {
          setData(json.data);
        }
      } catch (err) {
        console.error('[LivePolling Error]', err);
      }
    };

    fetchData(); // Initial load
    const interval = setInterval(fetchData, 3000); // Poll every 3s

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [endpoint, activeChild, token, isDemoMode]);

  return data;
};
