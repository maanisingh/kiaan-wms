const nodemailer = require('nodemailer');
const axios = require('axios');
const prisma = require('../prisma');

/**
 * Alert Service for sending notifications when integrations fail
 * Supports email, Slack webhooks, and custom webhooks
 */
class AlertService {
  constructor(config = {}) {
    this.config = {
      email: {
        enabled: process.env.ALERT_EMAIL_ENABLED === 'true',
        recipients: (process.env.ALERT_EMAIL_RECIPIENTS || '').split(',').filter(Boolean),
        from: process.env.ALERT_EMAIL_FROM || 'wms-alerts@kiaan.com'
      },
      slack: {
        enabled: process.env.ALERT_SLACK_ENABLED === 'true',
        webhookUrl: process.env.SLACK_WEBHOOK_URL
      },
      webhook: {
        enabled: process.env.ALERT_WEBHOOK_ENABLED === 'true',
        url: process.env.ALERT_WEBHOOK_URL,
        token: process.env.ALERT_WEBHOOK_TOKEN
      },
      ...config
    };

    this.alertHistory = [];
    this.throttleWindow = 15 * 60 * 1000; // 15 minutes
    this.emailTransport = null;

    if (this.config.email.enabled) {
      this.setupEmailTransport();
    }
  }

  /**
   * Setup email transport using nodemailer
   */
  setupEmailTransport() {
    const smtpConfig = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    };

