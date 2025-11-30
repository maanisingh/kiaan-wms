'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { BoxPlotOutlined, ArrowLeftOutlined, TeamOutlined, RocketOutlined, HeartOutlined, GlobalOutlined } from '@ant-design/icons';
import { Button, Card } from 'antd';

export default function CareersPage() {
  const benefits = [
    { icon: <RocketOutlined className="text-3xl" />, title: 'Growth Opportunities', description: 'Continuous learning and career development paths' },
    { icon: <HeartOutlined className="text-3xl" />, title: 'Health & Wellness', description: 'Comprehensive health insurance and wellness programs' },
    { icon: <GlobalOutlined className="text-3xl" />, title: 'Remote First', description: 'Work from anywhere with flexible schedules' },
    { icon: <TeamOutlined className="text-3xl" />, title: 'Great Team', description: 'Collaborate with talented professionals worldwide' },
  ];

  const openings = [
    { title: 'Senior Full-Stack Developer', department: 'Engineering', location: 'Remote', type: 'Full-time' },
    { title: 'Product Manager', department: 'Product', location: 'Remote', type: 'Full-time' },
    { title: 'UX/UI Designer', department: 'Design', location: 'Remote', type: 'Full-time' },
    { title: 'Customer Success Manager', department: 'Customer Success', location: 'Remote', type: 'Full-time' },
    { title: 'DevOps Engineer', department: 'Engineering', location: 'Remote', type: 'Full-time' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
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
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Join Our Team
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Help us revolutionize warehouse management. We're looking for passionate
              individuals who want to make a difference.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Why Work With Us</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white mx-auto mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-800">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Open Positions</h2>
          <div className="space-y-4">
            {openings.map((job, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  hoverable
                  className="shadow-lg"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{job.title}</h3>
                      <div className="flex gap-4 text-gray-600 mt-2">
                        <span>{job.department}</span>
                        <span>•</span>
                        <span>{job.location}</span>
                        <span>•</span>
                        <span>{job.type}</span>
                      </div>
                    </div>
                    <Button type="primary" size="large" className="bg-gradient-to-r from-purple-500 to-pink-500 border-none">
                      Apply Now
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Don't See a Perfect Fit?</h2>
          <p className="text-xl mb-8 text-purple-100">
            We're always looking for talented people. Send us your resume and we'll keep you in mind for future opportunities.
          </p>
          <Button size="large" className="h-14 px-8 text-lg bg-white text-purple-600 hover:bg-purple-50 border-none">
            Send Your Resume
          </Button>
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
