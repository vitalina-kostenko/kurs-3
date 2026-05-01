import { jsonError, jsonOk } from "@/app/shared/lib/api-helpers";
import { requireAuth, requireRole } from "@/app/shared/lib/auth-guard";
import { db } from "@/pkg/db";
import { services } from "@/pkg/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export async function GET() {
  const { error } = await requireAuth();
  
  if (error) return error;
 
  try {
    const all = await db.select().from(services).orderBy(services.createdAt);
    return jsonOk(all);
  } catch {
    return jsonError("Failed to fetch services", 500);
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireRole("admin");
 
  if (error) return error;
 
  try {
    const body = await req.json();
    const [created] = await db.insert(services).values(body).returning();
    return jsonOk(created, 201);
  } catch {
    return jsonError("Failed to create service", 500);
  }
}

export async function PUT(req: NextRequest) {
  const { error } = await requireRole("admin");
  
  if (error) return error;
  
  try {
    const body = await req.json();
    const { id, ...data } = body;
    const [updated] = await db.update(services).set({ ...data, updatedAt: new Date() }).where(eq(services.id, id)).returning();
    return jsonOk(updated);
  } catch {
    return jsonError("Failed to update service", 500);
  }
}

export async function DELETE(req: NextRequest) {
  const { error } = await requireRole("admin");
 
  if (error) return error;
 
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return jsonError("ID is required");
    await db.delete(services).where(eq(services.id, id));
    return jsonOk({ success: true });
  } catch {
    return jsonError("Failed to delete service", 500);
  }
}
