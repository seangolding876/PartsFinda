// components/TestAlerts.tsx
'use client';

export default function TestAlerts() {
  const testAlert = (type: string) => {
    // @ts-ignore
    if (window.showAlert) {
      // @ts-ignore
      window.showAlert(`This is a ${type} alert!`, type);
    } else {
      console.log('❌ showAlert function not found');
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Test Alerts</h1>
      
      <div className="space-x-2">
        <button 
          onClick={() => testAlert('success')}
          className="bg-green-500 text-white px-4 py-2 rounded">
          Success Alert
        </button>
        
        <button 
          onClick={() => testAlert('error')}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Error Alert
        </button>
        
        <button 
          onClick={() => testAlert('warning')}
          className="bg-yellow-500 text-white px-4 py-2 rounded"
        >
          Warning Alert
        </button>
        
        <button 
          onClick={() => testAlert('info')}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Info Alert
        </button>
      </div>

      <div className="mt-4 p-4 bg-gray-100 rounded">
        <h3 className="font-bold">Debug Info:</h3>
        <p>Check browser console for logs</p>
        <button 
          onClick={() => console.log('Window.showAlert:', (window as any).showAlert)}
          className="mt-2 bg-gray-500 text-white px-3 py-1 rounded text-sm"
        >
          Check showAlert Function
        </button>
      </div>
    </div>
  );
}