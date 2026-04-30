import { NextRequest } from "next/server";
import { db } from "@/pkg/db";
import { cabinets } from "@/pkg/db/schema";
import { eq } from "drizzle-orm";
import { jsonOk, jsonError } from "@/app/shared/lib/api-helpers";
import { requireAuth, requireRole } from "@/app/shared/lib/auth-guard";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;
  try {
    const all = await db.select().from(cabinets).orderBy(cabinets.createdAt);
    return jsonOk(all);
  } catch {
    return jsonError("Failed to fetch cabinets", 500);
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireRole("admin");
  if (error) return error;
  try {
    const body = await req.json();
    const [created] = await db.insert(cabinets).values(body).returning();
    return jsonOk(created, 201);
  } catch {
    return jsonError("Failed to create cabinet", 500);
  }
}

export async function PUT(req: NextRequest) {
  const { error } = await requireRole("admin");
  if (error) return error;
  try {
    const body = await req.json();
    const { id, ...data } = body;
    const [updated] = await db.update(cabinets).set({ ...data, updatedAt: new Date() }).where(eq(cabinets.id, id)).returning();
    return jsonOk(updated);
  } catch {
    return jsonError("Failed to update cabinet", 500);
  }
}

export async function DELETE(req: NextRequest) {
  const { error } = await requireRole("admin");
  if (error) return error;
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return jsonError("ID is required");
    await db.delete(cabinets).where(eq(cabinets.id, id));
    return jsonOk({ success: true });
  } catch {
    return jsonError("Failed to delete cabinet", 500);
  }
}
