const { PrismaClient } = require('@prisma/client');

// Use the live Supabase DB
process.env.DATABASE_URL = "postgresql://postgres.cjwhglwnbsrkidgvngqr:Dcdefe367e4e4.@aws-1-eu-north-1.pooler.supabase.com:5432/postgres?sslmode=require";

const prisma = new PrismaClient();

async function main() {
    try {
        // Check if resetToken columns exist in User table
        const result = await prisma.$queryRaw`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'User' AND column_name IN ('resetToken', 'resetTokenExpiry')
        `;
        console.log('resetToken columns in DB:', result);

        if (result.length === 0) {
            console.log('\n❌ resetToken columns DO NOT exist in the live database!');
            console.log('You need to run: npx prisma db push\n');
        } else {
            console.log('\n✅ resetToken columns exist in the live database');
            
            // Try a test update to make sure the operation works
            const users = await prisma.user.findMany({ take: 1, select: { id: true, email: true, resetToken: true } });
            console.log('Sample user:', users[0]);
        }
    } catch (err) {
        console.error('Error:', err.message);
        if (err.message.includes('resetToken')) {
            console.log('\n❌ The resetToken column does not exist in the database - needs migration!');
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