    // Only create transport if SMTP is configured
    if (smtpConfig.host && smtpConfig.auth.user) {
      this.emailTransport = nodemailer.createTransport(smtpConfig);
    }
  }

  /**
   * Send alert through all configured channels
   * @param {string} type - Alert type (e.g., INTEGRATION_DOWN, TOKEN_EXPIRY)
   * @param {Object} data - Alert data/context
   * @param {string} severity - critical, warning, or info
   */
  async sendAlert(type, data, severity = 'warning') {
    // Check throttling
    if (this.isThrottled(type, data)) {
      console.log(`[AlertService] Throttled: ${type}`);
      return { throttled: true };
    }

    const alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      severity,
      timestamp: new Date().toISOString()
    };

    // Add to history for throttling
    this.alertHistory.push(alert);

    // Clean old history entries
    this.cleanHistory();

    const results = {
      alertId: alert.id,
      sent: []
    };

    // Send through all enabled channels
    if (this.config.email.enabled && this.emailTransport) {
      try {
        await this.sendEmailAlert(alert);
        results.sent.push('email');
      } catch (error) {
        console.error('[AlertService] Email failed:', error.message);
      }
    }

    if (this.config.slack.enabled && this.config.slack.webhookUrl) {
      try {
        await this.sendSlackAlert(alert);
        results.sent.push('slack');
      } catch (error) {
        console.error('[AlertService] Slack failed:', error.message);
      }
    }

    if (this.config.webhook.enabled && this.config.webhook.url) {
      try {
        await this.sendWebhookAlert(alert);
        results.sent.push('webhook');
      } catch (error) {
        console.error('[AlertService] Webhook failed:', error.message);
      }
    }

    // Store alert in database
    try {
      await this.storeAlert(alert);
    } catch (error) {
      console.error('[AlertService] Failed to store alert:', error.message);
    }

    console.log(`[AlertService] Alert sent: ${type} via ${results.sent.join(', ') || 'no channels'}`);
    return results;
  }

  /**
   * Send email alert
   * @param {Object} alert - Alert object
   */
  async sendEmailAlert(alert) {
    if (!this.emailTransport || this.config.email.recipients.length === 0) {
      return;
    }

    const subject = this.getEmailSubject(alert);
    const html = this.formatEmailBody(alert);

    await this.emailTransport.sendMail({
      from: this.config.email.from,
      to: this.config.email.recipients,
      subject,
      html
    });
  }

  /**
   * Send Slack alert
   * @param {Object} alert - Alert object
   */
  async sendSlackAlert(alert) {
    const color = this.getSeverityColor(alert.severity);
    const fields = Object.entries(alert.data).map(([key, value]) => ({
      title: this.formatFieldName(key),
      value: String(value),
      short: true
    }));

    await axios.post(this.config.slack.webhookUrl, {
      attachments: [{
        color,
        title: `WMS Alert: ${this.getAlertTitle(alert.type)}`,
        text: this.formatAlertMessage(alert),
        fields,
        footer: 'Kiaan WMS Monitoring',
        ts: Math.floor(Date.now() / 1000)
      }]
    });
  }

  /**
   * Send webhook alert
   * @param {Object} alert - Alert object
   */
  async sendWebhookAlert(alert) {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (this.config.webhook.token) {
      headers['Authorization'] = `Bearer ${this.config.webhook.token}`;
    }

    await axios.post(this.config.webhook.url, {
      source: 'kiaan-wms',
      version: '1.0',
      ...alert
    }, { headers });
  }

  /**
   * Store alert in database
   * @param {Object} alert - Alert object
   */
  async storeAlert(alert) {
    try {
      // Check if IntegrationAlert model exists, otherwise skip
      if (prisma.integrationAlert) {
        await prisma.integrationAlert.create({
          data: {
            alertType: alert.type,
            severity: alert.severity,
            data: JSON.stringify(alert.data),
            sentAt: new Date(alert.timestamp),
            acknowledged: false
          }
        });
      }
    } catch (error) {
      // Model might not exist - that's okay
      console.log('[AlertService] Alert storage skipped (model may not exist)');
    }
  }

  /**
   * Check if alert should be throttled
   * @param {string} type - Alert type
   * @param {Object} data - Alert data
   * @returns {boolean} - True if throttled
   */
  isThrottled(type, data) {
    const now = Date.now();
    const key = `${type}-${JSON.stringify(data)}`;

    const recentSame = this.alertHistory.find(a =>
      `${a.type}-${JSON.stringify(a.data)}` === key &&
      (now - new Date(a.timestamp).getTime()) < this.throttleWindow
    );

    return !!recentSame;
  }

  /**
   * Clean old history entries
   */
  cleanHistory() {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours
    this.alertHistory = this.alertHistory.filter(
      a => new Date(a.timestamp).getTime() > cutoff
    );
  }

  /**
   * Get email subject line
   * @param {Object} alert - Alert object
   * @returns {string} - Email subject
   */
  getEmailSubject(alert) {
    const severityEmoji = {
      critical: '🚨',
      warning: '⚠️',
      info: 'ℹ️'
    };

    const emoji = severityEmoji[alert.severity] || '⚠️';
    return `${emoji} WMS Alert: ${this.getAlertTitle(alert.type)}`;
  }

  /**
   * Format email body as HTML
   * @param {Object} alert - Alert object
   * @returns {string} - HTML body
   */
  formatEmailBody(alert) {
    const color = this.getSeverityColor(alert.severity);
    const dataRows = Object.entries(alert.data)
      .map(([key, value]) => `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; text-transform: capitalize;">
            ${this.formatFieldName(key)}
          </td>
          <td style="padding: 8px; border: 1px solid #ddd;">
            ${this.escapeHtml(String(value))}
          </td>
        </tr>
      `).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>WMS Alert</title>
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: ${color}; margin-top: 0;">
              ${this.getAlertTitle(alert.type)}
            </h2>

            <p style="color: #666;">
              <strong>Time:</strong> ${new Date(alert.timestamp).toLocaleString()}<br>
              <strong>Severity:</strong>
              <span style="color: ${color}; font-weight: bold; text-transform: uppercase;">
                ${alert.severity}
              </span>
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">

            <h3 style="color: #333; margin-bottom: 10px;">Details</h3>
            <table style="border-collapse: collapse; width: 100%;">
              ${dataRows}
            </table>

            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">

            <p style="color: #999; font-size: 12px; margin-bottom: 0;">
              This alert was generated by Kiaan WMS Integration Monitor.<br>
              Alert ID: ${alert.id}
            </p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Get human-readable alert title
   * @param {string} type - Alert type
   * @returns {string} - Title
   */
  getAlertTitle(type) {
    const titles = {
      INTEGRATION_DOWN: 'Integration Connection Failed',
      TOKEN_EXPIRY_CRITICAL: 'Token Expiring Soon - Critical',
      TOKEN_EXPIRY_WARNING: 'Token Expiring Soon - Warning',
      RATE_LIMIT_EXCEEDED: 'API Rate Limit Exceeded',
      SYNC_FAILURE: 'Order/Inventory Sync Failed',
      CONTRACT_VIOLATION: 'API Response Contract Violation',
      MONITOR_FAILURE: 'Monitoring System Error',
      HIGH_LATENCY: 'High API Latency Detected',
      CONSECUTIVE_FAILURES: 'Multiple Consecutive Failures'
    };

    return titles[type] || type.replace(/_/g, ' ');
  }

  /**
   * Format alert message for Slack
   * @param {Object} alert - Alert object
   * @returns {string} - Message
   */
  formatAlertMessage(alert) {
    const messages = {
      INTEGRATION_DOWN: `The ${alert.data.integration || 'integration'} is currently unreachable.`,
      TOKEN_EXPIRY_CRITICAL: `Token expires in ${alert.data.daysRemaining || 'less than 1'} day(s).`,
      TOKEN_EXPIRY_WARNING: `Token expires in ${alert.data.daysRemaining || 'few'} days.`,
      SYNC_FAILURE: `Sync operation failed: ${alert.data.error || 'Unknown error'}`,
      CONSECUTIVE_FAILURES: `${alert.data.consecutiveFailures || 'Multiple'} consecutive failures detected.`
    };

    return messages[alert.type] || `Alert triggered: ${alert.type}`;
  }

  /**
   * Get color for severity level
   * @param {string} severity - Severity level
   * @returns {string} - Hex color
   */
  getSeverityColor(severity) {
    const colors = {
      critical: '#dc3545',
      warning: '#ffc107',
      info: '#17a2b8'
    };
    return colors[severity] || colors.warning;
  }

  /**
   * Format field name for display
   * @param {string} name - Field name
   * @returns {string} - Formatted name
   */
  formatFieldName(name) {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  /**
   * Escape HTML characters
   * @param {string} str - Input string
   * @returns {string} - Escaped string
   */
  escapeHtml(str) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return str.replace(/[&<>"']/g, m => map[m]);
  }
}

module.exports = AlertService;
