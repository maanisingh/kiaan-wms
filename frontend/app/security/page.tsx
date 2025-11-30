'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  BoxPlotOutlined,
  ArrowLeftOutlined,
  LockOutlined,
  SafetyOutlined,
  CloudOutlined,
  GlobalOutlined,
  CheckCircleOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import { Button } from 'antd';

export default function SecurityPage() {
  const securityFeatures = [
    {
      icon: <LockOutlined className="text-4xl" />,
      title: 'AES-256 Encryption',
      description: 'All data is encrypted at rest and in transit using industry-standard AES-256 encryption.'
    },
    {
      icon: <SafetyOutlined className="text-4xl" />,
      title: 'SOC 2 Type II Certified',
      description: 'We maintain SOC 2 Type II certification, demonstrating our commitment to security controls.'
    },
    {
      icon: <CloudOutlined className="text-4xl" />,
      title: '99.9% Uptime SLA',
      description: 'Our infrastructure is designed for high availability with redundant systems and backups.'
    },
    {
      icon: <GlobalOutlined className="text-4xl" />,
      title: 'GDPR Compliant',
      description: 'Full compliance with GDPR and other international data protection regulations.'
    },
  ];

  const practices = [
    'Regular third-party security audits and penetration testing',
    'Multi-factor authentication (MFA) for all accounts',
    'Role-based access control (RBAC) with granular permissions',
    'Continuous monitoring and threat detection',
    'Automated security patches and updates',
    'Encrypted backups with point-in-time recovery',
    'DDoS protection and rate limiting',
    'Secure API with OAuth 2.0 authentication',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900">
      {/* Navigation */}
      <nav className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600">
              <BoxPlotOutlined className="text-2xl text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Kiaan WMS
            </span>
          </Link>
          <Link href="/">
            <Button icon={<ArrowLeftOutlined />} className="bg-slate-800 text-white border-slate-600 hover:bg-slate-700">
              Back to Home
            </Button>
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
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full mb-8">
              <SafetyCertificateOutlined className="text-5xl text-white" />
            </div>
            <h1 className="text-5xl font-bold mb-4 text-white">
              Enterprise-Grade Security
            </h1>
            <p className="text-xl text-blue-200 max-w-2xl mx-auto">
              Your data is our top priority. We employ multiple layers of security
              to protect your warehouse operations.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Security Features Grid */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {securityFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-slate-700 text-center"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center text-white mx-auto mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">{feature.title}</h3>
                <p className="text-blue-200">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Practices */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-center mb-12 text-white">Our Security Practices</h2>
            <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-8 border border-slate-700">
              <div className="grid md:grid-cols-2 gap-4">
                {practices.map((practice, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-3"
                  >
                    <CheckCircleOutlined className="text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-blue-100">{practice}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Infrastructure Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-8 text-white"
          >
            <h2 className="text-3xl font-bold mb-6">Cloud Infrastructure</h2>
            <p className="text-lg text-blue-100 mb-6">
              Kiaan WMS is hosted on enterprise-grade cloud infrastructure with:
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white/10 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold">99.9%</div>
                <div className="text-blue-200">Uptime Guarantee</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold">24/7</div>
                <div className="text-blue-200">Monitoring</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold">3+</div>
                <div className="text-blue-200">Data Centers</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 text-white">Security Questions?</h2>
          <p className="text-xl text-blue-200 mb-8">
            Our security team is available to answer your questions and provide additional documentation.
          </p>
          <Button size="large" className="h-14 px-8 text-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 border-none">
            Contact Security Team
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8 px-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto text-center text-gray-400">
          <p>&copy; 2024 Kiaan WMS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
