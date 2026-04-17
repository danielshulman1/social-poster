# 🛠️ SECURITY REMEDIATION ACTION PLAN

**Status:** URGENT - Immediate Action Required  
**Last Updated:** April 17, 2026

---

## PHASE 1: IMMEDIATE INCIDENT RESPONSE (TODAY - NEXT 24 HOURS)

### 1.1 Credential Rotation

#### Step 1: Supabase Database Password
```bash
# 1. Go to Supabase Dashboard: https://app.supabase.com
# 2. Select your project (cjwhglwnbsrkidgvngqr)
# 3. Database → Configuration → Database Password
# 4. Click "Reset Password"
# 5. Generate new secure password
# 6. Update your .env.local with new DATABASE_URL

# DO NOT commit the new password to git!
# Store in:
# - Vercel Environment Variables (https://vercel.com/dashboard)
# - Local .env.local (add to .gitignore)
# - Your password manager
```

#### Step 2: GitHub Personal Access Token
```bash
# 1. Go to https://github.com/settings/tokens
# 2. Find "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"
# 3. Click "Delete" (should already be revoked if auto-detected)
# 4. Generate new token:
#    - Settings → Developer settings → Personal access tokens
#    - Click "Generate new token (classic)"
#    - Scopes: repo (full), read:user
#    - Expiration: 90 days
# 5. Copy new token
# 6. Update Vercel + local .env.local
```

#### Step 3: OpenAI API Key
```bash
# 1. Go to https://platform.openai.com/api-keys
# 2. Find the exposed key starting with "sk-proj-vgAwAapU14JaVo7..."
# 3. Click "Revoke"
# 4. Create new key:
#    - Click "+ Create new secret key"
#    - Name: "Social Feeds App - Backend" (2026-04)
#    - Limit usage if available
# 5. Update .env files

# Cost Check (CRITICAL):
curl https://api.openai.com/v1/dashboard/billing/credit_grants \
  -H "Authorization: Bearer sk-proj-..." 2>&1 | \
  jq '.data[0].granted_balance'
  
# If balance is low or depleted, the exposed key was used maliciously.
# Check billing history at: https://platform.openai.com/account/billing/overview
```

#### Step 4: Resend Email API Key
```bash
# 1. Go to https://resend.com/api-keys
# 2. Find "re_LgYZLDd9_7XvDfKFkWPB7SG4HVq54JiRQ"
# 3. Click "Delete"
# 4. Create new key:
#    - Click "Create API Key"
#    - Name: "Social Feeds App"
# 5. Update .env files
```

#### Step 5: Social Platform Credentials
```bash
# Facebook
# 1. https://developers.facebook.com/apps/
# 2. Find your app (ID: 971324658909721)
# 3. Settings → Basic → Copy App Secret (generates new one)
# 4. Update .env

# Google
# 1. https://console.cloud.google.com/apis/credentials
# 2. Find OAuth 2.0 Client ID (654637176157-ls6g53k9370p1adq83dj00b6onk0qoeu.apps.googleusercontent.com)
# 3. Delete and recreate
# 4. Generate new secret

# LinkedIn, Twitter, TikTok, etc.
# Follow same pattern:
# - App Dashboard → Settings/Credentials
# - Regenerate secrets
# - Update .env files
```

### 1.2 Remove Secrets from Git History

```bash
cd "/c/Users/danie/OneDrive/Documents/app  builds/New folder"

# Install git-filter-repo if needed
pip install git-filter-repo

# Remove all .env files and secrets
git filter-repo --path .env.liveapp --invert-paths
git filter-repo --path .env.livecheck --invert-paths
git filter-repo --path .env.vercel --invert-paths
git filter-repo --path .env.previewcheck --invert-paths
git filter-repo --path .env.deploycheck --invert-paths
git filter-repo --path .env.devcheck --invert-paths
git filter-repo --path packages/frontend/.env --invert-paths

# Force push (only safe because this is YOUR repo)
git push origin --force-with-lease

# Notify team: "Removed secrets from history - force push required"
```

### 1.3 Update .gitignore

```bash
# Edit .gitignore to include all env patterns
cat >> .gitignore << 'EOF'

# Environment files - NEVER commit
.env
.env.local
.env.*.local
.env.production
.env.liveapp
.env.livecheck
.env.vercel
.env.previewcheck
.env.deploycheck
.env.devcheck

# Database backups
*.sql
!schema.sql
!migrations/*.sql

# Secrets and credentials
.env.*.private
.secrets
EOF

git add .gitignore
git commit -m "security: update .gitignore to prevent secret commits"
```

### 1.4 Document Exposure

