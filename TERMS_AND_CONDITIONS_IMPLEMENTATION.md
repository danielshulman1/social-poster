# ✅ TERMS AND CONDITIONS - IMPLEMENTATION GUIDE

**Feature:** Mandatory T&C acceptance before account creation  
**Scope:** Database schema, backend service, frontend checkbox  
**Timeline:** 3-4 hours implementation

---

## 1. DATABASE SETUP

### 1.1 Run Migration

```bash
# File: database/migrations/add_terms_and_conditions.sql
psql -U postgres -h localhost ai_operations_platform < database/migrations/add_terms_and_conditions.sql
```

**What It Creates:**
- `terms_and_conditions` table - Stores T&C versions
- `user_tc_acceptance` table - Audit trail of who accepted what
- Updated `users` table with `tc_accepted` and `tc_accepted_at` columns
- Database functions for checking and accepting T&C
- Indexes for fast lookups

### 1.2 Database Schema Overview

```sql
-- Users must have these columns
ALTER TABLE users ADD COLUMN tc_accepted BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN tc_accepted_at TIMESTAMPTZ;

-- T&C versions are stored here
CREATE TABLE terms_and_conditions (
  id UUID PRIMARY KEY,
  version VARCHAR(50) UNIQUE,      -- e.g., "1.0.0", "1.1.0"
  title VARCHAR(255),
  content TEXT,                     -- Full T&C text (Markdown)
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  is_active BOOLEAN                 -- Only one version is active at a time
);

-- Audit trail of acceptances
CREATE TABLE user_tc_acceptance (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users,
  tc_id UUID REFERENCES terms_and_conditions,
  accepted_at TIMESTAMPTZ,
  ip_address INET,                  -- For audit/compliance
  user_agent TEXT,                  -- For audit/compliance
  UNIQUE(user_id, tc_id)            -- Each user accepts each version once
);
```

---

## 2. BACKEND IMPLEMENTATION

### 2.1 Create Terms Service

**File:** `packages/backend/src/modules/terms-service/terms-service.service.ts`

Already created with these methods:
- `getActiveTerms()` - Get current T&C
- `acceptTerms()` - Mark user as accepted
- `getMustAcceptTerms()` - Check if user needs to accept
- `getTermsByVersion()` - Get specific version
- `getUserAcceptanceHistory()` - Audit trail

### 2.2 Create Terms Controller

**File:** `packages/backend/src/modules/terms-service/terms-service.controller.ts`

Endpoints:
- `GET /terms` - Get current T&C (public)
- `GET /terms/:version` - Get specific version (public)
- `GET /terms/acceptance/status` - Check user status (protected)
- `POST /terms/acceptance/accept` - Accept T&C (protected)
- `GET /terms/acceptance/history` - View acceptance history (protected)

### 2.3 Create Terms Module

**File:** `packages/backend/src/modules/terms-service/terms-service.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TermsServiceController } from './terms-service.controller';
import { TermsServiceService } from './terms-service.service';
import { TermsAndConditions } from '../../entities/terms-and-conditions.entity';
import { UserTCAcceptance } from '../../entities/user-tc-acceptance.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TermsAndConditions, UserTCAcceptance])],
  controllers: [TermsServiceController],
  providers: [TermsServiceService],
  exports: [TermsServiceService],
})
export class TermsServiceModule {}
```

### 2.4 Update App Module

**File:** `packages/backend/src/app.module.ts`

```typescript
import { TermsServiceModule } from './modules/terms-service/terms-service.module';

@Module({
  imports: [
    // ... existing imports
    TermsServiceModule,
  ],
})
export class AppModule {}
```

### 2.5 Create TypeORM Entities

**File:** `packages/backend/src/entities/terms-and-conditions.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserTCAcceptance } from './user-tc-acceptance.entity';

@Entity('terms_and_conditions')
export class TermsAndConditions {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  version: string; // e.g., "1.0.0"

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  content: string; // Markdown format

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'boolean', default: false })
  is_active: boolean;

  @OneToMany(
    () => UserTCAcceptance,
    (acceptance) => acceptance.termsAndConditions,
  )
  acceptances: UserTCAcceptance[];
}
```

**File:** `packages/backend/src/entities/user-tc-acceptance.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { TermsAndConditions } from './terms-and-conditions.entity';

@Entity('user_tc_acceptance')
@Unique(['user', 'termsAndConditions'])
export class UserTCAcceptance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => TermsAndConditions)
  @JoinColumn({ name: 'tc_id' })
  termsAndConditions: TermsAndConditions;

  @CreateDateColumn()
  accepted_at: Date;

  @Column({ type: 'inet', nullable: true })
  ip_address: string;

  @Column({ type: 'varchar', nullable: true })
  user_agent: string;
}
```

---

## 3. UPDATE REGISTRATION FLOW

