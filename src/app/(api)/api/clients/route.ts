import { jsonError, jsonOk } from "@/app/shared/lib/api-helpers";
import { requireAuth, requireRole } from "@/app/shared/lib/auth-guard";
import { db } from "@/pkg/db";
import { clients } from "@/pkg/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export async function GET() {
  const { error } = await requireAuth();

  if (error) return error;

  try {
    const all = await db.select().from(clients).orderBy(clients.createdAt);

    return jsonOk(all);
  } catch {
    return jsonError("Failed to fetch clients", 500);
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireRole("admin");

  if (error) return error;

  try {
    const body = await req.json();

    const [created] = await db.insert(clients).values(body).returning();

    return jsonOk(created, 201);
  } catch {
    return jsonError("Failed to create client", 500);
  }
}

export async function PUT(req: NextRequest) {
  const { error } = await requireRole("admin");

  if (error) return error;

  try {
    const body = await req.json();

    const { id, ...data } = body;

    const [updated] = await db.update(clients).set({ ...data, updatedAt: new Date() }).where(eq(clients.id, id)).returning();
    
    return jsonOk(updated);
  } catch {
    return jsonError("Failed to update client", 500);
  }
}

export async function DELETE(req: NextRequest) {
  const { error } = await requireRole("admin");

  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
  
    const id = searchParams.get("id");
   
    if (!id) return jsonError("ID is required");
  
    await db.delete(clients).where(eq(clients.id, id));
  
    return jsonOk({ success: true });
  } catch {
    return jsonError("Failed to delete client", 500);
  }
}
