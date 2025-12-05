'use client';

import React, { useState, useEffect } from 'react';
import {
  Card, Form, Input, Select, Button, Row, Col, message, InputNumber,
  Upload, Space, Spin, Switch
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined, UploadOutlined, PlusOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import apiService from '@/services/api';
import { PRODUCT_TYPES, UNITS_OF_MEASURE, DIMENSION_UNITS, WEIGHT_UNITS } from '@/lib/constants';
import type { UploadFile, UploadProps } from 'antd';

const { Option } = Select;
const { TextArea } = Input;

interface Brand {
  id: string;
  name: string;
  code: string;
}

interface Supplier {
  id: string;
  name: string;
  code?: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  // Fetch brands and suppliers on load
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [brandsData, suppliersData] = await Promise.all([
          apiService.get('/brands'),
          apiService.get('/suppliers')
        ]);
        setBrands(Array.isArray(brandsData) ? brandsData : []);
        setSuppliers(Array.isArray(suppliersData) ? suppliersData : []);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoadingBrands(false);
        setLoadingSuppliers(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);

      // Prepare the data for REST API
      const productData = {
        name: values.name,
        sku: values.sku,
        barcode: values.barcode || null,
        description: values.description || null,
        type: (values.type || 'SIMPLE').toUpperCase(),
        status: (values.status || 'ACTIVE').toUpperCase(),
        sellingPrice: parseFloat(values.sellingPrice) || 0,
        costPrice: parseFloat(values.costPrice) || 0,
        vatRate: values.vatRate !== undefined ? parseFloat(values.vatRate) : 20.0,
        vatCode: values.vatCode || null,
        isHeatSensitive: values.isHeatSensitive || false,
        isPerishable: values.isPerishable || false,
        requiresBatch: values.requiresBatch || false,
        shelfLifeDays: values.shelfLifeDays ? parseInt(values.shelfLifeDays) : null,
        cartonSizes: values.cartonSizes ? parseInt(values.cartonSizes) : null,
        // Marketplace-specific SKUs
        ffdSku: values.ffdSku || null,
        ffdSaleSku: values.ffdSaleSku || null,
        wsSku: values.wsSku || null,
        amzSku: values.amzSku || null,
        amzSkuBb: values.amzSkuBb || null,
        amzSkuM: values.amzSkuM || null,
        amzSkuEu: values.amzSkuEu || null,
        onBuySku: values.onBuySku || null,
        weight: values.weight ? parseFloat(values.weight) : null,
        length: values.dimensions?.length ? parseFloat(values.dimensions.length) : null,
        width: values.dimensions?.width ? parseFloat(values.dimensions.width) : null,
        height: values.dimensions?.height ? parseFloat(values.dimensions.height) : null,
        dimensionUnit: values.dimensionUnit || 'cm',
        weightUnit: values.weightUnit || 'kg',
        reorderPoint: values.reorderPoint ? parseInt(values.reorderPoint) : null,
        maxStockLevel: values.maxStockLevel ? parseInt(values.maxStockLevel) : null,
        brandId: values.brandId || null,
      };

      await apiService.post('/products', productData);
      message.success('Product created successfully!');
      router.push('/protected/products');
    } catch (error: any) {
      console.error('Error creating product:', error);
      message.error(error?.message || 'Failed to create product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const uploadProps: UploadProps = {
    listType: 'picture-card',
    fileList,
    onChange: ({ fileList: newFileList }) => {
      setFileList(newFileList);
    },
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('You can only upload image files!');
        return Upload.LIST_IGNORE;
      }
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('Image must be smaller than 5MB!');
        return Upload.LIST_IGNORE;
      }
      // For now, just preview locally - will implement upload later
      return false;
    },
    accept: 'image/*',
    maxCount: 5,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Add New Product
          </h1>
          <p className="text-gray-600 mt-1">Create a new product in your inventory</p>
        </div>
      </div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            type: 'SIMPLE',
            status: 'ACTIVE',
            unitOfMeasure: 'ea',
            dimensionUnit: 'cm',
            weightUnit: 'kg',
            vatRate: 20.0,
            isHeatSensitive: false,
            isPerishable: false,
            requiresBatch: false,
          }}
        >
          <h3 className="text-lg font-semibold mb-4">Basic Information</h3>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Product Name"
                name="name"
                rules={[{ required: true, message: 'Please enter product name' }]}
              >
                <Input placeholder="e.g., Organic Granola Bar" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="SKU"
                name="sku"
                rules={[{ required: true, message: 'Please enter SKU' }]}
              >
                <Input placeholder="e.g., PRD-001" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label="Product Type" name="type" rules={[{ required: true }]}>
                <Select size="large">
                  <Option value="SIMPLE">Simple Product</Option>
                  <Option value="BUNDLE">Bundle</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Status" name="status" rules={[{ required: true }]}>
                <Select size="large">
                  <Option value="ACTIVE">Active</Option>
                  <Option value="INACTIVE">Inactive</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Category" name="brandId">
                <Select
                  size="large"
                  placeholder="Select category"
                  allowClear
                  loading={loadingBrands}
                  showSearch
                  optionFilterProp="label"
                  options={brands.map((brand) => ({
                    value: brand.id,
                    label: brand.name,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Primary Supplier" name="primarySupplierId" tooltip="Main supplier for this product">
                <Select
                  size="large"
                  placeholder="Select primary supplier"
                  allowClear
                  loading={loadingSuppliers}
                  showSearch
                  optionFilterProp="label"
                  options={suppliers.map((supplier) => ({
                    value: supplier.id,
                    label: supplier.name,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Barcode" name="barcode">
                <Input placeholder="Enter barcode (EAN/UPC)" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Unit of Measure" name="unitOfMeasure">
                <Select size="large">
                  {UNITS_OF_MEASURE.map((unit) => (
                    <Option key={unit.value} value={unit.value}>
                      {unit.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Description" name="description">
            <TextArea rows={3} placeholder="Enter product description..." />
          </Form.Item>

          <h3 className="text-lg font-semibold mb-4 mt-6">Pricing</h3>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                label="Cost Price"
                name="costPrice"
                rules={[{ required: true, message: 'Please enter cost price' }]}
              >
                <InputNumber
                  placeholder="0.00"
                  size="large"
                  style={{ width: '100%' }}
                  prefix="£"
                  min={0}
                  step={0.01}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                label="Selling Price"
                name="sellingPrice"
                rules={[{ required: true, message: 'Please enter selling price' }]}
              >
                <InputNumber
                  placeholder="0.00"
                  size="large"
                  style={{ width: '100%' }}
                  prefix="£"
                  min={0}
                  step={0.01}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Margin" dependencies={['costPrice', 'sellingPrice']}>
                {({ getFieldValue }) => {
                  const cost = getFieldValue('costPrice') || 0;
                  const price = getFieldValue('sellingPrice') || 0;
                  const margin = price > 0 ? ((price - cost) / price) * 100 : 0;
                  return (
                    <div className="h-10 flex items-center">
                      <span
                        className={`text-lg font-semibold ${margin >= 20 ? 'text-green-600' : margin >= 10 ? 'text-orange-600' : 'text-red-600'}`}
                      >
                        {margin.toFixed(1)}%
                      </span>
                    </div>
                  );
                }}
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                label="VAT Rate (%)"
                name="vatRate"
                initialValue={20.0}
                tooltip="UK standard VAT rate is 20%, food items may be 0%"
              >
                <InputNumber
                  placeholder="20.0"
                  size="large"
                  style={{ width: '100%' }}
                  min={0}
                  max={100}
                  step={0.5}
                  suffix="%"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="VAT Code" name="vatCode" tooltip="VAT category code (e.g., A_FOOD_PLAINBISCUIT)">
                <Input placeholder="e.g., A_FOOD_PLAINBISCUIT" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Carton Sizes" name="cartonSizes" tooltip="Units per carton/case">
                <InputNumber placeholder="e.g., 12" size="large" style={{ width: '100%' }} min={1} />
              </Form.Item>
            </Col>
          </Row>

          <h3 className="text-lg font-semibold mb-4 mt-6">Marketplace SKUs</h3>
          <p className="text-gray-600 mb-4">Map this product to different sales channels with their specific SKUs</p>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="FFD SKU" name="ffdSku" tooltip="FFD marketplace SKU">
                <Input placeholder="e.g., FFD_789_B_1_CH" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="FFD Sale SKU" name="ffdSaleSku" tooltip="FFD sale SKU">
                <Input placeholder="e.g., FFD_789_B_1_CH_SALE" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Wholesale SKU" name="wsSku" tooltip="Wholesale channel SKU">
                <Input placeholder="e.g., WS_789_B_1_CH" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="OnBuy SKU" name="onBuySku" tooltip="OnBuy marketplace SKU">
                <Input placeholder="e.g., ONBUY_789_B_1_CH" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Amazon SKU" name="amzSku" tooltip="Amazon standard SKU (usually matches database SKU)">
                <Input placeholder="e.g., OL_SEL_10_PR" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Amazon SKU (Best Before)" name="amzSkuBb" tooltip="Amazon SKU for Best Before rotation (_BB suffix)">
                <Input placeholder="e.g., OL_SEL_10_PR_BB" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Amazon MFN SKU" name="amzSkuM" tooltip="Amazon Merchant Fulfilled Network SKU (_M suffix)">
                <Input placeholder="e.g., OL_SEL_10_PR_M" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Amazon EU SKU" name="amzSkuEu" tooltip="Amazon EU marketplace SKU">
                <Input placeholder="e.g., OL_SEL_10_PR_EU" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <h3 className="text-lg font-semibold mb-4 mt-6">Product Attributes</h3>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label="Heat Sensitive" name="isHeatSensitive" valuePropName="checked">
                <Select size="large">
                  <Option value={false}>No</Option>
                  <Option value={true}>Yes - Requires temperature control</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Perishable" name="isPerishable" valuePropName="checked">
                <Select size="large">
                  <Option value={false}>No</Option>
                  <Option value={true}>Yes - Has expiry date</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Requires Batch Tracking" name="requiresBatch" valuePropName="checked">
                <Select size="large">
                  <Option value={false}>No</Option>
                  <Option value={true}>Yes</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Shelf Life (Days)" name="shelfLifeDays">
                <InputNumber
                  placeholder="e.g., 365"
                  size="large"
                  style={{ width: '100%' }}
                  min={0}
                />
              </Form.Item>
            </Col>
          </Row>

          <h3 className="text-lg font-semibold mb-4 mt-6">Dimensions & Weight</h3>

          <Row gutter={16}>
            <Col xs={24} md={6}>
              <Form.Item label="Length" name={['dimensions', 'length']}>
                <InputNumber placeholder="0" size="large" style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item label="Width" name={['dimensions', 'width']}>
                <InputNumber placeholder="0" size="large" style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item label="Height" name={['dimensions', 'height']}>
                <InputNumber placeholder="0" size="large" style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item label="Unit" name="dimensionUnit">
                <Select size="large">
                  {DIMENSION_UNITS.map((unit) => (
                    <Option key={unit.value} value={unit.value}>
                      {unit.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Weight" name="weight">
                <InputNumber placeholder="0.00" size="large" style={{ width: '100%' }} min={0} step={0.01} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Weight Unit" name="weightUnit">
                <Select size="large">
                  {WEIGHT_UNITS.map((unit) => (
                    <Option key={unit.value} value={unit.value}>
                      {unit.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <h3 className="text-lg font-semibold mb-4 mt-6">Inventory Settings</h3>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label="Reorder Point" name="reorderPoint">
                <InputNumber placeholder="0" size="large" style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Reorder Quantity" name="reorderQuantity">
                <InputNumber placeholder="0" size="large" style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Max Stock Level" name="maxStockLevel">
                <InputNumber placeholder="0" size="large" style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>

          <h3 className="text-lg font-semibold mb-4 mt-6">Product Images</h3>

          <Form.Item
            label="Upload Images"
            extra="Supports JPG, PNG, GIF, WebP. Max 5 images, 5MB each."
          >
            <Upload {...uploadProps}>
              {fileList.length >= 5 ? null : (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              )}
            </Upload>
          </Form.Item>

          <div className="flex gap-4 mt-6">
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} size="large" loading={loading}>
              Create Product
            </Button>
            <Button size="large" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}