### 3.1 Registration DTO

**File:** `packages/backend/src/dto/auth/register.dto.ts`

```typescript
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsBoolean,
} from 'class-validator';

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
        'Password must contain uppercase, lowercase, number, and special character',
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

  @IsBoolean()
  acceptTerms: boolean; // NEW: Checkbox for T&C acceptance
}
```

### 3.2 Auth Service - Update Register Method

**File:** `packages/backend/src/modules/auth-service/auth-service.service.ts`

```typescript
async register(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  acceptTerms: boolean, // NEW parameter
) {
  // Check if user exists
  const exists = await this.usersRepo.findOne({
    where: { email },
  });

  if (exists) {
    throw new UnauthorizedException('User already exists');
  }

  // NEW: Verify T&C acceptance
  if (!acceptTerms) {
    throw new BadRequestException(
      'You must accept the Terms and Conditions to create an account',
    );
  }

  // Get active T&C
  const activeTerms = await this.termsService.getActiveTerms();
  if (!activeTerms) {
    throw new InternalServerErrorException(
      'Terms and Conditions not available',
    );
  }

  // Hash password
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Create user
  const user = this.usersRepo.create({
    email,
    first_name: firstName,
    last_name: lastName,
    tc_accepted: true, // NEW: Mark as accepted
    tc_accepted_at: new Date(), // NEW: Record timestamp
  });

  await this.usersRepo.save(user);

  // NEW: Create auth account
  const authAccount = this.authRepo.create({
    user_id: user.id,
    provider: 'email',
    password_hash: passwordHash,
  });

  await this.authRepo.save(authAccount);

  // NEW: Record T&C acceptance in audit trail
  await this.termsService.acceptTerms(
    user.id,
    activeTerms.id,
    // Optionally: req.ip, req.headers['user-agent']
  );

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
      tc_accepted: true,
    },
  };
}
```

---

## 4. FRONTEND IMPLEMENTATION

### 4.1 Registration Form Component

```typescript
// packages/frontend/components/auth/RegisterForm.tsx

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

interface RegisterFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  acceptTerms: boolean; // NEW: T&C checkbox
}

export function RegisterForm() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormData>({
    defaultValues: {
      acceptTerms: false,
    },
  });

  const acceptTerms = watch('acceptTerms');
  const [tcModal, setTcModal] = useState(false);

  const onSubmit = async (data: RegisterFormData) => {
    if (!data.acceptTerms) {
      alert('You must accept the Terms and Conditions');
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          acceptTerms: data.acceptTerms,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        // Store token and redirect
        localStorage.setItem('token', result.access_token);
        window.location.href = '/dashboard';
      } else {
        alert('Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Email */}
      <input
        type="email"
        placeholder="Email"
        {...register('email', { required: 'Email is required' })}
      />
      {errors.email && <span>{errors.email.message}</span>}

      {/* Password */}
      <input
        type="password"
        placeholder="Password (min 8 chars, uppercase, number, special char)"
        {...register('password', { required: 'Password is required' })}
      />
      {errors.password && <span>{errors.password.message}</span>}

      {/* First Name */}
      <input
        type="text"
        placeholder="First Name"
        {...register('firstName', { required: 'First name is required' })}
      />
      {errors.firstName && <span>{errors.firstName.message}</span>}

      {/* Last Name */}
      <input
        type="text"
        placeholder="Last Name"
        {...register('lastName', { required: 'Last name is required' })}
      />
      {errors.lastName && <span>{errors.lastName.message}</span>}

      {/* NEW: T&C Checkbox */}
      <div className="terms-acceptance">
        <label>
          <input
            type="checkbox"
            {...register('acceptTerms', {
              required: 'You must accept the Terms and Conditions',
            })}
          />
          I agree to the{' '}
          <button
            type="button"
            onClick={() => setTcModal(true)}
            className="link-button"
          >
            Terms and Conditions
          </button>
        </label>
        {errors.acceptTerms && <span>{errors.acceptTerms.message}</span>}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!acceptTerms}
        className={acceptTerms ? 'enabled' : 'disabled'}
      >
        Create Account
      </button>

      {/* T&C Modal */}
      {tcModal && (
        <TermsModal onClose={() => setTcModal(false)} />
      )}
    </form>
  );
}
```

### 4.2 Terms Modal Component

```typescript
// packages/frontend/components/TermsModal.tsx

import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

export function TermsModal({ onClose }: { onClose: () => void }) {
  const [terms, setTerms] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch current T&C from backend
    fetch('/api/terms')
      .then((res) => res.json())
      .then((data) => {
        setTerms(data.terms);
        setLoading(false);
      });
  }, []);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Terms and Conditions</h2>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="terms-content">
            {/* Render markdown content */}
            <ReactMarkdown>{terms?.content}</ReactMarkdown>
          </div>
        )}

        <div className="modal-actions">
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
```

