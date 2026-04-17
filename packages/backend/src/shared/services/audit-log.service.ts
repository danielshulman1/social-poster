import { Injectable, Logger } from '@nestjs/common';
import { Request } from 'express';

/**
 * Audit Logging Service
 * Tracks sensitive operations for compliance and security
 */
@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  /**
   * Log authentication event
   */
  logAuthEvent(
    email: string,
    action: 'login_attempt' | 'login_success' | 'register' | 'logout' | 'password_reset',
    success: boolean,
    request?: Request,
    failureReason?: string,
  ) {
    const ipAddress = request?.ip || 'unknown';
    const userAgent = request?.get('user-agent') || 'unknown';

    const logMessage = `[AUTH] ${action} - Email: ${email} - Success: ${success} - IP: ${ipAddress}`;
    if (failureReason) {
      this.logger.warn(`${logMessage} - Reason: ${failureReason}`);
    } else {
      this.logger.log(logMessage);
    }

    // In production, save to audit_logs table
    // await this.auditLogRepository.save({
    //   action,
    //   email,
    //   success,
    //   ip_address: ipAddress,
    //   user_agent: userAgent,
    //   failure_reason: failureReason,
    //   timestamp: new Date(),
    // });
  }

  /**
   * Log data modification event
   */
  logDataModification(
    userId: string,
    tableName: string,
    recordId: string,
    action: 'create' | 'update' | 'delete',
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    request?: Request,
  ) {
    const ipAddress = request?.ip || 'unknown';
    const userAgent = request?.get('user-agent') || 'unknown';

    this.logger.log(
      `[DATA] ${action} - Table: ${tableName} - Record: ${recordId} - User: ${userId} - IP: ${ipAddress}`,
    );

    // In production, save to audit_logs table
    // await this.auditLogRepository.save({
    //   user_id: userId,
    //   table_name: tableName,
    //   record_id: recordId,
    //   action,
    //   old_values: oldValues,
    //   new_values: newValues,
    //   ip_address: ipAddress,
    //   user_agent: userAgent,
    //   status: 'success',
    //   timestamp: new Date(),
    // });
  }

  /**
   * Log suspicious activity for security monitoring
   */
  logSuspiciousActivity(
    userId: string,
    activityType: string,
    description: string,
    request?: Request,
  ) {
    const ipAddress = request?.ip || 'unknown';

    this.logger.warn(
      `[SUSPICIOUS] ${activityType} - User: ${userId} - Description: ${description} - IP: ${ipAddress}`,
    );

    // In production, could trigger alerts or automated responses
    // Examples:
    // - Rapid login failures → temporary account lock
    // - Unusual geographic access → MFA requirement
    // - Bulk data access → notify admins
  }

  /**
   * Log security event
   */
  logSecurityEvent(
    eventType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    description: string,
    metadata?: Record<string, any>,
  ) {
    const level =
      severity === 'critical'
        ? this.logger.error.bind(this.logger)
        : severity === 'high'
          ? this.logger.warn.bind(this.logger)
          : this.logger.log.bind(this.logger);

    level(`[SECURITY] ${eventType} (${severity.toUpperCase()}) - ${description}`);

    // In production, could integrate with SIEM
    // Send to security monitoring service for analysis
  }
}
