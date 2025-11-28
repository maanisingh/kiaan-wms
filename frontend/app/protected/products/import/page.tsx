'use client';

import React, { useState, useCallback } from 'react';
import {
  Card, Button, Upload, message, Table, Tag, Alert, Space, Progress,
  Modal, Statistic, Row, Col, Spin, Divider, Typography, Steps
} from 'antd';
import {
  UploadOutlined, DownloadOutlined, CheckCircleOutlined,
  CloseCircleOutlined, ExclamationCircleOutlined, FileExcelOutlined,
  InboxOutlined, DeleteOutlined, SaveOutlined
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import apiService from '@/services/api';

const { Dragger } = Upload;
const { Text, Title } = Typography;

interface ParsedProduct {
  key: string;
  sku: string;
  name: string;
  description?: string;
  barcode?: string;
  costPrice: number;
  sellingPrice: number;
  status: string;
  type: string;
  reorderPoint?: number;
  maxStockLevel?: number;
  brand?: string;
  valid: boolean;
  errors: string[];
}

export default function ProductImportPage() {
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  // Validate a single product row
  const validateProduct = (product: any, rowIndex: number): ParsedProduct => {
    const errors: string[] = [];

    // Required field checks
    if (!product['SKU'] && !product['sku']) {
      errors.push('SKU is required');
    }
    if (!product['Product Name'] && !product['name']) {
      errors.push('Product Name is required');
    }

    const costPrice = parseFloat(product['Cost Price'] || product['costPrice'] || 0);
    const sellingPrice = parseFloat(product['Selling Price'] || product['sellingPrice'] || 0);

    if (isNaN(costPrice) || costPrice < 0) {
      errors.push('Invalid Cost Price');
    }
    if (isNaN(sellingPrice) || sellingPrice < 0) {
      errors.push('Invalid Selling Price');
    }

    const status = (product['Status'] || product['status'] || 'ACTIVE').toUpperCase();
    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      errors.push('Status must be ACTIVE or INACTIVE');
    }

    const type = (product['Type'] || product['type'] || 'SIMPLE').toUpperCase();
    if (!['SIMPLE', 'BUNDLE'].includes(type)) {
      errors.push('Type must be SIMPLE or BUNDLE');
    }

    return {
      key: `row-${rowIndex}`,
      sku: product['SKU'] || product['sku'] || '',
      name: product['Product Name'] || product['name'] || '',
      description: product['Description'] || product['description'] || '',
      barcode: product['Barcode'] || product['barcode'] || '',
      costPrice,
      sellingPrice,
      status,
      type,
      reorderPoint: parseInt(product['Reorder Point'] || product['reorderPoint'] || 0) || undefined,
      maxStockLevel: parseInt(product['Max Stock Level'] || product['maxStockLevel'] || 0) || undefined,
      brand: product['Brand'] || product['brand'] || '',
      valid: errors.length === 0,
      errors,
    };
  };

  // Handle file upload and parsing
  const handleFileUpload = useCallback((file: File) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Parse to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          message.error('No data found in the Excel file');
          return;
        }

        // Validate each row
        const validatedProducts = jsonData.map((row, index) =>
          validateProduct(row, index)
        );

        setParsedProducts(validatedProducts);
        setFileName(file.name);
        setCurrentStep(1);

        const validCount = validatedProducts.filter(p => p.valid).length;
        const invalidCount = validatedProducts.length - validCount;

        if (invalidCount > 0) {
          message.warning(`${invalidCount} row(s) have validation errors`);
        } else {
          message.success(`Successfully parsed ${validCount} products`);
        }
      } catch (error) {
        console.error('Error parsing file:', error);
        message.error('Failed to parse Excel file. Please check the format.');
      }
    };

    reader.readAsArrayBuffer(file);
    return false; // Prevent auto upload
  }, []);

  // Import products to API
  const handleImport = async () => {
    const validProducts = parsedProducts.filter(p => p.valid);

    if (validProducts.length === 0) {
      message.error('No valid products to import');
      return;
    }

    setImporting(true);
    setCurrentStep(2);
    setImportProgress(0);

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (let i = 0; i < validProducts.length; i++) {
      const product = validProducts[i];

      try {
        await apiService.post('/products', {
          sku: product.sku,
          name: product.name,
          description: product.description || null,
          barcode: product.barcode || null,
          costPrice: product.costPrice,
          sellingPrice: product.sellingPrice,
          status: product.status,
          type: product.type,
          reorderPoint: product.reorderPoint || null,
          maxStockLevel: product.maxStockLevel || null,
        });
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`${product.sku}: ${error.message || 'Import failed'}`);
      }

      setImportProgress(Math.round(((i + 1) / validProducts.length) * 100));
    }

    setImporting(false);
    setImportResults(results);
    setCurrentStep(3);

    if (results.success > 0) {
      message.success(`Successfully imported ${results.success} products`);
    }
    if (results.failed > 0) {
      message.warning(`${results.failed} products failed to import`);
    }
  };

  // Reset and start over
  const handleReset = () => {
    setParsedProducts([]);
    setFileName(null);
    setCurrentStep(0);
    setImportProgress(0);
    setImportResults(null);
  };

  // Remove a product from the list
  const handleRemoveProduct = (key: string) => {
    setParsedProducts(prev => prev.filter(p => p.key !== key));
  };

  // Download template
  const handleDownloadTemplate = () => {
    window.open('/templates/product-import-template.xlsx', '_blank');
  };

  // Export current data back to Excel
  const handleExportPreview = () => {
    const exportData = parsedProducts.map(p => ({
      'SKU': p.sku,
      'Product Name': p.name,
      'Description': p.description,
      'Barcode': p.barcode,
      'Cost Price': p.costPrice,
      'Selling Price': p.sellingPrice,
      'Status': p.status,
      'Type': p.type,
      'Reorder Point': p.reorderPoint,
      'Max Stock Level': p.maxStockLevel,
      'Category': p.brand,
      'Valid': p.valid ? 'Yes' : 'No',
      'Errors': p.errors.join('; '),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products Preview');
    XLSX.writeFile(workbook, 'products-import-preview.xlsx');
    message.success('Preview exported successfully');
  };

  const columns = [
    {
      title: 'Status',
      key: 'valid',
      width: 80,
      fixed: 'left' as const,
      render: (_: any, record: ParsedProduct) => (
        record.valid ? (
          <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />
        ) : (
          <CloseCircleOutlined style={{ color: '#f5222d', fontSize: 18 }} />
        )
      ),
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      width: 120,
      render: (text: string) => <span className="font-mono font-medium">{text || '-'}</span>,
    },
    {
      title: 'Product Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Cost Price',
      dataIndex: 'costPrice',
      key: 'costPrice',
      width: 100,
      align: 'right' as const,
      render: (price: number) => `£${price.toFixed(2)}`,
    },
    {
      title: 'Selling Price',
      dataIndex: 'sellingPrice',
      key: 'sellingPrice',
      width: 110,
      align: 'right' as const,
      render: (price: number) => `£${price.toFixed(2)}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'ACTIVE' ? 'green' : 'red'}>{status}</Tag>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 90,
      render: (type: string) => (
        <Tag color={type === 'BUNDLE' ? 'purple' : 'blue'}>{type}</Tag>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'brand',
      key: 'brand',
      width: 100,
      render: (brand: string) => brand || <span className="text-gray-400">-</span>,
    },
    {
      title: 'Errors',
      dataIndex: 'errors',
      key: 'errors',
      width: 200,
      render: (errors: string[]) => (
        errors.length > 0 ? (
          <span className="text-red-500 text-xs">{errors.join(', ')}</span>
        ) : null
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 80,
      fixed: 'right' as const,
      render: (_: any, record: ParsedProduct) => (
        <Button
          type="link"
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveProduct(record.key)}
        />
      ),
    },
  ];

  const validCount = parsedProducts.filter(p => p.valid).length;
  const invalidCount = parsedProducts.length - validCount;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Title level={2} className="!mb-1">
            <span className="bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
              Import Products
            </span>
          </Title>
          <Text type="secondary">Bulk import products from Excel files</Text>
        </div>
        <Space>
          <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
            Download Template
          </Button>
          {parsedProducts.length > 0 && (
            <Button onClick={handleReset}>Start Over</Button>
          )}
        </Space>
      </div>

      {/* Steps */}
      <Card>
        <Steps
          current={currentStep}
          items={[
            { title: 'Upload File', icon: <UploadOutlined /> },
            { title: 'Review Data', icon: <FileExcelOutlined /> },
            { title: 'Import', icon: <SaveOutlined /> },
            { title: 'Complete', icon: <CheckCircleOutlined /> },
          ]}
        />
      </Card>

      {/* Step 0: Upload */}
      {currentStep === 0 && (
        <Card>
          <div className="max-w-2xl mx-auto">
            <Alert
              message="Import Instructions"
              description={
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Download the template file to see the required format</li>
                  <li>Fill in your product data in the Excel file</li>
                  <li>Upload the completed file to preview before importing</li>
                  <li>Required fields: SKU, Product Name, Cost Price, Selling Price</li>
                </ul>
              }
              type="info"
              showIcon
              className="mb-6"
            />

            <Dragger
              name="file"
              accept=".xlsx,.xls,.csv"
              beforeUpload={handleFileUpload}
              showUploadList={false}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} />
              </p>
              <p className="ant-upload-text text-lg">
                Click or drag Excel file to upload
              </p>
              <p className="ant-upload-hint">
                Supports .xlsx, .xls, and .csv files
              </p>
            </Dragger>
          </div>
        </Card>
      )}

      {/* Step 1: Review */}
      {currentStep === 1 && parsedProducts.length > 0 && (
        <>
          {/* Stats */}
          <Row gutter={16}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Total Rows"
                  value={parsedProducts.length}
                  prefix={<FileExcelOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Valid"
                  value={validCount}
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Invalid"
                  value={invalidCount}
                  valueStyle={{ color: invalidCount > 0 ? '#cf1322' : '#3f8600' }}
                  prefix={<ExclamationCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="File"
                  value={fileName || 'N/A'}
                  valueStyle={{ fontSize: 14 }}
                />
              </Card>
            </Col>
          </Row>

          {invalidCount > 0 && (
            <Alert
              message={`${invalidCount} rows have validation errors`}
              description="Please fix the errors before importing, or remove invalid rows."
              type="warning"
              showIcon
            />
          )}

          {/* Preview Table */}
          <Card
            title="Preview Data"
            extra={
              <Space>
                <Button onClick={handleExportPreview} icon={<DownloadOutlined />}>
                  Export Preview
                </Button>
                <Button
                  type="primary"
                  onClick={handleImport}
                  disabled={validCount === 0}
                  icon={<SaveOutlined />}
                >
                  Import {validCount} Products
                </Button>
              </Space>
            }
          >
            <Table
              columns={columns}
              dataSource={parsedProducts}
              rowKey="key"
              scroll={{ x: 1200 }}
              pagination={{ pageSize: 10, showSizeChanger: true }}
              rowClassName={(record) => !record.valid ? 'bg-red-50' : ''}
            />
          </Card>
        </>
      )}

      {/* Step 2: Importing */}
      {currentStep === 2 && importing && (
        <Card>
          <div className="text-center py-12">
            <Spin size="large" />
            <div className="mt-6">
              <Title level={4}>Importing Products...</Title>
              <Progress percent={importProgress} status="active" className="max-w-md mx-auto" />
              <Text type="secondary">Please wait while products are being imported</Text>
            </div>
          </div>
        </Card>
      )}

      {/* Step 3: Results */}
      {currentStep === 3 && importResults && (
        <Card>
          <div className="text-center py-8">
            {importResults.success > 0 && importResults.failed === 0 ? (
              <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a' }} />
            ) : importResults.failed > 0 && importResults.success > 0 ? (
              <ExclamationCircleOutlined style={{ fontSize: 64, color: '#faad14' }} />
            ) : (
              <CloseCircleOutlined style={{ fontSize: 64, color: '#f5222d' }} />
            )}

            <Title level={3} className="mt-4">Import Complete</Title>

            <Row gutter={32} justify="center" className="mt-6">
              <Col>
                <Statistic
                  title="Successfully Imported"
                  value={importResults.success}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
              <Col>
                <Statistic
                  title="Failed"
                  value={importResults.failed}
                  valueStyle={{ color: importResults.failed > 0 ? '#cf1322' : '#3f8600' }}
                />
              </Col>
            </Row>

            {importResults.errors.length > 0 && (
              <div className="mt-6 text-left max-w-lg mx-auto">
                <Divider>Error Details</Divider>
                <Alert
                  message="Import Errors"
                  description={
                    <ul className="list-disc list-inside text-sm">
                      {importResults.errors.slice(0, 10).map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                      {importResults.errors.length > 10 && (
                        <li>...and {importResults.errors.length - 10} more errors</li>
                      )}
                    </ul>
                  }
                  type="error"
                  showIcon
                />
              </div>
            )}

            <div className="mt-8">
              <Space>
                <Button onClick={handleReset}>Import More Products</Button>
                <Button type="primary" href="/protected/products">
                  View Products
                </Button>
              </Space>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
