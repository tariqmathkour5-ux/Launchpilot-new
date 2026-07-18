import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

// POST /api/auth/forgot-password — Send password reset email
export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Always return success to prevent email enumeration
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (user) {
      // Generate reset token
      const resetToken = randomBytes(32).toString("hex");
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store reset token in the database
      // We use the User model's fields; since there's no dedicated field,
      // we store it in a separate mechanism. For now, we'll create a record
      // using Prisma's raw query or a dedicated table approach.
      // Since the schema doesn't have passwordResetToken fields, we'll
      // store it in a simple way by updating user metadata.
      // In production, use a PasswordResetToken model.
      await prisma.$executeRaw`
        INSERT INTO password_reset_tokens (user_id, token, expires_at)
        VALUES (${user.id}::uuid, ${resetToken}, ${resetTokenExpiry})
        ON CONFLICT (user_id) DO UPDATE
        SET token = ${resetToken}, expires_at = ${resetTokenExpiry}, used = false, created_at = now()
      `;

      const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/reset-password?token=${resetToken}`;

      // In production, send email via Resend/SendGrid
      console.log(`[DEV] Password reset link for ${email}: ${resetUrl}`);
    }

    return NextResponse.json({
      message: "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}