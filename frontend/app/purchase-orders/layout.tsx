'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function FeatureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <MainLayout>{children}</MainLayout>
    </ProtectedRoute>
  );
}

