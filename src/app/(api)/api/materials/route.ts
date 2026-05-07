import { jsonError, jsonOk } from "@/app/shared/lib/api-helpers";
import { requireRole } from "@/app/shared/lib/auth-guard";
import { db } from "@/pkg/db";
import { materials } from "@/pkg/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export async function GET() {
  const { error } = await requireRole("admin");
 
  if (error) return error;
 
  try {
    const all = await db.select().from(materials).orderBy(materials.createdAt);

    return jsonOk(all);
  } catch {
    return jsonError("Failed to fetch materials", 500);
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireRole("admin");
 
  if (error) return error;
 
  try {
    const body = await req.json();

    const [created] = await db.insert(materials).values(body).returning();

    return jsonOk(created, 201);
  } catch {
    return jsonError("Failed to create material", 500);
  }
}

export async function PUT(req: NextRequest) {
  const { error } = await requireRole("admin");
 
  if (error) return error;
 
  try {
    const body = await req.json();

    const { id, ...data } = body;

    const [updated] = await db.update(materials).set({ ...data, updatedAt: new Date() }).where(eq(materials.id, id)).returning();
   
    return jsonOk(updated);
  } catch {
    return jsonError("Failed to update material", 500);
  }
}

export async function DELETE(req: NextRequest) {
  const { error } = await requireRole("admin");
 
  if (error) return error;
  
  try {
    const { searchParams } = new URL(req.url);

    const id = searchParams.get("id");

    if (!id) return jsonError("ID is required");

    await db.delete(materials).where(eq(materials.id, id));
    
    return jsonOk({ success: true });
  } catch {
    return jsonError("Failed to delete material", 500);
  }
}
