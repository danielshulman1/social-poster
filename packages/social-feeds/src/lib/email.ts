import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST || "smtp.ethereal.email",
    port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
    auth: {
        user: process.env.EMAIL_SERVER_USER || "mock_user",
        pass: process.env.EMAIL_SERVER_PASSWORD || "mock_pass",
    },
});

export const sendWorkflowFailureEmail = async (email: string, workflowName: string, error: string) => {
    try {
        const info = await transporter.sendMail({
            from: '"Workflow Automator" <noreply@example.com>',
            to: email,
            subject: `Workflow Failed: ${workflowName}`,
            text: `Your workflow "${workflowName}" failed to execute.\n\nError: ${error}\n\nPlease check your workflow settings.`,
            html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2 style="color: #e11d48;">Workflow Execution Failed</h2>
          <p>Your workflow <strong>${workflowName}</strong> encountered an error.</p>
          <div style="background: #f1f5f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <code>${error}</code>
          </div>
          <p>Please log in to your dashboard to investigate.</p>
          <a href="${process.env.NEXTAUTH_URL}/dashboard" style="display: inline-block; background: #0f172a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Dashboard</a>
        </div>
      `,
        });

        console.log("Message sent: %s", info.messageId);
        return info;
    } catch (error) {
        console.error("Error sending email:", error);
        // Don't throw, just log
    }
};

// Password reset email via Resend
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendPasswordResetEmail = async (email: string, resetToken: string): Promise<void> => {
    // Construct the correct base URL. Try NEXT_PUBLIC_APP_URL, then NEXTAUTH_URL, then VERCEL_URL, fallback to localhost.
    let rawAuthUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
    let appUrl = "";
    if (rawAuthUrl) {
        // If the user accidentally pasted multiple URLs separated by newlines or commas in Vercel
        appUrl = rawAuthUrl.split(/[\n,\s\\]+/)[0];
    }
    if (!appUrl && process.env.VERCEL_URL) {
        appUrl = `https://${process.env.VERCEL_URL}`;
    }
    appUrl = appUrl || "http://localhost:3000";
    // Strip trailing slash if present
    if (appUrl.endsWith('/')) {
        appUrl = appUrl.slice(0, -1);
    }
    
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

    if (!process.env.RESEND_API_KEY) {
        console.warn("⚠️ RESEND_API_KEY is not defined. Password reset email cannot be sent.");
        console.warn(`[DEVELOPMENT] Password Reset URL for ${email}: ${resetUrl}`);
        return;
    }

    try {
        const { data, error } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
            to: email,
            subject: "Reset your password",
            html: `
                <div style="font-family: sans-serif; padding: 20px; max-width: 500px;">
                    <h2 style="color: #0f172a;">Reset Your Password</h2>
                    <p style="color: #475569;">You requested a password reset. Click the button below to set a new password.</p>
                    <p style="color: #475569; font-size: 14px;">This link expires in <strong>1 hour</strong>.</p>
                    <div style="margin: 30px 0;">
                        <a href="${resetUrl}" style="display: inline-block; background: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: 500;">
                            Reset Password
                        </a>
                    </div>
                    <p style="color: #64748b; font-size: 13px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                        If you didn't request this, you can safely ignore this email.
                    </p>
                    <p style="color: #94a3b8; font-size: 12px;">
                        Link: <code>${resetUrl}</code>
                    </p>
                </div>
            `,
        });

        if (error) {
            console.error("Resend API returned an error:", error);
            console.warn(`[DEVELOPMENT fallback] Password Reset URL for ${email}: ${resetUrl}`);
        } else {
            console.log("Password reset email sent successfully:", data);
        }
    } catch (error) {
        console.error("Error executing Resend code:", error);
        console.warn(`[DEVELOPMENT fallback] Password Reset URL for ${email}: ${resetUrl}`);
    }
};
