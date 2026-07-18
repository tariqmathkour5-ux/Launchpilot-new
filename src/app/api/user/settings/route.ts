import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSettingsSchema = z.object({
  language: z.string().optional(),
  timezone: z.string().optional(),
  emailNotifications: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
  publicProfile: z.boolean().optional(),
  weeklyToolDigest: z.boolean().optional(),
});

// GET /api/user/settings — Get current user's settings
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

// Get or create user settings
    let settings = await (prisma as any).userSettings.findUnique({
      where: { userId: session.user.id },
    });

// Return default settings if none exist
    if (!settings) {
      settings = {
        id: "default",
        userId: session.user.id,
        language: "en",
        timezone: "UTC",
        emailNotifications: true,
        marketingEmails: false,
        publicProfile: false,
        weeklyToolDigest: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Settings fetch error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

// PATCH /api/user/settings — Update current user's settings
export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

const body = await request.json();
    const { language, timezone, emailNotifications, marketingEmails, publicProfile, weeklyToolDigest } = updateSettingsSchema.parse(body);

    const updateData: Record<string, unknown> = {};
    if (language !== undefined) updateData.language = language;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (emailNotifications !== undefined) updateData.emailNotifications = emailNotifications;
    if (marketingEmails !== undefined) updateData.marketingEmails = marketingEmails;
    if (publicProfile !== undefined) updateData.publicProfile = publicProfile;
    if (weeklyToolDigest !== undefined) updateData.weeklyToolDigest = weeklyToolDigest;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    // Upsert user settings
    const settings = await (prisma as any).userSettings.upsert({
      where: { userId: session.user.id },
      update: updateData,
      create: {
        userId: session.user.id,
        language: language || "en",
        timezone: timezone || "UTC",
        emailNotifications: emailNotifications ?? true,
        marketingEmails: marketingEmails ?? false,
        publicProfile: publicProfile ?? false,
        weeklyToolDigest: weeklyToolDigest ?? true,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Settings update error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}