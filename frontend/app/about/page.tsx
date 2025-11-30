'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  BoxPlotOutlined,
  ArrowLeftOutlined,
  RocketOutlined,
  TeamOutlined,
  GlobalOutlined,
  TrophyOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { Button } from 'antd';

export default function AboutPage() {
  const values = [
    { icon: <RocketOutlined className="text-3xl" />, title: 'Innovation', description: 'We constantly push boundaries to deliver cutting-edge solutions' },
    { icon: <TeamOutlined className="text-3xl" />, title: 'Collaboration', description: 'We work closely with our customers to understand their needs' },
    { icon: <TrophyOutlined className="text-3xl" />, title: 'Excellence', description: 'We strive for excellence in everything we do' },
    { icon: <GlobalOutlined className="text-3xl" />, title: 'Global Reach', description: 'Serving warehouses worldwide with local expertise' },
  ];

  const milestones = [
    { year: '2020', title: 'Founded', description: 'Kiaan WMS was born from a vision to modernize warehouse management' },
    { year: '2021', title: 'First 100 Customers', description: 'Reached our first major milestone with customers across 15 countries' },
    { year: '2022', title: 'Series A Funding', description: 'Secured funding to accelerate product development and expansion' },
    { year: '2023', title: '500+ Warehouses', description: 'Now powering over 500 warehouses globally' },
    { year: '2024', title: 'Enterprise Launch', description: 'Launched enterprise features for large-scale operations' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600">
              <BoxPlotOutlined className="text-2xl text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Kiaan WMS
            </span>
          </Link>
          <Link href="/">
            <Button icon={<ArrowLeftOutlined />}>Back to Home</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              About Kiaan WMS
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're on a mission to revolutionize warehouse management with intelligent,
              role-based solutions that empower teams at every level.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-6 text-gray-800">Our Story</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Founded by logistics industry veterans and technology innovators, Kiaan WMS
              was created to address the real challenges faced by modern warehouses.
              We understood that one-size-fits-all solutions don't work - different roles
              have different needs. That's why we built a platform that adapts to each
              user, from pickers on the floor to executives in the boardroom.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Our Values</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-lg text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white mx-auto mb-4">
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-800">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Our Journey</h2>
          <div className="space-y-8">
            {milestones.map((milestone, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-6 items-start"
              >
                <div className="w-20 flex-shrink-0">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold text-center">
                    {milestone.year}
                  </div>
                </div>
                <div className="flex-1 bg-gray-50 rounded-xl p-4">
                  <h3 className="font-bold text-gray-800 mb-1">{milestone.title}</h3>
                  <p className="text-gray-600">{milestone.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white"
          >
            <h2 className="text-3xl font-bold mb-6 text-center">What Sets Us Apart</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                'Role-based dashboards for every team member',
                'Real-time inventory tracking across warehouses',
                'Advanced wave picking and packing workflows',
                'Seamless e-commerce integrations',
                'Comprehensive analytics and reporting',
                'Enterprise-grade security and compliance',
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircleOutlined className="text-green-300" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 text-gray-800">Ready to Transform Your Warehouse?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Join hundreds of warehouses already using Kiaan WMS
          </p>
          <Link href="/auth/login">
            <Button size="large" type="primary" className="h-14 px-8 text-lg bg-gradient-to-r from-blue-600 to-purple-600 border-none">
              Get Started Today
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-6">
        <div className="max-w-7xl mx-auto text-center text-gray-400">
          <p>&copy; 2024 Kiaan WMS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
