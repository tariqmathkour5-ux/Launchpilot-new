import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { z } from "zod";

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// POST /api/auth/reset-password — Reset password with token
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, password } = resetPasswordSchema.parse(body);

    // Find valid token
    const tokens = await prisma.$queryRaw<Array<{ user_id: string; expires_at: Date; used: boolean }>>`
      SELECT user_id, expires_at, used
      FROM password_reset_tokens
      WHERE token = ${token}
      LIMIT 1
    `;

    const tokenRecord = tokens[0];

    if (!tokenRecord) {
      return NextResponse.json(
        { error: "Invalid reset token" },
        { status: 400 }
      );
    }

    if (tokenRecord.used) {
      return NextResponse.json(
        { error: "This reset link has already been used" },
        { status: 400 }
      );
    }

    if (new Date() > tokenRecord.expires_at) {
      return NextResponse.json(
        { error: "This reset link has expired" },
        { status: 400 }
      );
    }

    // Update password
    const hashedPassword = await hash(password, 12);

    await prisma.user.update({
      where: { id: tokenRecord.user_id },
      data: { password: hashedPassword },
    });

    // Mark token as used
    await prisma.$executeRaw`
      UPDATE password_reset_tokens
      SET used = true, updated_at = now()
      WHERE token = ${token}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}