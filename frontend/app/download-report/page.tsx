export default function DownloadReportPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        background: 'white',
        padding: '60px',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        maxWidth: '600px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '72px', marginBottom: '20px' }}>📄</div>
        <h1 style={{
          fontSize: '36px',
          marginBottom: '20px',
          color: '#333',
          fontWeight: '700'
        }}>
          WMS Development Report
        </h1>
        <p style={{
          fontSize: '18px',
          color: '#666',
          marginBottom: '40px',
          lineHeight: '1.6'
        }}>
          Comprehensive documentation of marketplace integrations,
          UK shipping carriers, and platform enhancements.
        </p>

        <div style={{
          background: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '30px',
          textAlign: 'left'
        }}>
          <div style={{ marginBottom: '10px' }}>
            <strong style={{ color: '#667eea' }}>Report Contents:</strong>
          </div>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0
          }}>
            <li style={{ padding: '5px 0' }}>✓ Executive Summary</li>
            <li style={{ padding: '5px 0' }}>✓ Marketplace Integrations (eBay, TikTok)</li>
            <li style={{ padding: '5px 0' }}>✓ UK Shipping Carriers (Royal Mail, DPD, ParcelForce)</li>
            <li style={{ padding: '5px 0' }}>✓ API Endpoint Documentation</li>
            <li style={{ padding: '5px 0' }}>✓ Security Features Overview</li>
            <li style={{ padding: '5px 0' }}>✓ Deployment Information</li>
          </ul>
        </div>

        <a
          href="/wms-development-report.pdf"
          download
          style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '16px 40px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '18px',
            fontWeight: '600',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
          }}
        >
          📥 Download Report (242 KB)
        </a>

        <div style={{
          marginTop: '40px',
          paddingTop: '30px',
          borderTop: '1px solid #e9ecef'
        }}>
          <p style={{ fontSize: '14px', color: '#999', marginBottom: '10px' }}>
            Generated: December 3, 2025
          </p>
          <p style={{ fontSize: '14px', color: '#999' }}>
            Latest Commit: <code style={{
              background: '#f1f3f5',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '13px'
            }}>49ecf9f</code>
          </p>
        </div>

        <div style={{ marginTop: '30px' }}>
          <a
            href="/"
            style={{
              color: '#667eea',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
