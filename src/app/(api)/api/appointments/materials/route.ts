import { NextRequest } from "next/server";
import { db } from "@/pkg/db";
import { appointmentMaterials, materials } from "@/pkg/db/schema";
import { eq } from "drizzle-orm";
import { jsonOk, jsonError } from "@/app/shared/lib/api-helpers";
import { requireAuth } from "@/app/shared/lib/auth-guard";

export async function GET(req: NextRequest) {
  const { error: authErr } = await requireAuth();
  if (authErr) return authErr;
  try {
    const { searchParams } = new URL(req.url);
    const appointmentId = searchParams.get("appointmentId");
    if (!appointmentId) return jsonError("appointmentId is required");

    const items = await db
      .select({
        id: appointmentMaterials.id,
        appointmentId: appointmentMaterials.appointmentId,
        materialId: appointmentMaterials.materialId,
        quantity: appointmentMaterials.quantity,
        materialName: materials.name,
        materialUnit: materials.unit,
        pricePerUnit: materials.pricePerUnit,
      })
      .from(appointmentMaterials)
      .leftJoin(materials, eq(appointmentMaterials.materialId, materials.id))
      .where(eq(appointmentMaterials.appointmentId, appointmentId));

    return jsonOk(items);
  } catch {
    return jsonError("Failed to fetch appointment materials", 500);
  }
}

export async function POST(req: NextRequest) {
  const { error: authErr } = await requireAuth();
  if (authErr) return authErr;
  try {
    const body = await req.json();
    const { appointmentId, materialIds } = body as {
      appointmentId: string;
      materialIds: { materialId: string; quantity: string }[];
    };

    if (!appointmentId || !materialIds) {
      return jsonError("appointmentId and materialIds are required");
    }

    await db
      .delete(appointmentMaterials)
      .where(eq(appointmentMaterials.appointmentId, appointmentId));

    if (materialIds.length > 0) {
      await db.insert(appointmentMaterials).values(
        materialIds.map((m) => ({
          appointmentId,
          materialId: m.materialId,
          quantity: m.quantity,
        }))
      );
    }

    const updated = await db
      .select({
        id: appointmentMaterials.id,
        materialId: appointmentMaterials.materialId,
        quantity: appointmentMaterials.quantity,
        materialName: materials.name,
        materialUnit: materials.unit,
        pricePerUnit: materials.pricePerUnit,
      })
      .from(appointmentMaterials)
      .leftJoin(materials, eq(appointmentMaterials.materialId, materials.id))
      .where(eq(appointmentMaterials.appointmentId, appointmentId));

    return jsonOk(updated);
  } catch {
    return jsonError("Failed to update appointment materials", 500);
  }
}
