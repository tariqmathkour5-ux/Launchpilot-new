import { NextRequest, NextResponse } from "next/server";
import { verifyMerchantToken, getMerchantAnalytics } from "@/lib/merchant-analytics";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get("token");

  // Verify merchant token
  const partner = await verifyMerchantToken(token || "");
  
  if (!partner) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    );
  }

  // Get analytics data for this partner
  const analytics = await getMerchantAnalytics(partner.id);

  if (!analytics) {
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }

  return NextResponse.json(analytics);
}

// POST endpoint for real-time updates (can be used with SSE)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    // Verify merchant token
    const partner = await verifyMerchantToken(token || "");
    
    if (!partner) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Get fresh analytics data
    const analytics = await getMerchantAnalytics(partner.id);

    if (!analytics) {
      return NextResponse.json(
        { error: "Failed to fetch analytics data" },
        { status: 500 }
      );
    }

    return NextResponse.json(analytics);
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}