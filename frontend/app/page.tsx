'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from 'antd';
import {
  RocketOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  DashboardOutlined,
  BoxPlotOutlined,
  InboxOutlined,
  ShoppingCartOutlined,
  DatabaseOutlined,
  BarChartOutlined,
  ApiOutlined,
  ArrowRightOutlined,
  StarFilled,
  TrophyOutlined,
  WarningOutlined,
  CloudOutlined,
  LockOutlined,
  GlobalOutlined,
  SyncOutlined,
  LineChartOutlined,
  AmazonOutlined,
  MailOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CarOutlined,
  TagsOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import CountUp from 'react-countup';

export default function MarketingPage() {
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const floatingAnimation = {
    initial: { y: 0 },
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const glowAnimation = {
    boxShadow: [
      "0 0 20px rgba(59, 130, 246, 0.5)",
      "0 0 60px rgba(59, 130, 246, 0.8)",
      "0 0 20px rgba(59, 130, 246, 0.5)"
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut" as const
    }
  };

  const roles = [
    {
      name: 'Administrator',
      icon: <TrophyOutlined />,
      color: 'from-blue-500 to-blue-700',
      description: 'Complete system oversight with full access to all features',
      features: ['Multi-warehouse management', 'User & team control', 'Advanced reporting', 'System integrations']
    },
    {
      name: 'Warehouse Manager',
      icon: <TeamOutlined />,
      color: 'from-green-500 to-green-700',
      description: 'Optimize warehouse operations and team performance',
      features: ['Team performance tracking', 'Order queue management', 'Inventory oversight', 'Operational reports']
    },
    {
      name: 'Warehouse Staff',
      icon: <BoxPlotOutlined />,
      color: 'from-purple-500 to-purple-700',
      description: 'Efficient daily operations and stock management',
      features: ['Daily task management', 'Stock movements', 'Order processing', 'Inventory adjustments']
    },
    {
      name: 'Picker',
      icon: <InboxOutlined />,
      color: 'from-orange-500 to-orange-700',
      description: 'Streamlined picking with real-time wave assignments',
      features: ['Active pick lists', 'Wave picking', 'Performance metrics', 'Location optimization']
    },
    {
      name: 'Packer',
      icon: <ShoppingCartOutlined />,
      color: 'from-cyan-500 to-cyan-700',
      description: 'Fast packing operations with shipment tracking',
      features: ['Pack queue', 'Shipment prep', 'Station management', 'Real-time tracking']
    },
  ];

  const features = [
    {
      icon: <SafetyOutlined className="text-4xl" />,
      title: 'Role-Based Access Control',
      description: 'Granular permissions ensure users only see what they need, enhancing security and focus.'
    },
    {
      icon: <ThunderboltOutlined className="text-4xl" />,
      title: 'Lightning Fast Performance',
      description: 'Built with Next.js 16 and optimized for speed, delivering sub-second page loads.'
    },
    {
      icon: <DashboardOutlined className="text-4xl" />,
      title: 'Real-Time Dashboards',
      description: 'Live KPIs and metrics tailored to each role for instant operational insights.'
    },
    {
      icon: <DatabaseOutlined className="text-4xl" />,
      title: 'Smart Inventory Management',
      description: 'Track stock levels, batches, serial numbers, and expiry dates effortlessly.'
    },
    {
      icon: <BarChartOutlined className="text-4xl" />,
      title: 'Advanced Analytics',
      description: 'Comprehensive reports and charts to make data-driven warehouse decisions.'
    },
    {
      icon: <ApiOutlined className="text-4xl" />,
      title: 'Seamless Integrations',
      description: 'Connect with Amazon, Shopify, eBay and more through our powerful API.'
    },
  ];

  const stats = [
    { label: 'Orders Processed Daily', value: 50000, suffix: '+' },
    { label: 'Active Warehouses', value: 500, suffix: '+' },
    { label: 'Pick Accuracy', value: 99.8, suffix: '%' },
    { label: 'Customer Satisfaction', value: 98, suffix: '%' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:64px_64px]"></div>

      {/* Gradient Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      {/* Content */}
      <div className="relative z-10">
        {/* Navigation */}
        <motion.nav
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="fixed top-0 w-full bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50 shadow-2xl z-50"
        >
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={glowAnimation}
                className="p-2 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600"
              >
                <BoxPlotOutlined className="text-2xl text-white" />
              </motion.div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                Kiaan WMS
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-300 hover:text-cyan-400 transition-all duration-300 hover:scale-110">Features</a>
              <a href="#roles" className="text-gray-300 hover:text-cyan-400 transition-all duration-300 hover:scale-110">Roles</a>
              <a href="#stats" className="text-gray-300 hover:text-cyan-400 transition-all duration-300 hover:scale-110">Stats</a>
              <Link href="/auth/login">
                <Button
                  size="large"
                  icon={<RocketOutlined />}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 border-none text-white shadow-lg shadow-blue-500/50 h-12 px-8"
                >
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </motion.nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600/10 to-cyan-600/10 border border-cyan-500/30 rounded-full mb-8 backdrop-blur-sm"
            >
              <StarFilled className="text-cyan-400 animate-pulse" />
              <span className="text-cyan-300 font-semibold tracking-wide">NEXT-GEN WAREHOUSE MANAGEMENT</span>
            </motion.div>

            <h1 className="text-6xl md:text-8xl font-black mb-8 leading-tight">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent drop-shadow-2xl">
                Warehouse Operations
              </span>
              <br />
              <motion.span
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{ duration: 5, repeat: Infinity }}
                className="bg-gradient-to-r from-white via-cyan-200 to-blue-300 bg-[length:200%_auto] bg-clip-text text-transparent"
              >
                Reimagined
              </motion.span>
            </h1>

            <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              The most <span className="text-cyan-400 font-semibold">advanced role-based</span> warehouse management system.
              Built for <span className="text-blue-400">speed</span>, designed for <span className="text-purple-400">scale</span>,
              and optimized for every team member from pickers to executives.
            </p>

            <div className="flex gap-6 justify-center flex-wrap mb-8">
              <Link href="/auth/login">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    size="large"
                    icon={<RocketOutlined />}
                    className="h-16 px-10 text-lg font-bold bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:from-cyan-600 hover:via-blue-600 hover:to-purple-700 border-none text-white shadow-2xl shadow-cyan-500/50 rounded-xl"
                  >
                    Start Free Trial
                  </Button>
                </motion.div>
              </Link>
            </div>

            <div className="flex items-center justify-center gap-6 text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircleOutlined className="text-green-400" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleOutlined className="text-green-400" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleOutlined className="text-green-400" />
                <span>Cancel anytime</span>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="mt-16"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-white">
                {/* Browser Bar */}
                <div className="bg-gray-100 border-b border-gray-300 px-4 py-3 flex items-center justify-between">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="flex-1 mx-8">
                    <div className="bg-white rounded-md px-4 py-1 text-sm text-gray-600 border border-gray-300">
                      wms.alexandratechlab.com/dashboard
                    </div>
                  </div>
                  <div className="w-20"></div>
                </div>

                {/* Dashboard Content */}
                <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-6">
                  {/* Header */}
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
                      Administrator Dashboard
                    </h2>
                    <p className="text-sm text-gray-600">Complete system overview and management</p>
                  </div>

                  {/* KPI Cards */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <DatabaseOutlined className="text-blue-600 text-xl" />
                        <div className="text-green-600 text-xs font-semibold">↑ 12.5%</div>
                      </div>
                      <div className="text-sm text-gray-600">Total Stock</div>
                      <div className="text-2xl font-bold text-gray-800">45,234</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <ShoppingCartOutlined className="text-green-600 text-xl" />
                        <div className="text-green-600 text-xs font-semibold">↑ 8.3%</div>
                      </div>
                      <div className="text-sm text-gray-600">Orders Today</div>
                      <div className="text-2xl font-bold text-gray-800">156</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <InboxOutlined className="text-orange-600 text-xl" />
                        <div className="text-red-600 text-xs font-semibold">↑ 5.1%</div>
                      </div>
                      <div className="text-sm text-gray-600">Pick Backlog</div>
                      <div className="text-2xl font-bold text-gray-800">45</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <WarningOutlined className="text-red-600 text-xl" />
                        <div className="text-gray-600 text-xs font-semibold">→ 0%</div>
                      </div>
                      <div className="text-sm text-gray-600">Expiry Alerts</div>
                      <div className="text-2xl font-bold text-gray-800">12</div>
                    </div>
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                      <div className="text-sm font-semibold text-gray-800 mb-3">Daily Orders (Last 7 Days)</div>
                      <div className="flex items-end justify-between h-32 gap-2">
                        <div className="flex-1 bg-blue-500 rounded-t" style={{ height: '60%' }}></div>
                        <div className="flex-1 bg-blue-500 rounded-t" style={{ height: '75%' }}></div>
                        <div className="flex-1 bg-blue-500 rounded-t" style={{ height: '85%' }}></div>
                        <div className="flex-1 bg-blue-500 rounded-t" style={{ height: '70%' }}></div>
                        <div className="flex-1 bg-blue-500 rounded-t" style={{ height: '90%' }}></div>
                        <div className="flex-1 bg-blue-500 rounded-t" style={{ height: '80%' }}></div>
                        <div className="flex-1 bg-blue-600 rounded-t" style={{ height: '100%' }}></div>
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-gray-500">
                        <span>Mon</span>
                        <span>Tue</span>
                        <span>Wed</span>
                        <span>Thu</span>
                        <span>Fri</span>
                        <span>Sat</span>
                        <span>Sun</span>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                      <div className="text-sm font-semibold text-gray-800 mb-3">Warehouse Utilization</div>
                      <div className="flex items-center justify-center h-32">
                        <div className="relative w-32 h-32">
                          <svg viewBox="0 0 36 36" className="w-full h-full">
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="#E5E7EB"
                              strokeWidth="3"
                            />
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="#3B82F6"
                              strokeWidth="3"
                              strokeDasharray="75, 100"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center flex-col">
                            <div className="text-2xl font-bold text-blue-600">75%</div>
                            <div className="text-xs text-gray-600">Used</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center text-white"
              >
                <div className="text-5xl font-bold mb-2">
                  <CountUp end={stat.value} duration={2.5} decimals={stat.suffix === '%' ? 1 : 0} />
                  {stat.suffix}
                </div>
                <div className="text-blue-100 text-lg">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to run a modern warehouse operation
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -10, transition: { duration: 0.2 } }}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-shadow"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-800">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Roles Section */}
      <section id="roles" className="py-20 px-6 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Tailored for Every Role
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Each user gets a personalized experience with role-specific dashboards and permissions
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {roles.map((role, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="bg-white rounded-2xl overflow-hidden shadow-xl"
              >
                <div className={`bg-gradient-to-r ${role.color} p-6 text-white`}>
                  <div className="text-4xl mb-3">{role.icon}</div>
                  <h3 className="text-2xl font-bold">{role.name}</h3>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 mb-4">{role.description}</p>
                  <ul className="space-y-2">
                    {role.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-gray-700">
                        <CheckCircleOutlined className="text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* More Dashboard Screenshots Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Powerful Dashboards for Every Role
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how different roles experience tailored, intuitive interfaces designed for maximum productivity
            </p>
          </motion.div>

          <div className="space-y-12">
            {/* Warehouse Manager Dashboard Preview */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 shadow-xl"
            >
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="inline-block bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
                    Warehouse Manager View
                  </div>
                  <h3 className="text-3xl font-bold mb-4 text-gray-800">Operational Excellence</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Track team performance, monitor inventory levels, and optimize warehouse operations with real-time analytics and actionable insights.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircleOutlined className="text-green-600 mt-1" />
                      <span className="text-gray-700">Team performance tracking with KPIs</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircleOutlined className="text-green-600 mt-1" />
                      <span className="text-gray-700">Order queue management & prioritization</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircleOutlined className="text-green-600 mt-1" />
                      <span className="text-gray-700">Inventory oversight & stock alerts</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-2xl">
                  <div className="bg-gray-100 rounded-t-lg px-4 py-2 flex items-center gap-2 mb-4">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="ml-4 text-xs text-gray-600">Manager Dashboard</div>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200">
                        <TeamOutlined className="text-green-600 text-lg mb-1" />
                        <div className="text-xs text-gray-600">Team Efficiency</div>
                        <div className="text-xl font-bold text-gray-800">94.5%</div>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-3 rounded-lg border border-blue-200">
                        <LineChartOutlined className="text-blue-600 text-lg mb-1" />
                        <div className="text-xs text-gray-600">Daily Orders</div>
                        <div className="text-xl font-bold text-gray-800">387</div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs font-semibold text-gray-700 mb-2">Active Picks by Zone</div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{width: '75%'}}></div>
                          </div>
                          <span className="text-xs text-gray-600">Zone A</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{width: '60%'}}></div>
                          </div>
                          <span className="text-xs text-gray-600">Zone B</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div className="bg-orange-500 h-2 rounded-full" style={{width: '45%'}}></div>
                          </div>
                          <span className="text-xs text-gray-600">Zone C</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Picker Dashboard Preview */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl p-8 shadow-xl"
            >
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="order-2 md:order-1 bg-white rounded-xl p-4 shadow-2xl">
                  <div className="bg-gray-100 rounded-t-lg px-4 py-2 flex items-center gap-2 mb-4">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="ml-4 text-xs text-gray-600">Picker Dashboard</div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-4 rounded-lg">
                      <div className="text-sm font-semibold mb-2">Current Wave</div>
                      <div className="text-3xl font-bold">Wave-207</div>
                      <div className="text-xs mt-2 opacity-90">12 items remaining</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-gray-50 p-2 rounded text-center border border-gray-200">
                        <div className="text-xs text-gray-600">Assigned</div>
                        <div className="text-lg font-bold text-orange-600">18</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded text-center border border-gray-200">
                        <div className="text-xs text-gray-600">Picked</div>
                        <div className="text-lg font-bold text-green-600">42</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded text-center border border-gray-200">
                        <div className="text-xs text-gray-600">Rate/Hr</div>
                        <div className="text-lg font-bold text-blue-600">48</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="order-1 md:order-2">
                  <div className="inline-block bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
                    Picker View
                  </div>
                  <h3 className="text-3xl font-bold mb-4 text-gray-800">Pick with Precision</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Streamlined picking interface with wave-based assignments, location optimization, and real-time performance tracking.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircleOutlined className="text-orange-600 mt-1" />
                      <span className="text-gray-700">Wave-based picking assignments</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircleOutlined className="text-orange-600 mt-1" />
                      <span className="text-gray-700">Optimized picking routes</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircleOutlined className="text-orange-600 mt-1" />
                      <span className="text-gray-700">Real-time performance metrics</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Packer Dashboard Preview */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-3xl p-8 shadow-xl"
            >
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="inline-block bg-cyan-500 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
                    Packer View
                  </div>
                  <h3 className="text-3xl font-bold mb-4 text-gray-800">Pack & Ship Efficiently</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Manage packing queues, track shipment preparation, and ensure accurate order fulfillment with intelligent packing workflows.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircleOutlined className="text-cyan-600 mt-1" />
                      <span className="text-gray-700">Smart pack queue management</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircleOutlined className="text-cyan-600 mt-1" />
                      <span className="text-gray-700">Automated shipment preparation</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircleOutlined className="text-cyan-600 mt-1" />
                      <span className="text-gray-700">Real-time packing station status</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-2xl">
                  <div className="bg-gray-100 rounded-t-lg px-4 py-2 flex items-center gap-2 mb-4">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="ml-4 text-xs text-gray-600">Packer Dashboard</div>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-3 rounded-lg border border-cyan-200">
                        <ShoppingCartOutlined className="text-cyan-600 text-lg mb-1" />
                        <div className="text-xs text-gray-600">Ready to Pack</div>
                        <div className="text-xl font-bold text-gray-800">23</div>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200">
                        <CheckCircleOutlined className="text-green-600 text-lg mb-1" />
                        <div className="text-xs text-gray-600">Packed Today</div>
                        <div className="text-xl font-bold text-gray-800">67</div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-3 rounded-lg">
                      <div className="text-xs font-semibold mb-1">Station Status</div>
                      <div className="text-2xl font-bold">Station #3</div>
                      <div className="text-xs mt-1 opacity-90">Active • 5 orders in queue</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <div className="text-xs font-semibold text-gray-700 mb-2">Pack Rate</div>
                      <div className="flex items-center gap-2">
                        <div className="text-2xl font-bold text-cyan-600">38</div>
                        <div className="text-xs text-gray-600">orders/hour</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Seamless Integrations
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Connect with your favorite e-commerce platforms, shipping carriers, and business tools
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Amazon', icon: <AmazonOutlined />, color: 'from-orange-500 to-yellow-500', desc: 'FBA & FBM Integration' },
              { name: 'Shopify', icon: <ShoppingCartOutlined />, color: 'from-green-500 to-emerald-600', desc: 'Order Sync' },
              { name: 'eBay', icon: <TagsOutlined />, color: 'from-blue-500 to-cyan-500', desc: 'Marketplace Sync' },
              { name: 'WooCommerce', icon: <GlobalOutlined />, color: 'from-purple-500 to-indigo-500', desc: 'Real-time Updates' },
              { name: 'FedEx', icon: <CarOutlined />, color: 'from-purple-600 to-blue-600', desc: 'Shipping Labels' },
              { name: 'UPS', icon: <CarOutlined />, color: 'from-yellow-600 to-amber-700', desc: 'Tracking API' },
              { name: 'QuickBooks', icon: <BarChartOutlined />, color: 'from-green-600 to-teal-600', desc: 'Accounting Sync' },
              { name: 'Slack', icon: <MailOutlined />, color: 'from-pink-500 to-rose-600', desc: 'Notifications' },
            ].map((integration, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${integration.color} rounded-xl flex items-center justify-center text-white text-2xl mb-4`}>
                  {integration.icon}
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-800">{integration.name}</h3>
                <p className="text-sm text-gray-600">{integration.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <div className="inline-block bg-white rounded-2xl px-8 py-4 shadow-lg">
              <p className="text-gray-600 mb-2">Plus 50+ more integrations via</p>
              <div className="flex items-center gap-3 justify-center">
                <ApiOutlined className="text-3xl text-blue-600" />
                <span className="text-xl font-bold text-gray-800">REST API & Webhooks</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Trusted by Leading Warehouses
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See what our customers say about transforming their operations
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Sarah Johnson',
                role: 'Operations Director',
                company: 'LogiCorp Distribution',
                quote: 'Kiaan WMS transformed our warehouse efficiency by 40%. The role-based dashboards are a game-changer for our team.',
                rating: 5,
              },
              {
                name: 'Michael Chen',
                role: 'Warehouse Manager',
                company: 'FastShip Logistics',
                quote: 'Best WMS we\'ve ever used. The picking and packing workflows are incredibly intuitive. Our error rate dropped to near zero.',
                rating: 5,
              },
              {
                name: 'Emily Rodriguez',
                role: 'COO',
                company: 'MegaStore Fulfillment',
                quote: 'The analytics and reporting features give us insights we never had before. ROI in less than 3 months!',
                rating: 5,
              },
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-8 shadow-lg"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarFilled key={i} className="text-yellow-400 text-xl" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed italic">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-bold text-gray-800">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                    <div className="text-xs text-gray-500">{testimonial.company}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* Security & Compliance Section */}
      <section className="py-20 px-6 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold mb-4">Enterprise-Grade Security</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Your data is protected with industry-leading security measures
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: <LockOutlined />, title: 'AES-256 Encryption', desc: 'Bank-level encryption' },
              { icon: <CloudOutlined />, title: '99.9% Uptime', desc: 'Guaranteed availability' },
              { icon: <SafetyOutlined />, title: 'SOC 2 Certified', desc: 'Compliance ready' },
              { icon: <GlobalOutlined />, title: 'GDPR Compliant', desc: 'Data protection' },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-gray-400">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-12 text-center text-white shadow-2xl"
          >
            <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Warehouse?</h2>
            <p className="text-xl mb-8 text-blue-100">
              Join hundreds of warehouses already using Kiaan WMS
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/auth/login">
                <Button size="large" className="h-14 px-8 text-lg bg-white text-blue-600 hover:bg-blue-50">
                  Get Started <RocketOutlined />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BoxPlotOutlined className="text-2xl text-blue-400" />
                <span className="text-xl font-bold">Kiaan WMS</span>
              </div>
              <p className="text-gray-400">Next-generation warehouse management for modern operations.</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#roles" className="hover:text-white">Roles</a></li>
                <li><a href="/dashboard" className="hover:text-white">Demo</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link href="/careers" className="hover:text-white">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms</Link></li>
                <li><Link href="/security" className="hover:text-white">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Kiaan WMS. All rights reserved. Built with Next.js & Ant Design.</p>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
