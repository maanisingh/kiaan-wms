'use client';

import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Input, Button } from 'antd';
import {
  DashboardOutlined,
  ShopOutlined,
  InboxOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  SettingOutlined,
  UserOutlined,
  BellOutlined,
  SearchOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  HomeOutlined,
  AppstoreOutlined,
  BoxPlotOutlined,
  DatabaseOutlined,
  SwapOutlined,
  ApiOutlined,
  BarChartOutlined,
  TeamOutlined,
  CarOutlined,
  UndoOutlined,
  PrinterOutlined,
  ContactsOutlined,
  UsergroupAddOutlined,
} from '@ant-design/icons';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';
import { hasRoutePermission } from '@/lib/permissions';

const { Header, Sider, Content, Footer } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar, theme, toggleTheme } = useUIStore();
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  // Helper function to check if user can access a menu item
  const canAccessMenuItem = (route: string) => {
    if (!user?.role) return false;
    return hasRoutePermission(user.role, route);
  };

  // Filter children based on permissions
  const filterMenuChildren = (children: any[]) => {
    return children.filter(child => {
      // If child has a key that looks like a route, check permission
      if (typeof child.key === 'string' && child.key.startsWith('/')) {
        return canAccessMenuItem(child.key);
      }
      return true;
    });
  };

  const allMenuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: <Link href="/dashboard">Dashboard</Link>,
    },
    {
      key: '/companies',
      icon: <ShopOutlined />,
      label: 'Companies',
      children: [
        { key: '/companies', label: <Link href="/companies">All Companies</Link> },
      ],
    },
    {
      key: '/warehouses',
      icon: <HomeOutlined />,
      label: 'Warehouses',
      children: [
        { key: '/warehouses', label: <Link href="/warehouses">All Warehouses</Link> },
        { key: '/warehouses/zones', label: <Link href="/warehouses/zones">Zones</Link> },
        { key: '/warehouses/locations', label: <Link href="/warehouses/locations">Locations</Link> },
      ],
    },
    {
      key: '/products',
      icon: <AppstoreOutlined />,
      label: 'Products',
      children: [
        { key: '/products', label: <Link href="/products">All Products</Link> },
        { key: '/products/categories', label: <Link href="/products/categories">Categories</Link> },
        { key: '/products/bundles', label: <Link href="/products/bundles">Bundles</Link> },
        { key: '/products/import', label: <Link href="/products/import">Import/Export</Link> },
      ],
    },
    {
      key: '/inventory',
      icon: <DatabaseOutlined />,
      label: 'Inventory',
      children: [
        { key: '/inventory', label: <Link href="/inventory">Overview</Link> },
        { key: '/inventory/by-best-before-date', label: <Link href="/inventory/by-best-before-date">By Best Before Date</Link> },
        { key: '/inventory/by-location', label: <Link href="/inventory/by-location">By Location</Link> },
        { key: '/inventory/adjustments', label: <Link href="/inventory/adjustments">Adjustments</Link> },
        { key: '/inventory/cycle-counts', label: <Link href="/inventory/cycle-counts">Cycle Counts</Link> },
        { key: '/inventory/batches', label: <Link href="/inventory/batches">Batches</Link> },
        { key: '/inventory/movements', label: <Link href="/inventory/movements">Movements</Link> },
      ],
    },
    {
      key: 'inbound',
      icon: <InboxOutlined />,
      label: 'Inbound',
      children: [
        { key: '/purchase-orders', label: <Link href="/purchase-orders">Purchase Orders</Link> },
        { key: '/goods-receiving', label: <Link href="/goods-receiving">Goods Receiving</Link> },
      ],
    },
    {
      key: '/suppliers',
      icon: <ContactsOutlined />,
      label: <Link href="/suppliers">Suppliers</Link>,
    },
    {
      key: 'outbound',
      icon: <ShoppingCartOutlined />,
      label: 'Outbound',
      children: [
        { key: '/sales-orders', label: <Link href="/sales-orders">Sales Orders</Link> },
        { key: '/customers', label: <Link href="/customers">Customers</Link> },
      ],
    },
    {
      key: '/clients',
      icon: <UsergroupAddOutlined />,
      label: <Link href="/clients">Clients</Link>,
    },
    {
      key: 'fulfillment',
      icon: <BoxPlotOutlined />,
      label: 'Fulfillment',
      children: [
        { key: '/picking', label: <Link href="/picking">Picking</Link> },
        { key: '/packing', label: <Link href="/packing">Packing</Link> },
      ],
    },
    {
      key: '/shipments',
      icon: <CarOutlined />,
      label: <Link href="/shipments">Shipments</Link>,
    },
    {
      key: '/returns',
      icon: <UndoOutlined />,
      label: <Link href="/returns">Returns</Link>,
    },
    // Transfers hidden - handled by Inventory Movements and Replenishment
    // {
    //   key: '/transfers',
    //   icon: <SwapOutlined />,
    //   label: 'Transfers',
    //   children: [
    //     { key: '/transfers', label: <Link href="/transfers">Stock Transfers</Link> },
    //     { key: '/fba-transfers', label: <Link href="/fba-transfers">FBA Transfers</Link> },
    //   ],
    // },
    {
      key: '/replenishment',
      icon: <InboxOutlined />,
      label: 'Replenishment',
      children: [
        { key: '/replenishment/tasks', label: <Link href="/replenishment/tasks">Tasks</Link> },
        { key: '/replenishment/settings', label: <Link href="/replenishment/settings">Settings</Link> },
      ],
    },
    {
      key: '/integrations',
      icon: <ApiOutlined />,
      label: 'Integrations',
      children: [
        { key: '/settings/marketplace-api', label: <Link href="/settings/marketplace-api">API Connections</Link> },
        { key: '/integrations/channels', label: <Link href="/integrations/channels">Sales Channels</Link> },
        { key: '/integrations/mappings', label: <Link href="/integrations/mappings">SKU Mappings</Link> },
      ],
    },
    {
      key: '/analytics',
      icon: <BarChartOutlined />,
      label: 'Analytics & Revenue',
      children: [
        { key: '/analytics/pricing-calculator', label: <Link href="/analytics/pricing-calculator">Pricing Calculator</Link> },
        { key: '/analytics/channels', label: <Link href="/analytics/channels">Channel Pricing</Link> },
        { key: '/analytics/optimizer', label: <Link href="/analytics/optimizer">Price Optimizer</Link> },
        { key: '/analytics/margins', label: <Link href="/analytics/margins">Margin Analysis</Link> },
      ],
    },
    {
      key: '/labels',
      icon: <PrinterOutlined />,
      label: <Link href="/labels">Label Printing</Link>,
    },
    {
      key: '/reports',
      icon: <BarChartOutlined />,
      label: <Link href="/reports">Reports</Link>,
    },
    {
      key: '/users',
      icon: <TeamOutlined />,
      label: <Link href="/users">Users & Access</Link>,
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: <Link href="/settings">Settings</Link>,
    },
  ];

  // Filter menu items based on user permissions
  const menuItems = allMenuItems.map(item => {
    // If item has children, filter them
    if (item.children) {
      const filteredChildren = filterMenuChildren(item.children);
      // Only show parent if it has accessible children
      return filteredChildren.length > 0 ? { ...item, children: filteredChildren } : null;
    }

    // Check if user has permission for this route
    if (typeof item.key === 'string' && item.key.startsWith('/')) {
      return canAccessMenuItem(item.key) ? item : null;
    }

    return item;
  }).filter(Boolean); // Remove null items

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => router.push('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => router.push('/settings'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
      onClick: () => {
        logout();
        router.push('/auth/login');
      },
    },
  ];

  return (
    <Layout className="min-h-screen">
      <Sider
        trigger={null}
        collapsible
        collapsed={sidebarCollapsed}
        className="shadow-lg ant-layout-sider-fixed"
        width={250}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}
      >
        <div className="h-16 flex items-center justify-center border-b border-gray-700">
          <Link href="/dashboard" className="flex items-center gap-2">
            <BoxPlotOutlined className="text-2xl text-blue-500" />
            {!sidebarCollapsed && (
              <span className="text-white font-bold text-lg">{APP_NAME}</span>
            )}
          </Link>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          openKeys={openKeys}
          onOpenChange={setOpenKeys}
          items={menuItems}
          className="border-none"
        />
      </Sider>

      <Layout style={{ marginLeft: sidebarCollapsed ? 80 : 250, transition: 'margin-left 0.2s' }}>
        <Header
          className="bg-white shadow-sm px-4 flex items-center justify-between h-16"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 99,
            width: '100%',
          }}
        >
          <div className="flex items-center gap-4">
            <Button
              type="text"
              icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={toggleSidebar}
              className="text-lg"
            />

            <Input
              placeholder="Search orders, products, customers..."
              prefix={<SearchOutlined />}
              className="w-96"
              size="large"
            />
          </div>

          <div className="flex items-center gap-4">
            <Badge count={5} offset={[-5, 5]}>
              <Button
                type="text"
                icon={<BellOutlined className="text-lg" />}
                size="large"
              />
            </Badge>

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-3 py-1 rounded"
                data-testid="user-menu-dropdown"
              >
                <Avatar icon={<UserOutlined />} src={user?.avatar} />
                <div className="hidden md:block">
                  <div className="text-sm font-medium">{user?.name || 'User'}</div>
                  <div className="text-xs text-gray-500">{user?.role || 'Role'}</div>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content className="m-6 p-6 bg-gray-50 rounded-lg min-h-[calc(100vh-180px)] overflow-x-auto">
          {children}
        </Content>

        <Footer className="bg-white text-center border-t border-gray-200">
          <div className="container mx-auto px-4 py-4">
            <div className="text-gray-600">
              © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
            </div>
            <div className="text-sm text-gray-500 mt-1">
              <Link href="/demo" className="hover:text-blue-600 mx-2">Demo</Link> |
              <Link href="/about" className="hover:text-blue-600 mx-2">About</Link> |
              <Link href="/contact" className="hover:text-blue-600 mx-2">Contact</Link> |
              <Link href="/privacy" className="hover:text-blue-600 mx-2">Privacy</Link>
            </div>
          </div>
        </Footer>
      </Layout>
    </Layout>
  );
};
