# ⚡ QUICK REFERENCE - SECURITY IMPLEMENTATION CHECKLIST

## PHASE 1: EMERGENCY RESPONSE (24 Hours) 🚨

### Credentials Rotation
- [ ] **Supabase Database Password**
  - Go to: https://app.supabase.com → Project → Database → Reset Password
  - Store new URL in: Vercel + local .env.local (NOT git)
  - Document new credentials securely

- [ ] **GitHub Token (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)**
  - Go to: https://github.com/settings/tokens
  - Click Delete on exposed token
  - Create new token with repo scope
  - Update Vercel + local .env.local

- [ ] **OpenAI API Key (sk-proj-vgAwAapU14...)**
  - Go to: https://platform.openai.com/api-keys
  - Revoke exposed key
  - Create new key
  - Check usage spike at: https://platform.openai.com/account/billing/overview
  - Update .env files

- [ ] **Resend Email API Key (re_LgYZLDd9_7Xv...)**
  - Go to: https://resend.com/api-keys
  - Delete exposed key
  - Create new key
  - Update .env files

- [ ] **Google OAuth Credentials (654637176157-...)**
  - Go to: https://console.cloud.google.com/apis/credentials
  - Delete and recreate OAuth 2.0 Client ID
  - Update .env files

- [ ] **Facebook/Instagram Credentials (App ID: 971324658909721)**
  - Go to: https://developers.facebook.com/apps/
  - Settings → Basic → Generate new App Secret
  - Update .env files

- [ ] **LinkedIn, Twitter, TikTok, Pinterest, YouTube**
  - Follow same pattern: Dashboard → Regenerate credentials → Update .env

### Git History Cleanup
- [ ] Install git-filter-repo: `pip install git-filter-repo`
- [ ] Remove `.env.liveapp`: `git filter-repo --path .env.liveapp --invert-paths`
- [ ] Remove `.env.livecheck`: `git filter-repo --path .env.livecheck --invert-paths`
- [ ] Remove `.env.vercel`: `git filter-repo --path .env.vercel --invert-paths`
- [ ] Remove `packages/frontend/.env`: `git filter-repo --path packages/frontend/.env --invert-paths`
- [ ] Force push: `git push origin --force-with-lease`
- [ ] Notify team: "Force push required - cleaned secrets from history"

### .gitignore Update
- [ ] Edit `.gitignore` and add:
  ```
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
  ```
- [ ] Commit: `git add .gitignore && git commit -m "security: prevent env file commits"`

### Access Log Review
- [ ] Supabase: Check unauthorized access attempts
  - Go to: Project → Logs → Realtime
  - Search for suspicious queries
- [ ] OpenAI: Check for unusual API usage
  - Go to: https://platform.openai.com/account/usage/overview
  - Document any unexpected usage
- [ ] GitHub: Check for unauthorized commits
  - Go to: Repository → Insights → Network
  - Look for suspicious commits/branches
- [ ] Vercel: Check deployment history
  - Go to: Project → Deployments
  - Look for unexpected deployments

### Documentation
- [ ] Create SECURITY_INCIDENT_LOG.md with timeline and actions
- [ ] Document all rotated credentials securely
- [ ] Share incident summary with team
- [ ] Plan follow-up security meeting

**⏱️ Time: 3-4 hours | Status: [  ] Not Started [ ✓] Complete**

---

## PHASE 2: BASIC SECURITY (3-5 Days) ⚙️

### Authentication Implementation

**File: `packages/backend/src/modules/auth-service/auth-service.service.ts`**
- [ ] Import bcrypt, JwtService
- [ ] Implement login with password verification
- [ ] Implement register with password hashing
- [ ] Generate proper JWT tokens
- [ ] Add error handling

**File: `packages/backend/src/modules/auth-service/auth-service.controller.ts`**
- [ ] Create LoginDto
- [ ] Create RegisterDto  
- [ ] Add @Post('login') endpoint
- [ ] Add @Post('register') endpoint

**File: `packages/backend/src/shared/guards/jwt-auth.guard.ts`**
- [ ] Create JwtAuthGuard
- [ ] Extract token from Authorization header
- [ ] Verify JWT signature
- [ ] Attach user to request

