'use client';

import { useState } from 'react';

export default function DebugPage() {
  const [results, setResults] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const addResult = (message: string) => {
    setResults(prev => prev + '\n' + message);
  };

  const clearResults = () => {
    setResults('');
  };

  const testLoginAPI = async () => {
    setLoading(true);
    addResult('=== TESTING LOGIN API ===');

    try {
      addResult('Attempting login with test credentials...');

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

      addResult(`Response status: ${response.status}`);
      addResult(`Response headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}`);

      const data = await response.json();
      addResult(`Response data: ${JSON.stringify(data, null, 2)}`);

      // Check cookies
      addResult(`Document cookies: ${document.cookie}`);

    } catch (error) {
      addResult(`Login error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testRegistrationAPI = async () => {
    setLoading(true);
    addResult('=== TESTING REGISTRATION API ===');

    try {
      addResult('Attempting registration with test data...');

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: 'newuser@test.com',
          password: 'password123',
          name: 'Test User',
          phone: '1234567890'
        }),
      });

      addResult(`Response status: ${response.status}`);
      const data = await response.json();
      addResult(`Response data: ${JSON.stringify(data, null, 2)}`);

      // Check cookies
      addResult(`Document cookies: ${document.cookie}`);

    } catch (error) {
      addResult(`Registration error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testVINDecoder = async () => {
    setLoading(true);
    addResult('=== TESTING VIN DECODER ===');

    try {
      const testVin = '4T1G11AK0LU123456';
      addResult(`Testing with VIN: ${testVin}`);

      // Test local API
      addResult('Testing local VIN API...');
      const localResponse = await fetch(`/api/vin?vin=${testVin}`);
      addResult(`Local API status: ${localResponse.status}`);

      const localData = await localResponse.json();
      addResult(`Local API data: ${JSON.stringify(localData, null, 2)}`);

      // Test NHTSA API
      addResult('Testing NHTSA API...');
      try {
        const nhtsaResponse = await fetch(
          `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${testVin}?format=json`
        );
        addResult(`NHTSA API status: ${nhtsaResponse.status}`);

        const nhtsaData = await nhtsaResponse.json();
        addResult(`NHTSA API data (first result): ${JSON.stringify(nhtsaData.Results?.[0] || 'No results', null, 2)}`);
      } catch (nhtsaError) {
        addResult(`NHTSA API error: ${nhtsaError}`);
      }

    } catch (error) {
      addResult(`VIN decoder error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testSimpleAuth = async () => {
    setLoading(true);
    addResult('=== TESTING SIMPLE AUTH ===');

    try {
      const response = await fetch('/api/simple-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
          action: 'login'
        }),
      });

      addResult(`Simple auth status: ${response.status}`);
      const data = await response.json();
      addResult(`Simple auth data: ${JSON.stringify(data, null, 2)}`);

    } catch (error) {
      addResult(`Simple auth error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testAllAPIs = async () => {
    clearResults();
    addResult('=== TESTING ALL APIS ===');

    await testLoginAPI();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

    await testRegistrationAPI();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await testVINDecoder();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await testSimpleAuth();

    addResult('=== ALL TESTS COMPLETED ===');
  };

  const checkCurrentCookies = () => {
    addResult('=== CURRENT COOKIES ===');
    addResult(`Document cookies: ${document.cookie || 'No cookies found'}`);

    // Parse cookies manually
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    addResult(`Parsed cookies: ${JSON.stringify(cookies, null, 2)}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">PartsFinda Debug Dashboard</h1>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Authentication Tests</h2>
            <div className="space-y-2">
              <button
                onClick={testLoginAPI}
                disabled={loading}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Test Login API
              </button>
              <button
                onClick={testRegistrationAPI}
                disabled={loading}
                className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                Test Registration API
              </button>
              <button
                onClick={testSimpleAuth}
                disabled={loading}
                className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
              >
                Test Simple Auth
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Other Tests</h2>
            <div className="space-y-2">
              <button
                onClick={testVINDecoder}
                disabled={loading}
                className="w-full bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50"
              >
                Test VIN Decoder
              </button>
              <button
                onClick={checkCurrentCookies}
                disabled={loading}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50"
              >
                Check Current Cookies
              </button>
              <button
                onClick={testAllAPIs}
                disabled={loading}
                className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
              >
                Test All APIs
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Test Results</h2>
            <button
              onClick={clearResults}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Clear Results
            </button>
          </div>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto whitespace-pre-wrap h-96">
            {results || 'Click a test button above to see results...'}
          </pre>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">Debug Information:</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Current URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}</li>
            <li>• User Agent: {typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}</li>
            <li>• Loading State: {loading ? 'Active' : 'Idle'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
