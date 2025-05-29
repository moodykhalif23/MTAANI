interface AlertConfig {
  webhookUrl?: string
  emailEndpoint?: string
  slackWebhook?: string
  discordWebhook?: string
  smsEndpoint?: string
  enabledChannels: ('webhook' | 'email' | 'slack' | 'discord' | 'sms')[]
  alertThresholds: {
    critical: number
    high: number
    medium: number
  }
}

interface AlertPayload {
  id: string
  timestamp: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  metadata: Record<string, unknown>
  source: 'subscription_security' | 'payment_fraud' | 'system_health'
  actionRequired: boolean
  affectedUsers?: string[]
  affectedIPs?: string[]
}

export class AlertSystem {
  private static instance: AlertSystem
  private config: AlertConfig
  private alertQueue: AlertPayload[] = []
  private isProcessing = false
  private rateLimits = new Map<string, { count: number; lastReset: number }>()

  constructor(config: Partial<AlertConfig> = {}) {
    this.config = {
      enabledChannels: ['webhook', 'slack'],
      alertThresholds: {
        critical: 1, // Send immediately
        high: 3, // Send after 3 events
        medium: 10 // Send after 10 events
      },
      ...config
    }
  }

  static getInstance(config?: Partial<AlertConfig>): AlertSystem {
    if (!AlertSystem.instance) {
      AlertSystem.instance = new AlertSystem(config)
    }
    return AlertSystem.instance
  }

  // Send immediate alert
  async sendAlert(payload: AlertPayload): Promise<boolean> {
    try {
      // Check rate limits
      if (this.isRateLimited(payload.severity)) {
        console.warn(`Alert rate limited: ${payload.severity}`)
        return false
      }

      // Add to queue
      this.alertQueue.push(payload)

      // Process queue if not already processing
      if (!this.isProcessing) {
        await this.processAlertQueue()
      }

      return true
    } catch (error) {
      console.error('Failed to send alert:', error)
      return false
    }
  }

  // Send security event alert
  async sendSecurityAlert(
    eventType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    description: string,
    metadata: Record<string, unknown> = {},
    userId?: string,
    ipAddress?: string
  ): Promise<void> {
    const alert: AlertPayload = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date().toISOString(),
      severity,
      title: `Security Alert: ${eventType}`,
      description,
      metadata: {
        ...metadata,
        eventType,
        userId,
        ipAddress
      },
      source: 'subscription_security',
      actionRequired: severity === 'critical' || severity === 'high',
      affectedUsers: userId ? [userId] : undefined,
      affectedIPs: ipAddress ? [ipAddress] : undefined
    }

