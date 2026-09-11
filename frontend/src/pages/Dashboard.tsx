import { useEffect, useState } from 'react';
import { checkHealth, type HealthResponse } from '../services/api';

export default function Dashboard() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkHealth()
      .then(setHealth)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Academic Performance Dashboard</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Backend Connection Status</h2>
        {error ? (
          <div className="text-red-600">Error connecting to backend: {error}</div>
        ) : health ? (
          <div className="text-green-600">
            Connected to {health.service} ({health.environment})
          </div>
        ) : (
          <div className="text-gray-500">Checking connection...</div>
        )}
      </div>
    </div>
  );
}
