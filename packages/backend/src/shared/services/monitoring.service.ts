import { Injectable, Logger } from '@nestjs/common';

/**
 * Monitoring Service - Phase 3
 * Tracks application metrics and alerts on suspicious patterns
 * Integrates with monitoring solutions (Datadog, New Relic, CloudWatch, etc.)
 */
@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);

  // In-memory metrics (in production, use proper monitoring service)
  private metrics = {
    loginAttempts: new Map<string, number>(),
    failedLogins: new Map<string, number>(),
    apiErrors: 0,
    authErrors: 0,
  };

  /**
   * Track login attempt
   * Detect brute force attacks
   */
  trackLoginAttempt(email: string, success: boolean) {
    const key = `login_${email}`;
    const count = (this.metrics.loginAttempts.get(key) || 0) + 1;
    this.metrics.loginAttempts.set(key, count);

    if (!success) {
      const failCount = (this.metrics.failedLogins.get(key) || 0) + 1;
      this.metrics.failedLogins.set(key, failCount);

      // Alert if too many failures
      if (failCount > 5) {
        this.logger.warn(
          `⚠️  ALERT: Possible brute force attack on ${email} (${failCount} failures)`,
        );
        // In production, send alert to security team
        // await this.alertService.send({
        //   type: 'brute_force_attempt',
        //   email,
        //   attempts: failCount,
        //   severity: 'high',
        // });
      }
    } else {
      // Reset on successful login
      this.metrics.failedLogins.delete(key);
    }

    // Clean up old entries (keep last 24 hours)
    if (count > 1000) {
      this.metrics.loginAttempts.delete(key);
      this.metrics.failedLogins.delete(key);
    }
  }

  /**
   * Track API error
   */
  trackError(type: 'api' | 'auth' | 'database') {
    if (type === 'auth') {
      this.metrics.authErrors++;
    } else {
      this.metrics.apiErrors++;
    }

    // Alert on error spike
    if (this.metrics.apiErrors > 100) {
      this.logger.error('🚨 ALERT: High error rate detected');
      // In production, send alert
    }
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      loginAttempts: this.metrics.loginAttempts.size,
      failedLogins: this.metrics.failedLogins.size,
      apiErrors: this.metrics.apiErrors,
      authErrors: this.metrics.authErrors,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Track suspicious geographic access
   * In production: compare user's typical location with current login location
   */
  trackGeographicAccess(userId: string, ipAddress: string, country?: string) {
    if (country) {
      this.logger.debug(`User ${userId} accessing from ${country} (IP: ${ipAddress})`);
      // In production, check against user's typical locations
      // and trigger MFA if suspicious
    }
  }

  /**
   * Track unusual API usage patterns
   */
  trackApiUsage(endpoint: string, userId: string, responseTime: number) {
    // In production, use time-series database (InfluxDB, Prometheus)
    // to track and alert on:
    // - Rapid API calls (possible automation attack)
    // - Slow endpoints (performance degradation)
    // - High error rates on specific endpoints

    if (responseTime > 5000) {
      this.logger.warn(
        `⚠️  Slow endpoint: ${endpoint} took ${responseTime}ms for user ${userId}`,
      );
    }
  }

  /**
   * Generate security report
   */
  generateSecurityReport() {
    const report = {
      generatedAt: new Date().toISOString(),
      metrics: this.getMetrics(),
      alerts: this.getActiveAlerts(),
      recommendations: this.getSecurityRecommendations(),
    };

    return report;
  }

  /**
   * Get active alerts (placeholder)
   */
  private getActiveAlerts() {
    const alerts = [];

    if (this.metrics.authErrors > 10) {
      alerts.push({
        severity: 'high',
        type: 'high_auth_error_rate',
        message: 'Unusual number of authentication errors detected',
      });
    }

    if (this.metrics.failedLogins.size > 20) {
      alerts.push({
        severity: 'high',
        type: 'multiple_brute_force_attempts',
        message: 'Multiple accounts under brute force attack',
      });
    }

    return alerts;
  }

  /**
   * Get security recommendations (placeholder)
   */
  private getSecurityRecommendations() {
    return [
      'Enable MFA for all user accounts',
      'Review and rotate encryption keys quarterly',
      'Monitor for suspicious geographic access patterns',
      'Implement IP whitelisting for admin accounts',
      'Enable audit logging for all sensitive operations',
    ];
  }
}
