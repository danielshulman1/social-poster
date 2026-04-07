# Database Migration Guide

## Running the Migration

After updating the schema with new social platform fields, run:

```bash
cd packages/social-feeds
npx prisma migrate dev --name add_social_platforms
```

This will:
1. ✅ Create a new migration file
2. ✅ Update your database schema
3. ✅ Regenerate Prisma client

---

## What Changed

The `User` model now includes fields for storing platform OAuth credentials:

```prisma
// New fields added to User model
twitterClientId      String?
twitterClientSecret  String?
tiktokClientId       String?
tiktokClientSecret   String?
youtubeClientId      String?
youtubeClientSecret  String?
pinterestClientId    String?
pinterestClientSecret String?
```

These fields are **optional** (`String?`) so:
- ✅ Users don't need to configure all platforms
- ✅ Database is backward compatible
- ✅ No data loss for existing users

---

## If Migration Fails

### PostgreSQL Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:** Start PostgreSQL
```bash
# macOS with Homebrew
brew services start postgresql

# Windows with WSL
sudo service postgresql start

# Docker
docker run -d -p 5432:5432 postgres:15
```

### Database URL Issue
```
Error: Can't reach database server
```

**Solution:** Check `.env.local`
```bash
# Should be a valid PostgreSQL URL
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
```

### Prisma Client Cache
```
Error: Prisma client not regenerated
```

**Solution:** Regenerate
```bash
npx prisma generate
```

---

## Verify Migration Worked

Check that new tables exist:

```bash
# Using PostgreSQL CLI
psql $DATABASE_URL

# List tables
\dt

# Check User table columns
\d "User"
```

You should see the new fields:
- `twitterClientId`
- `twitterClientSecret`
- `tiktokClientId`
- `tiktokClientSecret`
- `youtubeClientId`
- `youtubeClientSecret`
- `pinterestClientId`
- `pinterestClientSecret`

---

## Reverting Migration

If you need to revert (not recommended):

```bash
# Revert last migration
npx prisma migrate resolve --rolled-back

# Choose the migration name
# Or manually delete the migration file in:
# packages/social-feeds/prisma/migrations/
```

---

## Production Deployment

When deploying to production:

```bash
# 1. Review migration
cat packages/social-feeds/prisma/migrations/*/migration.sql

# 2. Test on staging first
cd packages/social-feeds
npx prisma migrate deploy

# 3. On production:
# Same command as staging
npx prisma migrate deploy
```

---

## Existing Data

✅ Your existing user data is **not affected**:
- All new fields are optional (`NULL` by default)
- No existing columns are modified
- No data is lost
- Users can migrate to OAuth at their own pace

---

## After Migration

1. ✅ Restart dev server: `npm run dev`
2. ✅ Update `.env.local` with new platform credentials
3. ✅ Deploy code (routes + UI) that uses new OAuth flows
4. ✅ Users can now connect to new platforms

---

## Troubleshooting

| Error | Solution |
|-------|----------|
| "P2002 Unique constraint failed" | Ignore—this shouldn't happen with new optional fields |
| Migration timeout | Increase timeout: `prisma migrate dev --timeout=60000` |
| Disk space full | Free up space before retrying |
| Connection pool exhausted | Increase `connection_limit` in DATABASE_URL |

---

## Questions?

Refer to [Prisma Migration Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate)