### Input Validation

**File: `packages/backend/src/dto/auth/login.dto.ts`**
- [ ] Add @IsEmail() decorator
- [ ] Add @MinLength(8) for password
- [ ] Add @MaxLength(100) for password

**File: `packages/backend/src/dto/auth/register.dto.ts`**
- [ ] Add email validation
- [ ] Add password requirements (uppercase, lowercase, number, special char)
- [ ] Add name length constraints

**File: `packages/backend/src/main.ts`**
- [ ] Add ValidationPipe to global pipes
- [ ] Set whitelist: true
- [ ] Set forbidNonWhitelisted: true

### Protected Endpoints

- [ ] Add @UseGuards(JwtAuthGuard) to protected controllers
- [ ] Test with valid JWT token ✓
- [ ] Test with invalid token ✗ (should be 401)
- [ ] Test with no token ✗ (should be 401)

### Security Headers

**File: `packages/backend/src/main.ts`**
- [ ] Add helmet() middleware
- [ ] Add CORS configuration
- [ ] Set allowed origins from env var
- [ ] Allow credentials

### Row-Level Security (RLS)

**File: `database/migrations/003_add_rls_policies.sql`**
- [ ] Enable RLS on organisations
- [ ] Enable RLS on users
- [ ] Enable RLS on email_messages
- [ ] Enable RLS on email_threads
- [ ] Enable RLS on oauth_connections
- [ ] Enable RLS on mailboxes
- [ ] Enable RLS on email_drafts
- [ ] Create policies for each table

### Environment Variables

- [ ] Add JWT_SECRET to .env.example
- [ ] Add NODE_ENV to .env.example
- [ ] Add ALLOWED_ORIGINS to .env.example
- [ ] Add DATABASE_URL validation on startup
- [ ] Add error if required vars are missing

### Testing

- [ ] Test login with valid credentials ✓
- [ ] Test login with invalid credentials ✗
- [ ] Test registration ✓
- [ ] Test JWT token generation ✓
- [ ] Test protected endpoint with token ✓
- [ ] Test protected endpoint without token ✗
- [ ] Test CORS headers ✓
- [ ] Test input validation ✓

**⏱️ Time: 20-30 hours | Status: [  ] Not Started [  ] In Progress [ ✓] Complete**

---

## PHASE 3: COMPREHENSIVE SECURITY (2-4 Weeks) 🔐

### Column-Level Encryption

- [ ] Enable pgcrypto extension
- [ ] Create encryption_keys table
- [ ] Encrypt oauth_connections.access_token
- [ ] Encrypt oauth_connections.refresh_token
- [ ] Encrypt org_ai_settings.openai_api_key
- [ ] Encrypt org_ai_settings.anthropic_api_key
- [ ] Create decryption functions
- [ ] Test encryption/decryption

### Audit Logging

- [ ] Create audit_logs table
- [ ] Create audit trigger function
- [ ] Enable audit on sensitive tables:
  - [ ] email_messages
  - [ ] oauth_connections
  - [ ] org_members (permission changes)
  - [ ] org_ai_settings
  - [ ] user_tiers (subscription changes)
- [ ] Test audit logging
- [ ] Create audit log viewer API

### Rate Limiting

- [ ] Install @nestjs/throttler
- [ ] Add ThrottlerModule to AppModule
- [ ] Set rate limits: 10 req/sec, 100 req/min
- [ ] Apply ThrottlerGuard globally
- [ ] Custom rate limits for /auth/login (5 req/min)
- [ ] Test rate limiting

### Password Reset Flow

- [ ] Create reset token generation
- [ ] Create password reset endpoint
- [ ] Send reset email via Resend
- [ ] Validate reset token
- [ ] Update password with new hash
- [ ] Invalidate old sessions

### Email Verification

- [ ] Create verification token
- [ ] Send verification email on signup
- [ ] Create verify endpoint
- [ ] Prevent email-based login until verified
- [ ] Allow resend verification email

### Session Management