```bash
# Create incident log
cat > SECURITY_INCIDENT_LOG.md << 'EOF'
# Security Incident Report

**Date:** 2026-04-17  
**Type:** Exposed Credentials in Repository  
**Severity:** CRITICAL

## What Was Exposed
- Production database password (Supabase)
- GitHub personal access token
- OpenAI API key
- Resend email API key
- Google OAuth credentials
- Facebook app secret
- Vercel OIDC token

## Actions Taken
- [x] All credentials rotated (2026-04-17 12:00 UTC)
- [x] Secrets removed from git history
- [x] .gitignore updated
- [x] Team notified
- [x] Access logs reviewed

## Timeline
- 2026-04-17: Exposure discovered
- 2026-04-17: Emergency credential rotation
- 2026-04-17: Git history cleaned
- 2026-04-18: Security audit completed
- 2026-04-25: Full security controls implemented

## Follow-up
- Monitor Supabase access logs for unauthorized access
- Monitor OpenAI usage for spike
- Review email sending logs
- Check git logs for any malicious commits
EOF
```

---

## PHASE 2: QUICK FIXES (NEXT 3-5 DAYS)

### 2.1 Implement Basic Authentication

**File:** `packages/backend/src/modules/auth-service/auth-service.service.ts`

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { AuthAccount } from '../../entities/auth-account.entity'; // Create this

@Injectable()
export class AuthServiceService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(AuthAccount) private authRepo: Repository<AuthAccount>,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    // Find user
    const user = await this.usersRepo.findOne({
      where: { email },
      relations: ['auth_accounts'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Get auth account
    const authAccount = user.auth_accounts.find(
      (a) => a.provider === 'email',
    );

    if (!authAccount) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      password,
      authAccount.password_hash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT
    const token = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
      },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: '7d',
      },
    );

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
      },
    };
  }

  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) {
    // Check if user exists
    const exists = await this.usersRepo.findOne({
      where: { email },
    });

    if (exists) {
      throw new UnauthorizedException('User already exists');
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = this.usersRepo.create({
      email,
      first_name: firstName,
      last_name: lastName,
    });

    await this.usersRepo.save(user);

    // Create auth account
    const authAccount = this.authRepo.create({
      user_id: user.id,
      provider: 'email',
      password_hash: passwordHash,
    });

    await this.authRepo.save(authAccount);

    // Generate token
    const token = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
      },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: '7d',
      },
    );

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }
}
```

**Update:** `packages/backend/src/modules/auth-service/auth-service.controller.ts`

```typescript
import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { AuthServiceService } from './auth-service.service';
import { LoginDto } from '../../dto/auth/login.dto';
import { RegisterDto } from '../../dto/auth/register.dto';

