const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

process.env.DATABASE_URL = "postgresql://postgres.cjwhglwnbsrkidgvngqr:Dcdefe367e4e4.@aws-1-eu-north-1.pooler.supabase.com:5432/postgres?sslmode=require";

const prisma = new PrismaClient();

async function main() {
    // Step 1: Call the live API and show full response
    const testEmail = 'daniel.shulman@gmail.com';

    console.log(`Testing forgot password API for: ${testEmail}`);
    
    try {
        const res = await fetch('https://socialposter.easy-ai.co.uk/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: testEmail }),
        });

        const text = await res.text();
        console.log('HTTP Status:', res.status);
        console.log('HTTP Headers:', Object.fromEntries(res.headers.entries()));
        console.log('Response body:', text);
    } catch (err) {
        console.error('Fetch error:', err.message);
    }

    // Step 2: Check the reset token that was stored (fresh one)
    await new Promise(r => setTimeout(r, 2000)); // wait a moment
    const user = await prisma.user.findFirst({ 
        where: { email: testEmail }, 
        select: { resetToken: true, resetTokenExpiry: true } 
    });
    console.log('\nReset token now in DB:', user);
    const now = new Date();
    console.log('Current time:', now.toISOString());
    console.log('Token valid?', user?.resetTokenExpiry && user.resetTokenExpiry > now ? '✅ YES' : '❌ NO (expired or missing)');

    // Step 3: Test Resend API directly
    console.log('\n--- Testing Resend API directly ---');
    try {
        const { Resend } = require('resend');
        const resend = new Resend('re_LgYZLDd9_7XvDfKFkWPB7SG4HVq54JiRQ');
        
        const { data, error } = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: testEmail,
            subject: 'Test - Password Reset Link',
            html: '<p>This is a test of the Resend integration. If you see this, Resend is working!</p>',
        });

        if (error) {
            console.error('❌ Resend API error:', JSON.stringify(error, null, 2));
        } else {
            console.log('✅ Resend email sent successfully! ID:', data?.id);
        }
    } catch (err) {
        console.error('❌ Resend threw exception:', err.message);
    }

    await prisma.$disconnect();
}

main().catch(console.error);
