'use client';

import React, { useState, useEffect } from 'react';
import {
  Card, Button, Form, Input, Select, InputNumber, message, Space, Tabs, Spin, Alert, Upload
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined, ReloadOutlined, PlusOutlined } from '@ant-design/icons';
import { useRouter, useParams } from 'next/navigation';
import apiService from '@/services/api';
import { DIMENSION_UNITS, WEIGHT_UNITS } from '@/lib/constants';
import type { UploadFile, UploadProps } from 'antd';

const { Option } = Select;
const { TextArea } = Input;

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  type: string;
  status: string;
  costPrice?: number;
  sellingPrice?: number;
  weight?: number;
  weightUnit?: string;
  length?: number;
  width?: number;
  height?: number;
  dimensionUnit?: string;
  reorderPoint?: number;
  maxStockLevel?: number;
  brandId?: string;
  brand?: { id: string; name: string };
  primarySupplierId?: string;
  vatRate?: number;
  vatCode?: string;
  isHeatSensitive?: boolean;
  isPerishable?: boolean;
  requiresBatch?: boolean;
  shelfLifeDays?: number;
  cartonSizes?: number;
  ffdSku?: string;
  ffdSaleSku?: string;
  wsSku?: string;
  amzSku?: string;
  amzSkuBb?: string;
  amzSkuM?: string;
  amzSkuEu?: string;
  onBuySku?: string;
}

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

