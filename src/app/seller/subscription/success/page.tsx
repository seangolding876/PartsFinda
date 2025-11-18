import { Suspense } from 'react';
import SuccessContent from './SuccessContent';


export const dynamic = 'force-dynamic';
export const revalidate = 0;


export default function SuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SuccessContent />
    </Suspense>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-lg text-gray-600">Loading...</p>
      </div>
    </div>
  );
}