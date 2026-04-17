import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationEntity } from '../entities/organization.entity';
import { UserEntity } from '../entities/user.entity';
import { MailboxEntity } from '../entities/mailbox.entity';
import { EmailThreadEntity } from '../entities/email-thread.entity';
import { EmailMessageEntity } from '../entities/email-message.entity';
import { DetectedTaskEntity } from '../entities/detected-task.entity';
import { WorkflowRunEntity } from '../entities/workflow-run.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const isProduction = process.env.NODE_ENV === 'production';
        return {
          type: 'postgres',
          url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/autm',
          entities: [
            OrganizationEntity,
            UserEntity,
            MailboxEntity,
            EmailThreadEntity,
            EmailMessageEntity,
            DetectedTaskEntity,
            WorkflowRunEntity,
          ],
          synchronize: false, // use migrations
          logging: false,
          ssl: isProduction
            ? { rejectUnauthorized: true }
            : { rejectUnauthorized: false }, // Allow self-signed certs in dev
          extra: {
            ssl: !isProduction,
          },
        };
      },
    }),
  ],
})
export class DatabaseModule {}