export default function ProductEditPage() {
  const router = useRouter();
  const params = useParams();
  const [form] = Form.useForm();
  const [product, setProduct] = useState<Product | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  // Fetch product data
  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.get(`/products/${params.id}`);
      setProduct(data);

      // Set form values
      form.setFieldsValue({
        name: data.name,
        sku: data.sku,
        barcode: data.barcode,
        description: data.description,
        type: data.type,
        status: data.status,
        costPrice: data.costPrice,
        sellingPrice: data.sellingPrice,
        weight: data.weight,
        weightUnit: data.weightUnit || 'kg',
        length: data.length,
        width: data.width,
        height: data.height,
        dimensionUnit: data.dimensionUnit || 'cm',
        reorderPoint: data.reorderPoint,
        maxStockLevel: data.maxStockLevel,
        brandId: data.brandId || data.brand?.id,
        primarySupplierId: data.primarySupplierId,
        vatRate: data.vatRate || 20.0,
        vatCode: data.vatCode,
        isHeatSensitive: data.isHeatSensitive || false,
        isPerishable: data.isPerishable || false,
        requiresBatch: data.requiresBatch || false,
        shelfLifeDays: data.shelfLifeDays,
        cartonSizes: data.cartonSizes,
        ffdSku: data.ffdSku,
        ffdSaleSku: data.ffdSaleSku,
        wsSku: data.wsSku,
        amzSku: data.amzSku,
        amzSkuBb: data.amzSkuBb,
        amzSkuM: data.amzSkuM,
        amzSkuEu: data.amzSkuEu,
        onBuySku: data.onBuySku,
      });
    } catch (err: any) {
      console.error('Failed to fetch product:', err);
      setError(err.message || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  // Fetch brands and suppliers
  const fetchBrands = async () => {
    try {
      const data = await apiService.get('/brands');
      setBrands(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch brands:', err);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const data = await apiService.get('/suppliers');
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchProduct();
      fetchBrands();
      fetchSuppliers();
    }
  }, [params.id]);

  const handleSubmit = async (values: any) => {
    try {
      setSaving(true);

      const updateData = {
        name: values.name,
        sku: values.sku,
        barcode: values.barcode || null,
        description: values.description || null,
        type: values.type,
        status: values.status,
        costPrice: values.costPrice ? parseFloat(values.costPrice) : null,
        sellingPrice: values.sellingPrice ? parseFloat(values.sellingPrice) : null,
        weight: values.weight ? parseFloat(values.weight) : null,
        weightUnit: values.weightUnit || 'kg',
        length: values.length ? parseFloat(values.length) : null,
        width: values.width ? parseFloat(values.width) : null,
        height: values.height ? parseFloat(values.height) : null,
        dimensionUnit: values.dimensionUnit || 'cm',
        reorderPoint: values.reorderPoint ? parseInt(values.reorderPoint) : null,
        maxStockLevel: values.maxStockLevel ? parseInt(values.maxStockLevel) : null,
        brandId: values.brandId || null,
        primarySupplierId: values.primarySupplierId || null,
        vatRate: values.vatRate !== undefined ? parseFloat(values.vatRate) : 20.0,
        vatCode: values.vatCode || null,
        isHeatSensitive: values.isHeatSensitive || false,
        isPerishable: values.isPerishable || false,
        requiresBatch: values.requiresBatch || false,
        shelfLifeDays: values.shelfLifeDays ? parseInt(values.shelfLifeDays) : null,
        cartonSizes: values.cartonSizes ? parseInt(values.cartonSizes) : null,
        ffdSku: values.ffdSku || null,
        ffdSaleSku: values.ffdSaleSku || null,
        wsSku: values.wsSku || null,
        amzSku: values.amzSku || null,
        amzSkuBb: values.amzSkuBb || null,
        amzSkuM: values.amzSkuM || null,
        amzSkuEu: values.amzSkuEu || null,
        onBuySku: values.onBuySku || null,
      };

      await apiService.put(`/products/${params.id}`, updateData);
      message.success('Product updated successfully!');
      router.push(`/protected/products/${params.id}`);
    } catch (error: any) {
      console.error('Error updating product:', error);
      message.error(error?.message || 'Failed to update product. Please try again.');
    } finally {
      setSaving(false);
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
      return false;
    },
    accept: 'image/*',
    maxCount: 5,
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" tip="Loading product..." />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="p-6">
        <Alert
          message="Error Loading Product"
          description={error || 'Product not found'}
          type="error"
          showIcon
          action={
            <Space>
              <Button onClick={fetchProduct} icon={<ReloadOutlined />}>
                Retry
              </Button>
              <Button onClick={() => router.push('/protected/products')}>
                Back to Products
              </Button>
            </Space>
          }
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Edit Product
            </h1>
            <p className="text-gray-600 mt-1">SKU: {product.sku}</p>
          </div>
        </div>
        <Space>
          <Button onClick={() => router.back()}>Cancel</Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => form.submit()}
            loading={saving}
            size="large"
          >
            Save Changes
          </Button>
        </Space>
      </div>

      {/* Form */}
      <Card>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Tabs
            defaultActiveKey="basic"
            items={[
              {
                key: 'basic',
                label: 'Basic Information',
                children: (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Form.Item
                      label="Product Name"
                      name="name"
                      rules={[{ required: true, message: 'Please enter product name' }]}
                    >
                      <Input size="large" placeholder="Enter product name" />
                    </Form.Item>

                    <Form.Item
                      label="SKU"
                      name="sku"
                      rules={[{ required: true, message: 'Please enter SKU' }]}
                    >
                      <Input size="large" placeholder="Enter SKU" />
                    </Form.Item>

                    <Form.Item label="Barcode" name="barcode">
                      <Input size="large" placeholder="Enter barcode" />
                    </Form.Item>

                    <Form.Item label="Brand" name="brandId">
                      <Select size="large" placeholder="Select brand" allowClear>
                        {brands.map((brand) => (
                          <Option key={brand.id} value={brand.id}>
                            {brand.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item label="Primary Supplier" name="primarySupplierId" tooltip="Main supplier for this product">
                      <Select size="large" placeholder="Select primary supplier" allowClear showSearch optionFilterProp="label">
                        {suppliers.map((supplier) => (
                          <Option key={supplier.id} value={supplier.id} label={supplier.name}>
                            {supplier.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item label="Type" name="type" rules={[{ required: true }]}>
                      <Select size="large" placeholder="Select type">
                        <Option value="SIMPLE">Simple</Option>
                        <Option value="BUNDLE">Bundle</Option>
                      </Select>
                    </Form.Item>

                    <Form.Item label="Status" name="status" rules={[{ required: true }]}>
                      <Select size="large" placeholder="Select status">
                        <Option value="ACTIVE">Active</Option>
                        <Option value="INACTIVE">Inactive</Option>
                        <Option value="DISCONTINUED">Discontinued</Option>
                      </Select>
                    </Form.Item>

                    <Form.Item label="VAT Rate (%)" name="vatRate" tooltip="UK standard VAT rate is 20%, food items may be 0%">
                      <InputNumber size="large" style={{ width: '100%' }} min={0} max={100} step={0.5} suffix="%" placeholder="20.0" />
                    </Form.Item>

                    <Form.Item label="VAT Code" name="vatCode" tooltip="VAT category code (e.g., A_FOOD_PLAINBISCUIT)">
                      <Input size="large" placeholder="e.g., A_FOOD_PLAINBISCUIT" />
                    </Form.Item>

                    <Form.Item label="Carton Sizes" name="cartonSizes" tooltip="Units per carton/case">
                      <InputNumber size="large" style={{ width: '100%' }} min={1} placeholder="e.g., 12" />
                    </Form.Item>

                    <Form.Item label="Shelf Life (Days)" name="shelfLifeDays">
                      <InputNumber size="large" style={{ width: '100%' }} min={0} placeholder="e.g., 365" />
                    </Form.Item>

                    <Form.Item label="Heat Sensitive" name="isHeatSensitive" tooltip="Requires temperature control">
                      <Select size="large">
                        <Option value={false}>No</Option>
                        <Option value={true}>Yes</Option>
                      </Select>
                    </Form.Item>

                    <Form.Item label="Perishable" name="isPerishable" tooltip="Has expiry/best before date">
                      <Select size="large">
                        <Option value={false}>No</Option>
                        <Option value={true}>Yes</Option>
                      </Select>
                    </Form.Item>

                    <Form.Item label="Requires Batch Tracking" name="requiresBatch">
                      <Select size="large">
                        <Option value={false}>No</Option>
                        <Option value={true}>Yes</Option>
                      </Select>
                    </Form.Item>

                    <Form.Item label="Description" name="description" className="md:col-span-2">
                      <TextArea rows={4} placeholder="Enter product description" />
                    </Form.Item>
                  </div>
                ),
              },
              {
                key: 'pricing',
                label: 'Pricing',
                children: (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Form.Item
                      label="Cost Price"
                      name="costPrice"
                      rules={[{ required: true, message: 'Please enter cost price' }]}
                    >
                      <InputNumber
                        size="large"
                        style={{ width: '100%' }}
                        min={0}
                        precision={2}
                        prefix="£"
                        placeholder="0.00"
                      />
                    </Form.Item>

                    <Form.Item
                      label="Selling Price"
                      name="sellingPrice"
                      rules={[{ required: true, message: 'Please enter selling price' }]}
                    >
                      <InputNumber
                        size="large"
                        style={{ width: '100%' }}
                        min={0}
                        precision={2}
                        prefix="£"
                        placeholder="0.00"
                      />
                    </Form.Item>
                  </div>
                ),
              },
              {
                key: 'dimensions',
                label: 'Dimensions & Weight',
                children: (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Form.Item label="Weight" name="weight">
                        <InputNumber
                          size="large"
                          style={{ width: '100%' }}
                          min={0}
                          precision={2}
                          placeholder="0.00"
                        />
                      </Form.Item>

                      <Form.Item label="Weight Unit" name="weightUnit">
                        <Select size="large" placeholder="Select unit">
                          {WEIGHT_UNITS.map((unit) => (
                            <Option key={unit.value} value={unit.value}>
                              {unit.label}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Form.Item label="Length" name="length">
                        <InputNumber
                          size="large"
                          style={{ width: '100%' }}
                          min={0}
                          precision={2}
                          placeholder="0.00"
                        />
                      </Form.Item>

                      <Form.Item label="Width" name="width">
                        <InputNumber
                          size="large"
                          style={{ width: '100%' }}
                          min={0}
                          precision={2}
                          placeholder="0.00"
                        />
                      </Form.Item>

                      <Form.Item label="Height" name="height">
                        <InputNumber
                          size="large"
                          style={{ width: '100%' }}
                          min={0}
                          precision={2}
                          placeholder="0.00"
                        />
                      </Form.Item>

                      <Form.Item label="Unit" name="dimensionUnit">
                        <Select size="large" placeholder="Select unit">
                          {DIMENSION_UNITS.map((unit) => (
                            <Option key={unit.value} value={unit.value}>
                              {unit.label}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </div>
                  </div>
                ),
              },
              {
                key: 'inventory',
                label: 'Inventory Settings',
                children: (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Form.Item label="Reorder Point" name="reorderPoint">
                      <InputNumber
                        size="large"
                        style={{ width: '100%' }}
                        min={0}
                        placeholder="0"
                      />
                    </Form.Item>

                    <Form.Item label="Max Stock Level" name="maxStockLevel">
                      <InputNumber
                        size="large"
                        style={{ width: '100%' }}
                        min={0}
                        placeholder="0"
                      />
                    </Form.Item>
                  </div>
                ),
              },
              {
                key: 'marketplace',
                label: 'Marketplace SKUs',
                children: (
                  <div className="space-y-4">
                    <p className="text-gray-600 mb-4">Map this product to different sales channels with their specific SKUs</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Form.Item label="FFD SKU" name="ffdSku" tooltip="FFD marketplace SKU">
                        <Input size="large" placeholder="e.g., FFD_789_B_1_CH" />
                      </Form.Item>

                      <Form.Item label="FFD Sale SKU" name="ffdSaleSku" tooltip="FFD sale SKU">
                        <Input size="large" placeholder="e.g., FFD_789_B_1_CH_SALE" />
                      </Form.Item>

                      <Form.Item label="Wholesale SKU" name="wsSku" tooltip="Wholesale channel SKU">
                        <Input size="large" placeholder="e.g., WS_789_B_1_CH" />
                      </Form.Item>

                      <Form.Item label="OnBuy SKU" name="onBuySku" tooltip="OnBuy marketplace SKU">
                        <Input size="large" placeholder="e.g., ONBUY_789_B_1_CH" />
                      </Form.Item>

                      <Form.Item label="Amazon SKU" name="amzSku" tooltip="Amazon standard SKU (usually matches database SKU)">
                        <Input size="large" placeholder="e.g., OL_SEL_10_PR" />
                      </Form.Item>

                      <Form.Item label="Amazon SKU (Best Before)" name="amzSkuBb" tooltip="Amazon SKU for Best Before rotation (_BB suffix)">
                        <Input size="large" placeholder="e.g., OL_SEL_10_PR_BB" />
                      </Form.Item>

                      <Form.Item label="Amazon MFN SKU" name="amzSkuM" tooltip="Amazon Merchant Fulfilled Network SKU (_M suffix)">
                        <Input size="large" placeholder="e.g., OL_SEL_10_PR_M" />
                      </Form.Item>

                      <Form.Item label="Amazon EU SKU" name="amzSkuEu" tooltip="Amazon EU marketplace SKU">
                        <Input size="large" placeholder="e.g., OL_SEL_10_PR_EU" />
                      </Form.Item>
                    </div>
                  </div>
                ),
              },
              {
                key: 'images',
                label: 'Images',
                children: (
                  <div>
                    <p className="text-gray-500 mb-4">
                      Upload product images. Supports JPG, PNG, GIF, WebP. Max 5 images.
                    </p>
                    <Upload {...uploadProps}>
                      {fileList.length >= 5 ? null : (
                        <div>
                          <PlusOutlined />
                          <div style={{ marginTop: 8 }}>Upload</div>
                        </div>
                      )}
                    </Upload>
                  </div>
                ),
              },
            ]}
          />
        </Form>
      </Card>
    </div>
  );
}
