'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { BoxPlotOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Button } from 'antd';

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-gray-600 mb-8">Last updated: November 2024</p>

          <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Introduction</h2>
              <p className="text-gray-600 leading-relaxed">
                At Kiaan WMS, we take your privacy seriously. This Privacy Policy explains how we collect,
                use, disclose, and safeguard your information when you use our warehouse management platform.
                Please read this policy carefully to understand our practices regarding your personal data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Information We Collect</h2>
              <p className="text-gray-600 leading-relaxed mb-4">We collect information that you provide directly to us, including:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li><strong>Account Information:</strong> Name, email address, company name, job title</li>
                <li><strong>Warehouse Data:</strong> Inventory records, order details, shipping information</li>
                <li><strong>Usage Data:</strong> How you interact with our platform, features used, session duration</li>
                <li><strong>Device Information:</strong> Browser type, IP address, device identifiers</li>
                <li><strong>Communication Data:</strong> Support requests, feedback, and correspondence</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">How We Use Your Information</h2>
              <p className="text-gray-600 leading-relaxed mb-4">We use the collected information to:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Provide, maintain, and improve our warehouse management services</li>
                <li>Process transactions and manage your account</li>
                <li>Send you technical notices, updates, and administrative messages</li>
                <li>Respond to your comments, questions, and customer service requests</li>
                <li>Analyze usage patterns to improve user experience and develop new features</li>
                <li>Protect against unauthorized access and ensure platform security</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Data Sharing and Disclosure</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We do not sell your personal information. We may share your information in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li><strong>Service Providers:</strong> Third parties who help us operate our platform (hosting, analytics)</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
                <li><strong>With Your Consent:</strong> When you explicitly authorize us to share data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Data Security</h2>
              <p className="text-gray-600 leading-relaxed">
                We implement industry-standard security measures to protect your data, including:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mt-4">
                <li>AES-256 encryption for data at rest and in transit</li>
                <li>Regular security audits and penetration testing</li>
                <li>Multi-factor authentication options</li>
                <li>Strict access controls and employee training</li>
                <li>SOC 2 Type II compliance</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Data Retention</h2>
              <p className="text-gray-600 leading-relaxed">
                We retain your personal information for as long as necessary to fulfill the purposes
                outlined in this policy, unless a longer retention period is required by law. When you
                close your account, we will delete or anonymize your data within 90 days, except where
                we are legally required to retain it.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Rights</h2>
              <p className="text-gray-600 leading-relaxed mb-4">Depending on your location, you may have the right to:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Access the personal information we hold about you</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your personal data</li>
                <li>Object to or restrict certain processing activities</li>
                <li>Export your data in a portable format</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">International Data Transfers</h2>
              <p className="text-gray-600 leading-relaxed">
                Your information may be transferred to and processed in countries other than your own.
                We ensure appropriate safeguards are in place, including Standard Contractual Clauses
                approved by relevant authorities, to protect your data during such transfers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Cookies and Tracking</h2>
              <p className="text-gray-600 leading-relaxed">
                We use cookies and similar technologies to enhance your experience, analyze usage,
                and deliver personalized content. You can control cookie preferences through your
                browser settings. Essential cookies are required for the platform to function properly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Changes to This Policy</h2>
              <p className="text-gray-600 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any material
                changes by posting the new policy on this page and updating the "Last updated" date.
                We encourage you to review this policy periodically.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Contact Us</h2>
              <p className="text-gray-600 leading-relaxed">
                If you have any questions about this Privacy Policy or our data practices, please contact us at:{' '}
                <a href="mailto:privacy@kiaanwms.com" className="text-blue-600 hover:underline">
                  privacy@kiaanwms.com
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
