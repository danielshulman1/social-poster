import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const buildPrismaDatabaseUrl = () => {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) return undefined;

    try {
        const url = new URL(databaseUrl);

        // In serverless environments each function gets its own Prisma pool.
        // Default Prisma pool sizing is too aggressive for small Supabase session pools.
        if (!url.searchParams.has('connection_limit')) {
            url.searchParams.set('connection_limit', '1');
        }

        if (!url.searchParams.has('pool_timeout')) {
            url.searchParams.set('pool_timeout', '20');
        }

        return url.toString();
    } catch {
        return databaseUrl;
    }
};

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        datasources: {
            db: {
                url: buildPrismaDatabaseUrl(),
            },
        },
        log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
