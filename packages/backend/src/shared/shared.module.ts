import { Global, Module } from '@nestjs/common';
import { InMemoryDbService } from './in-memory-db.service';
import { AuditLogService } from './services/audit-log.service';
import { EncryptionService } from './services/encryption.service';
import { MonitoringService } from './services/monitoring.service';

/**
 * Shared Module - Available globally to all other modules
 * Provides security and monitoring services
 */
@Global()
@Module({
  providers: [InMemoryDbService, AuditLogService, EncryptionService, MonitoringService],
  exports: [InMemoryDbService, AuditLogService, EncryptionService, MonitoringService],
})
export class SharedModule {}
