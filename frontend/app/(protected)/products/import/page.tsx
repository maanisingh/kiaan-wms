'use client';

import React from 'react';

import { Card, Button, Upload, message } from 'antd';
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons';

export default function ProductImportPage() {
  const handleUpload = () => {
    message.success('File uploaded successfully!');
  };

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Import Products</h1>
          <p className="text-gray-600 mt-1">Bulk import products from CSV or Excel</p>
        </div>

        <Card title="Upload File">
          <div className="space-y-4">
            <Button icon={<DownloadOutlined />} type="link">Download Template</Button>
            <Upload.Dragger name="file" onChange={handleUpload}>
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">Click or drag file to this area to upload</p>
              <p className="ant-upload-hint">Support for CSV, Excel files</p>
            </Upload.Dragger>
          </div>
        </Card>
      </div>
      );
}
