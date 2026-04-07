async function main() {
    // Test Resend directly
    console.log('--- Testing Resend API directly ---');
    const { Resend } = require('resend');
    const resend = new Resend('re_LgYZLDd9_7XvDfKFkWPB7SG4HVq54JiRQ');
    
    const { data, error } = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: 'daniel.shulman@gmail.com',
        subject: 'Test - Resend working?',
        html: '<p>Direct Resend test. If you see this, Resend is working!</p>',
    });

    if (error) {
        console.error('❌ Resend API error:', JSON.stringify(error, null, 2));
        console.log('\nThis means Resend is blocking the email - likely because:');
        console.log('1. onboarding@resend.dev can only email the account owner address');
        console.log('2. You need to verify a custom domain in Resend dashboard');
    } else {
        console.log('✅ Resend email sent successfully! ID:', data?.id);
        console.log('Check your inbox at daniel.shulman@gmail.com');
    }
}

main().catch(console.error);
