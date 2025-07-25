import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/utils/auth";

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.split(" ")[1] || "";
    const decodedUser = await verifyToken(token);
    const userRole = decodedUser?.role;

    if (userRole !== "Admin") {
      return NextResponse.json({ message: "Access Denied!" }, { status: 403 });
    }

    const { batchId } = await request.json();

    if (!batchId || typeof batchId !== "string") {
      return NextResponse.json({ error: "Invalid batchId" }, { status: 400 });
    }

    const updatedBatch = await prisma.batch.update({
      where: { batchId },
      data: { isActive: false },
    });

    console.log("Batch updated:", updatedBatch);
    return NextResponse.json(updatedBatch, { status: 200 });
  } catch (error) {
    console.error("Error deactivating batch:", error);
    return NextResponse.json(
      { error: "Failed to deactivate batch" },
      { status: 500 }
    );
  }
}