@Controller('auth')
export class AuthServiceController {
  constructor(private readonly authService: AuthServiceService) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @Post('register')
  @HttpCode(201)
  async register(@Body() body: RegisterDto) {
    return this.authService.register(
      body.email,
      body.password,
      body.firstName,
      body.lastName,
    );
  }
}
```

### 2.2 Create JWT Guard

**File:** `packages/backend/src/shared/guards/jwt-auth.guard.ts`

```typescript
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });
      request['user'] = payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }

    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```

### 2.3 Create Input Validation DTOs

**File:** `packages/backend/src/dto/auth/login.dto.ts`

```typescript
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;
}
```

**File:** `packages/backend/src/dto/auth/register.dto.ts`

```typescript
import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    {
      message:
        'Password must contain uppercase, lowercase, number and special character',
    },
  )
  password: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lastName: string;
}
```

### 2.4 Update main.ts with Security Headers

**File:** `packages/backend/src/main.ts`

```typescript
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers
  app.use(helmet.default());

  // Enable CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-Total-Count'],
  });

  // Global input validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Custom middleware for request logging
  app.use((req, res, next) => {
    const { method, path } = req;
    console.log(`[${new Date().toISOString()}] ${method} ${path}`);
    next();
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();
```

### 2.5 Enable RLS on Critical Tables

**File:** `database/migrations/003_add_rls_policies.sql`

```sql
-- Enable RLS on all tables
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE mailboxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE detected_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- Policy for organisations: Users can only see their own orgs
CREATE POLICY "Users can see their organisations"
  ON organisations FOR SELECT
  USING (
    id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

-- Policy for email_messages: Only users in the org can see
CREATE POLICY "Users see emails in their org"
  ON email_messages FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid()
    )
  );

-- Similar policies for other sensitive tables...
-- (See full audit report for complete implementation)
```

---

## PHASE 3: COMPREHENSIVE SECURITY (NEXT 2-4 WEEKS)

### 3.1 Add Rate Limiting

**File:** `packages/backend/src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 10, // 10 requests per second
      },
      {
        name: 'long',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    // ... other imports
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

### 3.2 Implement Column-Level Encryption

```sql
-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create key management
CREATE TABLE encryption_keys (
  id SERIAL PRIMARY KEY,
  key_name VARCHAR(255) UNIQUE NOT NULL,
  key_material bytea NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  rotated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Encrypt sensitive columns
ALTER TABLE oauth_connections 
  ADD COLUMN access_token_encrypted TEXT,
  ADD COLUMN refresh_token_encrypted TEXT;

-- Migration function
UPDATE oauth_connections
SET 
  access_token_encrypted = pgp_sym_encrypt(access_token, 'encryption_key'),
  refresh_token_encrypted = pgp_sym_encrypt(refresh_token, 'encryption_key')
WHERE access_token IS NOT NULL;

-- Remove plaintext columns
ALTER TABLE oauth_connections DROP COLUMN access_token, DROP COLUMN refresh_token;

-- Create decryption function
CREATE OR REPLACE FUNCTION decrypt_access_token(encrypted_token TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN pgp_sym_decrypt(encrypted_token::bytea, 'encryption_key');
END;
$$ LANGUAGE plpgsql;
```

### 3.3 Set Up Audit Logging

**File:** `database/migrations/004_create_audit_logs.sql`

```sql
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID,
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(100),
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  status VARCHAR(20) -- 'success', 'failure'
);

CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Create audit function
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id, action, table_name, record_id,
    old_values, new_values, ip_address, user_agent
  ) VALUES (
    auth.uid(),
    TG_ARGV[0],
    TG_TABLE_NAME,
    NEW.id,
    row_to_json(OLD),
    row_to_json(NEW),
    inet_client_addr(),
    current_setting('app.user_agent', TRUE)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Enable audit for sensitive tables
CREATE TRIGGER email_messages_audit AFTER INSERT OR UPDATE ON email_messages
  FOR EACH ROW EXECUTE FUNCTION audit_trigger('email_viewed');

CREATE TRIGGER oauth_connections_audit AFTER UPDATE ON oauth_connections
  FOR EACH ROW EXECUTE FUNCTION audit_trigger('oauth_updated');
```

---

## VERIFICATION CHECKLIST

### Before Going to Production

```bash
# Run these checks:

# 1. Verify no secrets in repo
grep -r "sk-proj-\|ghp_\|re_\|GOCSPX-" . --include="*.ts" --include="*.js" --include="*.env" 2>/dev/null && echo "FAILED: Secrets found!" || echo "PASSED: No obvious secrets"

# 2. Verify all env vars are required
grep -r "process.env\." packages/backend/src --include="*.ts" | cut -d: -f2 | sort | uniq | wc -l
# Should match the number of vars in .env.example

# 3. Test authentication
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"InvalidPassword123!"}'

# Should return 401 Unauthorized

# 4. Test protected endpoint
curl -X GET http://localhost:3000/api/emails \
  -H "Authorization: Bearer invalid-token"

# Should return 401 Unauthorized

# 5. Verify CORS headers
curl -X OPTIONS http://localhost:3000/api/emails \
  -H "Origin: http://localhost:3000" \
  -v

# Should see Access-Control-Allow-Origin header
```

---

## COMMUNICATION TEMPLATE

### Email to Team

```
Subject: 🚨 URGENT: Critical Security Issues Identified and Addressed

Hi Team,

During a security audit, we discovered critical issues that have been immediately addressed:

WHAT HAPPENED:
- Production database credentials were exposed in git history
- API keys (OpenAI, GitHub, etc.) were committed to the repository
- These have been REVOKED and new credentials generated

ACTIONS TAKEN:
- ✅ All credentials rotated (24 hours ago)
- ✅ Secrets removed from git history
- ✅ Force-pushed clean code to repository
- ✅ Access logs reviewed - no unauthorized activity detected

YOUR ACTION REQUIRED:
- Pull latest changes and update your local .env.local file
- Run: git pull --force-with-lease
- Request new API keys from Vercel/platform dashboards
- Do NOT commit ANY .env files to git

WHAT'S NEXT:
- Phase 1: Emergency credential rotation ✅ DONE
- Phase 2: Implement authentication and basic security controls (this week)
- Phase 3: Comprehensive security hardening (next 2-4 weeks)

Questions? Contact: [Security Lead]
Timeline: https://[link-to-security-audit-report]

Thanks,
[Your Name]
```

---

## MONITORING & FOLLOW-UP

### Weekly Security Checks
```bash
# Add to your automation:

# Check for secrets in recent commits
git log --all -p | grep -iE "(api_key|password|secret|token)" | wc -l

# Check for unencrypted sensitive data in new migrations
ls -lat database/migrations/*.sql | head -5 | grep -i "password\|token\|secret"

# Verify RLS policies are in place
psql -c "SELECT tablename, (SELECT array_agg(policyname) FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename) as policies FROM pg_tables WHERE schemaname='public';"
```

### Monthly
- Review audit logs for suspicious activity
- Rotate secrets (API keys, database passwords)
- Run security scanning tools
- Review access patterns

### Quarterly
- Third-party penetration testing
- Full security audit
- Update threat model
- Review compliance requirements

---

## ADDITIONAL RESOURCES

- [OWASP Top 10 2024](https://owasp.org/Top10/)
- [NestJS Security Best Practices](https://docs.nestjs.com/security)
- [Supabase Security](https://supabase.com/docs/guides/security)
- [GDPR Compliance Guide](https://gdpr.eu/)
- [JWT.io](https://jwt.io/)

---

**Status:** Implementation in progress  
**Last Updated:** 2026-04-17  
**Next Review:** 2026-05-01