---

## 5. COMPLIANCE & AUDIT

### 5.1 Audit Trail

The `user_tc_acceptance` table maintains a complete audit trail:
- Who accepted what (user_id, tc_id)
- When they accepted (accepted_at)
- From where they accepted (ip_address)
- What device/browser (user_agent)

**Query for audit:**
```sql
SELECT
  u.email,
  t.version,
  uta.accepted_at,
  uta.ip_address,
  uta.user_agent
FROM user_tc_acceptance uta
JOIN users u ON u.id = uta.user_id
JOIN terms_and_conditions t ON t.id = uta.tc_id
ORDER BY uta.accepted_at DESC;
```

### 5.2 GDPR Compliance

- Users MUST accept T&C before account creation ✅
- Acceptance is logged with timestamp ✅
- User can view their acceptance history via API ✅
- IP address and user agent logged for compliance ✅

---

## 6. UPDATING TERMS & CONDITIONS

### 6.1 When to Create a New Version

When terms change, create a new version. Don't update existing!

```sql
-- Deactivate old version
UPDATE terms_and_conditions SET is_active = false WHERE version = '1.0.0';

-- Create new version
INSERT INTO terms_and_conditions (version, title, content, is_active)
VALUES ('1.1.0', 'Terms and Conditions of Service', '<new content>', true);

-- Users with old version must accept new one before continuing
```

### 6.2 API Endpoint for Admin

```typescript
@Post('admin/create-version')
@UseGuards(AdminGuard) // Only admins
async createNewVersion(
  @Body() body: { version: string; title: string; content: string }
) {
  return await this.termsService.createNewVersion(
    body.version,
    body.title,
    body.content,
  );
}
```

---

## 7. TESTING CHECKLIST

### 7.1 Database Tests
- [ ] T&C tables created with correct schema
- [ ] Database functions work correctly
- [ ] Indexes exist and function properly
- [ ] Triggers update timestamps correctly

### 7.2 Backend Tests
- [ ] GET /terms returns active T&C
- [ ] GET /terms/:version returns specific version
- [ ] GET /terms/acceptance/status works with JWT
- [ ] POST /terms/acceptance/accept works
- [ ] Registration fails if acceptTerms is false
- [ ] Registration succeeds if acceptTerms is true
- [ ] Acceptance logged in user_tc_acceptance table

### 7.3 Frontend Tests
- [ ] T&C modal displays
- [ ] Checkbox required to enable submit button
- [ ] Submit button disabled until checkbox is checked
- [ ] Registration fails without checkbox
- [ ] Registration succeeds with checkbox
- [ ] T&C content displays correctly (Markdown rendering)

### 7.4 Audit Tests
- [ ] Acceptance logged with correct timestamp
- [ ] IP address captured
- [ ] User agent captured
- [ ] User's tc_accepted column updated
- [ ] Old version acceptance doesn't count as accepted for new version

---

## 8. IMPLEMENTATION STEPS

### Step 1: Database (15 minutes)
1. Run migration script
2. Verify tables created
3. Verify default T&C inserted

### Step 2: Backend (45 minutes)
1. Create entities
2. Create service
3. Create controller
4. Create module
5. Update AppModule
6. Update registration flow

### Step 3: Frontend (60 minutes)
1. Create RegisterForm component
2. Add T&C checkbox
3. Create TermsModal component
4. Add Markdown rendering
5. Test the flow

### Step 4: Testing (30 minutes)
1. Run database tests
2. Test API endpoints with Postman
3. Test registration flow
4. Verify audit trail

**Total Time: ~3 hours**

---

## 9. DEPLOYMENT CHECKLIST

- [ ] Migration applied to database
- [ ] Backend code deployed
- [ ] Frontend code deployed
- [ ] T&C content approved by legal
- [ ] Privacy policy updated
- [ ] Terms version 1.0.0 marked as active
- [ ] Registration flow tested in production
- [ ] Audit trail verified
- [ ] Monitoring set up for acceptance metrics

---

## 10. FAQ

**Q: Can users change their T&C acceptance?**  
A: No, once accepted, it's immutable. If terms change, they must accept the new version.

**Q: What if user doesn't accept?**  
A: Registration fails. They cannot create an account until they accept.

**Q: How do we handle users who created accounts before T&C feature?**  
A: Set all existing users' `tc_accepted = true` and `tc_accepted_at = NOW()` with migration.

**Q: How long to keep acceptance records?**  
A: Forever (or per your retention policy). Useful for legal/compliance.

**Q: Can we make T&C acceptance optional?**  
A: Not recommended for legal reasons. Keep it mandatory.

---

**Status:** Ready to implement ✅  
**Effort:** 3-4 hours  
**Priority:** High (must be done before production)
