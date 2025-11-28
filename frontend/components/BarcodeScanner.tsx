'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Button, Modal, Alert, Select, Space, Spin } from 'antd';
import { CameraOutlined, CloseOutlined, SyncOutlined } from '@ant-design/icons';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onError?: (error: string) => void;
  buttonText?: string;
  buttonType?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
  buttonSize?: 'small' | 'middle' | 'large';
  disabled?: boolean;
}

export default function BarcodeScanner({
  onScan,
  onError,
  buttonText = 'Scan Barcode',
  buttonType = 'primary',
  buttonSize = 'middle',
  disabled = false,
}: BarcodeScannerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const supportedFormats = [
    Html5QrcodeSupportedFormats.EAN_13,
    Html5QrcodeSupportedFormats.EAN_8,
    Html5QrcodeSupportedFormats.UPC_A,
    Html5QrcodeSupportedFormats.UPC_E,
    Html5QrcodeSupportedFormats.CODE_128,
    Html5QrcodeSupportedFormats.CODE_39,
    Html5QrcodeSupportedFormats.CODE_93,
    Html5QrcodeSupportedFormats.ITF,
    Html5QrcodeSupportedFormats.QR_CODE,
    Html5QrcodeSupportedFormats.DATA_MATRIX,
  ];

  // Get available cameras
  const getCameras = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setCameras(devices.map(d => ({ id: d.id, label: d.label || `Camera ${d.id}` })));
        // Prefer back camera
        const backCamera = devices.find(d =>
          d.label.toLowerCase().includes('back') ||
          d.label.toLowerCase().includes('rear') ||
          d.label.toLowerCase().includes('environment')
        );
        setSelectedCamera(backCamera?.id || devices[0].id);
      } else {
        setError('No cameras found on this device');
      }
    } catch (err: any) {
      console.error('Error getting cameras:', err);
      setError('Failed to access camera. Please ensure camera permissions are granted.');
    }
  };

  // Start scanning
  const startScanning = async () => {
    if (!selectedCamera || !containerRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      // Clean up existing scanner if any
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
          scannerRef.current.clear();
        } catch (e) {
          // Ignore cleanup errors
        }
      }

      scannerRef.current = new Html5Qrcode('barcode-scanner-container', {
        formatsToSupport: supportedFormats,
        verbose: false,
      });

      await scannerRef.current.start(
        selectedCamera,
        {
          fps: 10,
          qrbox: { width: 280, height: 150 },
          aspectRatio: 1.777,
        },
        (decodedText) => {
          // Successfully scanned
          handleSuccessfulScan(decodedText);
        },
        (errorMessage) => {
          // Scanning error - this fires continuously when no barcode is detected
          // Don't show these errors to user
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      console.error('Error starting scanner:', err);
      setError(err.message || 'Failed to start camera');
      onError?.(err.message || 'Failed to start camera');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle successful scan
  const handleSuccessfulScan = async (barcode: string) => {
    // Stop scanner first
    await stopScanning();

    // Call the callback
    onScan(barcode);

    // Close modal
    setIsModalOpen(false);
  };

  // Stop scanning
  const stopScanning = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        setIsScanning(false);
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  // Open modal and get cameras
  const openScanner = async () => {
    setIsModalOpen(true);
    setError(null);
    await getCameras();
  };

  // Close modal and cleanup
  const closeScanner = async () => {
    await stopScanning();
    setIsModalOpen(false);
    setCameras([]);
    setSelectedCamera('');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop();
          scannerRef.current.clear();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, []);

  // Start scanning when camera is selected
  useEffect(() => {
    if (isModalOpen && selectedCamera && !isScanning && !isLoading) {
      startScanning();
    }
  }, [selectedCamera, isModalOpen]);

  return (
    <>
      <Button
        type={buttonType}
        size={buttonSize}
        icon={<CameraOutlined />}
        onClick={openScanner}
        disabled={disabled}
      >
        {buttonText}
      </Button>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <CameraOutlined />
            <span>Scan Barcode</span>
          </div>
        }
        open={isModalOpen}
        onCancel={closeScanner}
        footer={null}
        width={500}
        destroyOnClose
        centered
      >
        <div className="space-y-4">
          {error && (
            <Alert
              message="Camera Error"
              description={error}
              type="error"
              showIcon
              closable
              onClose={() => setError(null)}
            />
          )}

          {cameras.length > 1 && (
            <Space className="w-full">
              <span>Camera:</span>
              <Select
                value={selectedCamera}
                onChange={async (value) => {
                  await stopScanning();
                  setSelectedCamera(value);
                }}
                style={{ width: 250 }}
                options={cameras.map(c => ({ value: c.id, label: c.label }))}
              />
              <Button
                icon={<SyncOutlined spin={isLoading} />}
                onClick={async () => {
                  await stopScanning();
                  await startScanning();
                }}
                disabled={isLoading}
              >
                Restart
              </Button>
            </Space>
          )}

          <div className="relative bg-black rounded-lg overflow-hidden" style={{ minHeight: 300 }}>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                <Spin size="large" tip="Starting camera..." />
              </div>
            )}
            <div
              id="barcode-scanner-container"
              ref={containerRef}
              className="w-full"
              style={{ minHeight: 300 }}
            />
          </div>

          <div className="text-center text-gray-500 text-sm">
            <p>Position the barcode within the scanning area</p>
            <p>Supports: EAN-13, EAN-8, UPC-A, UPC-E, Code 128, Code 39, QR Code</p>
          </div>

          <div className="flex justify-end">
            <Button icon={<CloseOutlined />} onClick={closeScanner}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
