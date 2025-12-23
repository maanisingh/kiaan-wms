'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import {
  DashboardOutlined,
  BoxPlotOutlined,
  InboxOutlined,
  ScanOutlined,
  CarOutlined,
  PrinterOutlined,
  AppstoreOutlined,
  DatabaseOutlined,
  ShoppingCartOutlined,
  BarChartOutlined,
  SettingOutlined,
  MoreOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { Drawer, Menu } from 'antd';
import Link from 'next/link';
import { isPicker, isPacker, isViewer } from '@/lib/permissions';

interface NavItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  path: string;
}

const MobileBottomNav: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false);

  const userRole = user?.role || '';

  // Picker navigation - minimal
  const pickerItems: NavItem[] = [
    { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard', path: '/dashboards/picker' },
    { key: 'picking', icon: <BoxPlotOutlined />, label: 'Pick Lists', path: '/picking' },
    { key: 'scanner', icon: <ScanOutlined />, label: 'Scanner', path: '/barcode' },
  ];

  // Packer navigation
  const packerItems: NavItem[] = [
    { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard', path: '/dashboards/packer' },
    { key: 'packing', icon: <InboxOutlined />, label: 'Packing', path: '/packing' },
    { key: 'shipments', icon: <CarOutlined />, label: 'Ship', path: '/shipments' },
    { key: 'scanner', icon: <ScanOutlined />, label: 'Scan', path: '/barcode' },
  ];

  // Viewer navigation
  const viewerItems: NavItem[] = [
    { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard', path: '/dashboard' },
    { key: 'reports', icon: <BarChartOutlined />, label: 'Reports', path: '/reports' },
    { key: 'analytics', icon: <BarChartOutlined />, label: 'Analytics', path: '/analytics/margins' },
  ];

  // Admin/Manager main items (show 4 + more)
  const adminMainItems: NavItem[] = [
    { key: 'dashboard', icon: <DashboardOutlined />, label: 'Home', path: '/dashboard' },
    { key: 'orders', icon: <ShoppingCartOutlined />, label: 'Orders', path: '/sales-orders' },
    { key: 'inventory', icon: <DatabaseOutlined />, label: 'Stock', path: '/inventory' },
    { key: 'products', icon: <AppstoreOutlined />, label: 'Products', path: '/products' },
  ];

  // Admin more items (shown in drawer)
  const adminMoreItems = [
    { key: 'picking', icon: <BoxPlotOutlined />, label: <Link href="/picking">Picking</Link> },
    { key: 'packing', icon: <InboxOutlined />, label: <Link href="/packing">Packing</Link> },
    { key: 'shipments', icon: <CarOutlined />, label: <Link href="/shipments">Shipments</Link> },
    { key: 'scanner', icon: <ScanOutlined />, label: <Link href="/barcode">Scanner</Link> },
    { key: 'labels', icon: <PrinterOutlined />, label: <Link href="/labels">Labels</Link> },
    { key: 'reports', icon: <BarChartOutlined />, label: <Link href="/reports">Reports</Link> },
    { key: 'analytics', icon: <BarChartOutlined />, label: <Link href="/analytics/margins">Analytics</Link> },
    { key: 'settings', icon: <SettingOutlined />, label: <Link href="/settings">Settings</Link> },
  ];

  // Get items based on role
  const getNavItems = (): NavItem[] => {
    if (isPicker(userRole)) return pickerItems;
    if (isPacker(userRole)) return packerItems;
    if (isViewer(userRole)) return viewerItems;
    return adminMainItems;
  };

  const showMoreButton = !isPicker(userRole) && !isPacker(userRole) && !isViewer(userRole);
  const navItems = getNavItems();

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => router.push(item.path)}
              className={`flex flex-col items-center justify-center flex-1 py-2 px-1 transition-colors ${
                isActive(item.path)
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="text-xl mb-1">{item.icon}</span>
              <span className="text-xs font-medium truncate">{item.label}</span>
            </button>
          ))}

          {showMoreButton && (
            <button
              onClick={() => setMoreDrawerOpen(true)}
              className="flex flex-col items-center justify-center flex-1 py-2 px-1 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <span className="text-xl mb-1"><MoreOutlined /></span>
              <span className="text-xs font-medium">More</span>
            </button>
          )}
        </div>
      </nav>

      {/* More Drawer */}
      <Drawer
        title="More Options"
        placement="bottom"
        onClose={() => setMoreDrawerOpen(false)}
        open={moreDrawerOpen}
        height="auto"
        styles={{
          body: { padding: 0 }
        }}
        closeIcon={<CloseOutlined />}
      >
        <Menu
          mode="vertical"
          items={adminMoreItems}
          onClick={() => setMoreDrawerOpen(false)}
          className="border-none"
        />
      </Drawer>

      {/* Add padding at bottom for content */}
      <style jsx global>{`
        @media (max-width: 768px) {
          .ant-layout-content {
            padding-bottom: 80px !important;
          }
          .safe-area-bottom {
            padding-bottom: env(safe-area-inset-bottom, 0);
          }
        }
      `}</style>
    </>
  );
};

export default MobileBottomNav;