    await this.sendAlert(alert)
  }

  // Send system health alert
  async sendSystemAlert(
    title: string,
    description: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    const alert: AlertPayload = {
      id: `system_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date().toISOString(),
      severity,
      title,
      description,
      metadata,
      source: 'system_health',
      actionRequired: severity === 'critical'
    }

    await this.sendAlert(alert)
  }

  // Process alert queue
  private async processAlertQueue(): Promise<void> {
    if (this.isProcessing || this.alertQueue.length === 0) {
      return
    }

    this.isProcessing = true

    try {
      while (this.alertQueue.length > 0) {
        const alert = this.alertQueue.shift()!
        await this.deliverAlert(alert)

        // Small delay to prevent overwhelming external services
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    } catch (error) {
      console.error('Error processing alert queue:', error)
    } finally {
      this.isProcessing = false
    }
  }

  // Deliver alert to configured channels
  private async deliverAlert(alert: AlertPayload): Promise<void> {
    const deliveryPromises: Promise<void>[] = []

    if (this.config.enabledChannels.includes('webhook') && this.config.webhookUrl) {
      deliveryPromises.push(this.sendWebhook(alert))
    }

    if (this.config.enabledChannels.includes('slack') && this.config.slackWebhook) {
      deliveryPromises.push(this.sendSlackAlert(alert))
    }

    if (this.config.enabledChannels.includes('discord') && this.config.discordWebhook) {
      deliveryPromises.push(this.sendDiscordAlert(alert))
    }

    if (this.config.enabledChannels.includes('email') && this.config.emailEndpoint) {
      deliveryPromises.push(this.sendEmailAlert(alert))
    }

    // Wait for all deliveries to complete
    await Promise.allSettled(deliveryPromises)
  }

  // Send webhook alert
  private async sendWebhook(alert: AlertPayload): Promise<void> {
    try {
      const response = await fetch(this.config.webhookUrl!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mtaani-Security-Alert/1.0'
        },
        body: JSON.stringify(alert)
      })

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status}`)
      }

      console.log(`✅ Webhook alert sent: ${alert.id}`)
    } catch (error) {
      console.error('Webhook delivery failed:', error)
    }
  }

  // Send Slack alert
  private async sendSlackAlert(alert: AlertPayload): Promise<void> {
    try {
      const color = {
        low: '#36a64f',
        medium: '#ff9500',
        high: '#ff6b35',
        critical: '#ff0000'
      }[alert.severity]

      const slackPayload = {
        text: `🚨 ${alert.title}`,
        attachments: [{
          color,
          fields: [
            {
              title: 'Severity',
              value: alert.severity.toUpperCase(),
              short: true
            },
            {
              title: 'Source',
              value: alert.source,
              short: true
            },
            {
              title: 'Description',
              value: alert.description,
              short: false
            },
            {
              title: 'Timestamp',
              value: alert.timestamp,
              short: true
            },
            {
              title: 'Action Required',
              value: alert.actionRequired ? 'Yes' : 'No',
              short: true
            }
          ],
          footer: 'Mtaani Security System',
          ts: Math.floor(new Date(alert.timestamp).getTime() / 1000)
        }]
      }

      const response = await fetch(this.config.slackWebhook!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackPayload)
      })

      if (!response.ok) {
        throw new Error(`Slack webhook failed: ${response.status}`)
      }

      console.log(`✅ Slack alert sent: ${alert.id}`)
    } catch (error) {
      console.error('Slack delivery failed:', error)
    }
  }

  // Send Discord alert
  private async sendDiscordAlert(alert: AlertPayload): Promise<void> {
    try {
      const color = {
        low: 0x36a64f,
        medium: 0xff9500,
        high: 0xff6b35,
        critical: 0xff0000
      }[alert.severity]

      const discordPayload = {
        embeds: [{
          title: `🚨 ${alert.title}`,
          description: alert.description,
          color,
          fields: [
            {
              name: 'Severity',
              value: alert.severity.toUpperCase(),
              inline: true
            },
            {
              name: 'Source',
              value: alert.source,
              inline: true
            },
            {
              name: 'Action Required',
              value: alert.actionRequired ? 'Yes' : 'No',
              inline: true
            }
          ],
          timestamp: alert.timestamp,
          footer: {
            text: 'Mtaani Security System'
          }
        }]
      }

      const response = await fetch(this.config.discordWebhook!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discordPayload)
      })

      if (!response.ok) {
        throw new Error(`Discord webhook failed: ${response.status}`)
      }

      console.log(`✅ Discord alert sent: ${alert.id}`)
    } catch (error) {
      console.error('Discord delivery failed:', error)
    }
  }

  // Send email alert
  private async sendEmailAlert(alert: AlertPayload): Promise<void> {
    try {
      const emailPayload = {
        to: 'security@mtaani.com', // Configure as needed
        subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
        html: `
          <h2>${alert.title}</h2>
          <p><strong>Severity:</strong> ${alert.severity.toUpperCase()}</p>
          <p><strong>Description:</strong> ${alert.description}</p>
          <p><strong>Timestamp:</strong> ${alert.timestamp}</p>
          <p><strong>Action Required:</strong> ${alert.actionRequired ? 'Yes' : 'No'}</p>
          ${alert.affectedUsers ? `<p><strong>Affected Users:</strong> ${alert.affectedUsers.join(', ')}</p>` : ''}
          ${alert.affectedIPs ? `<p><strong>Affected IPs:</strong> ${alert.affectedIPs.join(', ')}</p>` : ''}
          <hr>
          <p><em>Mtaani Security System</em></p>
        `
      }

      const response = await fetch(this.config.emailEndpoint!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailPayload)
      })

      if (!response.ok) {
        throw new Error(`Email delivery failed: ${response.status}`)
      }

      console.log(`✅ Email alert sent: ${alert.id}`)
    } catch (error) {
      console.error('Email delivery failed:', error)
    }
  }

  // Rate limiting
  private isRateLimited(severity: string): boolean {
    const now = Date.now()
    const key = `alert_${severity}`
    const limit = this.rateLimits.get(key) || { count: 0, lastReset: now }

    // Reset counter every hour
    if (now - limit.lastReset > 60 * 60 * 1000) {
      limit.count = 0
      limit.lastReset = now
    }

    limit.count++
    this.rateLimits.set(key, limit)

    // Check thresholds
    const threshold = this.config.alertThresholds[severity as keyof typeof this.config.alertThresholds] || 10
    return limit.count > threshold * 10 // Allow 10x threshold per hour
  }

  // Update configuration
  updateConfig(newConfig: Partial<AlertConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  // Get alert statistics
  getStats(): {
    queueLength: number
    isProcessing: boolean
    rateLimits: Record<string, number>
  } {
    return {
      queueLength: this.alertQueue.length,
      isProcessing: this.isProcessing,
      rateLimits: Object.fromEntries(
        Array.from(this.rateLimits.entries()).map(([key, value]) => [key, value.count])
      )
    }
  }
}

// Export singleton instance
export const alertSystem = AlertSystem.getInstance({
  enabledChannels: ['webhook', 'slack'],
  webhookUrl: process.env.SECURITY_WEBHOOK_URL,
  slackWebhook: process.env.SLACK_WEBHOOK_URL,
  discordWebhook: process.env.DISCORD_WEBHOOK_URL,
  emailEndpoint: process.env.EMAIL_API_ENDPOINT
})
