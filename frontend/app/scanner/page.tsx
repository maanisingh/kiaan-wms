'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Redirect to protected barcode scanner
export default function ScannerRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/barcode');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to scanner...</p>
      </div>
    </div>
  );
}
