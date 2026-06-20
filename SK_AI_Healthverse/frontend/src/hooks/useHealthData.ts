import { useState, useEffect } from 'react';

export const useHealthData = (patientId: string) => {
  const [data, setData] = useState<any>({
    patient: null,
    vitals: null,
    risks: [],
    alerts: [],
    vitalsHistory: [],
    healthPlan: [],
    loading: true
  });

  const fetchData = async (isInitial: boolean = false) => {
    try {
      const endpoints = [
        { key: 'patient', url: `/api/patient/${patientId}` },
        { key: 'vitals', url: `/api/vitals/${patientId}` },
        { key: 'risks', url: `/api/risk/${patientId}` },
        { key: 'alerts', url: `/api/alerts/${patientId}` },
        { key: 'vitalsHistory', url: `/api/vitals/${patientId}/history` },
        { key: 'healthPlan', url: `/api/health-plan/${patientId}` }
      ];

      // Update critical vitals/alerts more frequently
      const criticalKeys = ['vitals', 'alerts'];
      
      const results = await Promise.all(
        endpoints.map(async (ep) => {
          if (!isInitial && !criticalKeys.includes(ep.key)) return null;
          const res = await fetch(ep.url);
          return res.ok ? res.json() : null;
        })
      );

      setData((prev: any) => {
        const newData = { ...prev, loading: false };
        endpoints.forEach((ep, i) => {
          if (results[i] !== null) newData[ep.key] = results[i];
        });
        return newData;
      });
    } catch (err) {
      console.error("Data fetch error:", err);
    }
  };

  useEffect(() => {
    fetchData(true);
    
    // Critical data interval: 5 seconds
    const criticalInterval = setInterval(() => fetchData(false), 5000);
    // Full update interval: 60 seconds
    const fullInterval = setInterval(() => fetchData(true), 60000);
    
    return () => {
      clearInterval(criticalInterval);
      clearInterval(fullInterval);
    };
  }, [patientId]);

  return data;
};
