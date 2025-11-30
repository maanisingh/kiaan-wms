'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { BoxPlotOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Button } from 'antd';

export default function TermsPage() {
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

      <div className="max-w-4xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Terms of Service
          </h1>
          <p className="text-gray-600 mb-8">Last updated: November 2024</p>

          <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-600 leading-relaxed">
                By accessing or using Kiaan WMS, you agree to be bound by these Terms of Service
                and all applicable laws and regulations. If you do not agree with any of these terms,
                you are prohibited from using or accessing this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">2. Use License</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Permission is granted to temporarily access and use Kiaan WMS for personal or
                commercial warehouse management purposes subject to the following conditions:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>You must not modify or copy the software for redistribution</li>
                <li>You must not use the service for any unlawful purpose</li>
                <li>You must not attempt to reverse engineer any software</li>
                <li>You must not remove any copyright or proprietary notations</li>
                <li>You must not transfer your account to another person</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">3. Service Availability</h2>
              <p className="text-gray-600 leading-relaxed">
                We strive to maintain 99.9% uptime for our services. However, we reserve the right
                to modify, suspend, or discontinue any aspect of the service at any time with
                reasonable notice. Scheduled maintenance windows will be communicated in advance.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">4. User Responsibilities</h2>
              <p className="text-gray-600 leading-relaxed mb-4">As a user of Kiaan WMS, you are responsible for:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Ensuring your data complies with applicable regulations</li>
                <li>Promptly reporting any unauthorized access or security breaches</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">5. Data Ownership</h2>
              <p className="text-gray-600 leading-relaxed">
                You retain full ownership of all data you upload to Kiaan WMS. We do not claim
                any intellectual property rights over your warehouse data, inventory records,
                or business information. You may export your data at any time.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">6. Limitation of Liability</h2>
              <p className="text-gray-600 leading-relaxed">
                Kiaan WMS and its suppliers shall not be liable for any indirect, incidental,
                special, consequential, or punitive damages, including without limitation,
                loss of profits, data, use, goodwill, or other intangible losses.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">7. Changes to Terms</h2>
              <p className="text-gray-600 leading-relaxed">
                We reserve the right to modify these terms at any time. We will notify users
                of any material changes via email or through the platform. Your continued use
                of the service after such modifications constitutes acceptance of the updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">8. Contact Information</h2>
              <p className="text-gray-600 leading-relaxed">
                If you have any questions about these Terms of Service, please contact us at{' '}
                <a href="mailto:legal@kiaanwms.com" className="text-blue-600 hover:underline">
                  legal@kiaanwms.com
                </a>
              </p>
            </section>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-6">
        <div className="max-w-7xl mx-auto text-center text-gray-400">
          <p>&copy; 2024 Kiaan WMS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
