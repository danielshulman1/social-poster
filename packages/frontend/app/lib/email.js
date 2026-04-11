/**
 * Email Service
 * Handles sending emails via Supabase email or SendGrid
 */

/**
 * Send onboarding reset notification email
 */
export async function sendOnboardingResetEmail({
  email,
  adminName,
  reason,
}) {
  try {
    // Using Supabase built-in email (or swap with SendGrid if preferred)
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/send_email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        to: email,
        subject: 'Your Persona Has Been Reset',
        html: generateOnboardingResetEmailHTML(adminName, reason),
      }),
    });

    if (!response.ok) {
      // Fallback: use SendGrid if configured
      return await sendViaMailProvider(
        email,
        'Your Persona Has Been Reset',
        generateOnboardingResetEmailHTML(adminName, reason)
      );
    }

    console.log(`[sendOnboardingResetEmail] Email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('[sendOnboardingResetEmail] Error:', error.message);
    // Log error but don't throw - email failure shouldn't fail the operation
    return false;
  }
}

/**
 * Send onboarding complete email
 */
export async function sendOnboardingCompleteEmail({
  email,
  personaSummary,
}) {
  try {
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/send_email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        to: email,
        subject: '🎉 Your AI Persona is Ready!',
        html: generateOnboardingCompleteEmailHTML(personaSummary),
      }),
    });

    if (!response.ok) {
      return await sendViaMailProvider(
        email,
        '🎉 Your AI Persona is Ready!',
        generateOnboardingCompleteEmailHTML(personaSummary)
      );
    }

    console.log(`[sendOnboardingCompleteEmail] Email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('[sendOnboardingCompleteEmail] Error:', error.message);
    return false;
  }
}

/**
 * Send tier upgrade confirmation email
 */
export async function sendTierUpgradeEmail({
  email,
  tier,
  monthlyPrice,
  setupFee,
  nextBillingDate,
}) {
  try {
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/send_email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        to: email,
        subject: `Welcome to ${tier} Tier!`,
        html: generateTierUpgradeEmailHTML(tier, monthlyPrice, setupFee, nextBillingDate),
      }),
    });

    if (!response.ok) {
      return await sendViaMailProvider(
        email,
        `Welcome to ${tier} Tier!`,
        generateTierUpgradeEmailHTML(tier, monthlyPrice, setupFee, nextBillingDate)
      );
    }

    console.log(`[sendTierUpgradeEmail] Email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('[sendTierUpgradeEmail] Error:', error.message);
    return false;
  }
}

/**
 * Generic email sender using mail provider
 */
async function sendViaMailProvider(to, subject, html) {
  // If using SendGrid
  if (process.env.SENDGRID_API_KEY) {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    await sgMail.send({
      to,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@yourdomain.com',
      subject,
      html,
    });
  }
  // If using Nodemailer
  else if (process.env.SMTP_URL) {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport(process.env.SMTP_URL);

    await transporter.sendMail({
      to,
      from: process.env.SMTP_FROM || 'noreply@yourdomain.com',
      subject,
      html,
    });
  } else {
    console.warn('[sendViaMailProvider] No mail provider configured');
  }
}

/**
 * Email template: Onboarding reset notification
 */
function generateOnboardingResetEmailHTML(adminName, reason) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .content { line-height: 1.6; margin-bottom: 20px; }
        .button { background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
        .footer { font-size: 12px; color: #666; margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Your Persona Has Been Reset</h2>
        </div>

        <div class="content">
          <p>Hi there,</p>

          <p>Your AI persona has been reset by our team (${adminName}).</p>

          <p><strong>Reason:</strong> ${reason}</p>

          <p>This means you can now go back through the onboarding process to create a fresh persona for your AI. All your account settings, tier, and subscription remain active.</p>

          <p>When you're ready, log in to your dashboard and you'll be guided back to the beginning of the onboarding flow.</p>

          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com'}/dashboard" class="button">
            Go to Dashboard
          </a>
        </div>

        <div class="footer">
          <p>If you have any questions, please reach out to our support team.</p>
          <p>© 2024 Your Company. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Email template: Onboarding complete
 */
function generateOnboardingCompleteEmailHTML(personaSummary) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 5px; margin-bottom: 20px; text-align: center; }
        .content { line-height: 1.6; margin-bottom: 20px; }
        .persona-box { background-color: #f0f4ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea; }
        .button { background-color: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
        .steps { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .step { margin-bottom: 15px; }
        .step-number { background-color: #667eea; color: white; width: 30px; height: 30px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 10px; }
        .footer { font-size: 12px; color: #666; margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Your AI Persona is Ready!</h1>
          <p>Your account is now fully set up and ready to go</p>
        </div>

        <div class="content">
          <p>Hi there!</p>

          <p>Congratulations! Your AI persona has been successfully created based on your interview and social media analysis.</p>

          <div class="persona-box">
            <strong>Your Brand Voice Summary:</strong>
            <p>${personaSummary}</p>
          </div>

          <h3>What's Next?</h3>
          <div class="steps">
            <div class="step">
              <span class="step-number">1</span>
              <strong>Log in to your dashboard</strong>
              <p>Your personalized workspace is ready</p>
            </div>
            <div class="step">
              <span class="step-number">2</span>
              <strong>Create your first AI-generated post</strong>
              <p>Our AI will use your persona to write posts in your exact voice</p>
            </div>
            <div class="step">
              <span class="step-number">3</span>
              <strong>Connect more social platforms</strong>
              <p>Expand your reach to more channels (based on your tier)</p>
            </div>
            <div class="step">
              <span class="step-number">4</span>
              <strong>Schedule and publish</strong>
              <p>Posts will go live on your schedule</p>
            </div>
          </div>

          <p>Your AI will start generating content in 24 hours. If you have any questions, our support team is here to help!</p>

          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com'}/dashboard" class="button">
            Go to Dashboard
          </a>
        </div>

        <div class="footer">
          <p>Questions? Check our help center or contact support.</p>
          <p>© 2024 Your Company. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Email template: Tier upgrade confirmation
 */
function generateTierUpgradeEmailHTML(tier, monthlyPrice, setupFee, nextBillingDate) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #28a745; color: white; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .content { line-height: 1.6; margin-bottom: 20px; }
        .pricing { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .button { background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
        .footer { font-size: 12px; color: #666; margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>🎉 Welcome to ${tier} Tier!</h2>
        </div>

        <div class="content">
          <p>Thank you for upgrading! Your new plan is now active.</p>

          <div class="pricing">
            <h3>${tier} Plan Details</h3>
            <p><strong>Monthly Cost:</strong> £${(monthlyPrice / 100).toFixed(2)}</p>
            ${setupFee > 0 ? `<p><strong>Setup Fee (One-time):</strong> £${(setupFee / 100).toFixed(2)}</p>` : ''}
            <p><strong>Next Billing Date:</strong> ${new Date(nextBillingDate).toLocaleDateString()}</p>
          </div>

          <p>You now have access to all premium features for your tier. Start creating amazing content!</p>

          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com'}/dashboard" class="button">
            Go to Dashboard
          </a>
        </div>

        <div class="footer">
          <p>Questions? Check our FAQ or contact support.</p>
          <p>© 2024 Your Company. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
