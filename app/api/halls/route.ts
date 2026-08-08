import { NextResponse } from "next/server";
import { getHallsServer } from "@/lib/hallsServer";

/**
 * Public hall list — the one place both server components and client
 * components go for hall data, so the "which mode are we in" branch
 * lives in exactly one spot (lib/hallsServer.ts).
 */
export async function GET() {
  const { halls, live } = await getHallsServer();
  return NextResponse.json({ halls, live });
}