- [ ] Add refresh token generation
- [ ] Create refresh endpoint
- [ ] Add logout endpoint (token blacklist)
- [ ] Implement token expiration
- [ ] Set session timeout (7 days for access, 30 days for refresh)

### Secrets Management

- [ ] Set up AWS Secrets Manager OR Vault
- [ ] Migrate all secrets to managed service
- [ ] Update CI/CD to fetch secrets
- [ ] Remove hardcoded secrets
- [ ] Implement key rotation schedule

### Monitoring

- [ ] Set up Sentry for error tracking
- [ ] Add security event logging
- [ ] Create alerts for:
  - [ ] Failed login attempts (5+ in 10 min)
  - [ ] Unauthorized API access
  - [ ] Large data exports
  - [ ] Permission changes
  - [ ] Failed database connections

### Compliance

- [ ] Implement GDPR right-to-be-forgotten
- [ ] Add data export functionality
- [ ] Create privacy policy
- [ ] Implement consent tracking
- [ ] Create terms of service
- [ ] Add PII masking in logs

### Documentation

- [ ] Write security architecture document
- [ ] Create security runbook
- [ ] Document incident response procedures
- [ ] Create security best practices guide
- [ ] Update API documentation with security requirements

### Testing & Verification

- [ ] Penetration testing (recommended: hire professional)
- [ ] Security code review
- [ ] Vulnerability scanning
- [ ] Load testing with rate limiting
- [ ] Encryption/decryption verification
- [ ] Audit log verification

**⏱️ Time: 40-60 hours | Status: [  ] Not Started [  ] In Progress [ ✓] Complete**

---

## ONGOING SECURITY MAINTENANCE 🔄

### Daily
- [ ] Monitor error logs for security issues
- [ ] Review failed authentication attempts
- [ ] Check for unusual API usage

### Weekly
- [ ] Review security audit logs
- [ ] Check for new dependencies with vulnerabilities
- [ ] Review git history for accidental secrets
- [ ] Verify backup integrity

### Monthly
- [ ] Rotate API keys
- [ ] Review access logs
- [ ] Update security patches
- [ ] Test incident response procedures
- [ ] Security awareness update

### Quarterly
- [ ] Full security audit
- [ ] Penetration testing
- [ ] Vulnerability scanning
- [ ] Compliance review
- [ ] Update threat model

### Annually
- [ ] Third-party security assessment
- [ ] Full SOC 2 compliance audit
- [ ] Update security policies
- [ ] Training and certification

---

## VERIFICATION TESTS

### Authentication Tests
```bash
# Test invalid credentials
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong"}'
# Expected: 401 Unauthorized

# Test missing token
curl -X GET http://localhost:3000/api/emails
# Expected: 401 Unauthorized

# Test valid token
curl -X GET http://localhost:3000/api/emails \
  -H "Authorization: Bearer <valid_token>"
# Expected: 200 OK
```

### Security Headers Test
```bash
curl -I http://localhost:3000/api/emails
# Should show:
# - Strict-Transport-Security
# - X-Frame-Options
# - X-Content-Type-Options
# - Content-Security-Policy
```

### RLS Verification
```sql
-- User should only see their org's data
SELECT * FROM email_messages WHERE org_id != user_org_id;
-- Expected: 0 rows (RLS policy blocks)
```

### Encryption Verification
```sql
-- Encrypted data should be unreadable
SELECT access_token FROM oauth_connections LIMIT 1;
-- Expected: Binary/encrypted data, not readable text
```

---

## HELP & SUPPORT

**Need clarification?**
- See: SECURITY_AUDIT_REPORT.md (detailed findings)
- See: SECURITY_REMEDIATION_PLAN.md (implementation guide)
- See: Code examples in remediation plan

**Stuck on Phase X?**
- Ensure you completed all of Phase X-1 first
- Check verification tests section
- Review code examples provided

**Found a vulnerability?**
- Document it with date/time
- Add to security log
- Don't push to production
- Follow incident response plan

---

**Last Updated:** 2026-04-17  
**Next Review:** 2026-05-01  
**Status:** Ready to implement ✅
