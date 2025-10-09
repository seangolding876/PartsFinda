'use client';

import { useState } from 'react';

export default function TestAuth() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testSimpleAuth = async () => {
    setLoading(true);
    setResult('Testing...');

    try {
      console.log('Testing simple auth...');

      const response = await fetch('/api/simple-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
          action: 'login'
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      console.log('Response data:', data);

      setResult(`Status: ${response.status}\nData: ${JSON.stringify(data, null, 2)}`);

    } catch (error) {
      console.error('Test error:', error);
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testHelloAPI = async () => {
    setLoading(true);
    setResult('Testing hello API...');

    try {
      const response = await fetch('/api/hello');
      const data = await response.json();
      setResult(`Hello API: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setResult(`Hello API Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testOriginalAuth = async () => {
    setLoading(true);
    setResult('Testing original auth...');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: 'buyer@test.com',
          password: 'password123'
        }),
      });

      const data = await response.json();
      setResult(`Original Auth: Status ${response.status}\n${JSON.stringify(data, null, 2)}`);

    } catch (error) {
      setResult(`Original Auth Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">PartsFinda Authentication Test</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">API Tests</h2>
          <div className="space-x-4 mb-4">
            <button
              onClick={testHelloAPI}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              Test Hello API
            </button>
            <button
              onClick={testSimpleAuth}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Test Simple Auth
            </button>
            <button
              onClick={testOriginalAuth}
              disabled={loading}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
            >
              Test Original Auth
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto whitespace-pre-wrap">
            {result || 'Click a test button above to see results...'}
          </pre>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
          <h3 className="font-semibold text-yellow-800 mb-2">Instructions:</h3>
          <ol className="text-sm text-yellow-700 space-y-1">
            <li>1. Click "Test Hello API" - should return a simple message</li>
            <li>2. Click "Test Simple Auth" - should return auth success</li>
            <li>3. Click "Test Original Auth" - should test the main auth system</li>
            <li>4. Check browser console (F12) for detailed logs</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
