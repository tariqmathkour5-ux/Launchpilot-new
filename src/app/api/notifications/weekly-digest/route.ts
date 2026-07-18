import { NextResponse } from "next/server";
import { sendWeeklyToolDigest, queueWeeklyDigestCampaign, getNewToolsLastWeek, getEligibleDigestRecipients } from "@/lib/weekly-digest";

// GET /api/notifications/weekly-digest - Get preview of weekly digest
export async function GET() {
  try {
    const tools = await getNewToolsLastWeek();
    const recipients = await getEligibleDigestRecipients();
    
    return NextResponse.json({
      tools,
      recipientCount: recipients.length,
      message: tools.length > 0 
        ? `Found ${tools.length} new tools for ${recipients.length} eligible recipients` 
        : "No new tools found this week",
    });
  } catch (error) {
    console.error("Error fetching weekly digest preview:", error);
    return NextResponse.json(
      { error: "Failed to fetch digest preview" },
      { status: 500 }
    );
  }
}

// POST /api/notifications/weekly-digest - Send weekly digest (requires auth)
export async function POST(request: Request) {
  try {
    // TODO: Add authentication check for admin-only access
    // For now, we'll just send the digest
    
const result = await sendWeeklyToolDigest();
    
    return NextResponse.json({
      success: true,
      stats: result,
      message: `Digest sent to ${result.success} users${result.failed > 0 ? `, ${result.failed} failed` : ''}`,
    });
  } catch (error) {
    console.error("Error sending weekly digest:", error);
    return NextResponse.json(
      { error: "Failed to send weekly digest" },
      { status: 500 }
    );
  }
}