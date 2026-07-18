import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");
  const tag = searchParams.get("tag");
  const secret = searchParams.get("secret");

  // Validate secret
  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  try {
    if (path) {
      revalidatePath(path);
      return NextResponse.json({ revalidated: true, path });
    }
    if (tag) {
      revalidateTag(tag);
      return NextResponse.json({ revalidated: true, tag });
    }
    return NextResponse.json({ error: "Path or tag required" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to revalidate" }, { status: 500 });
  }
}
