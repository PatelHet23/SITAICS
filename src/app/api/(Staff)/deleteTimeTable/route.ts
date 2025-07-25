import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/utils/auth";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.split(" ")[1] || "";
  const decodedUser = await verifyToken(token);
  const userId = decodedUser?.id;
  const userRole = decodedUser?.role;

  if (userRole !== "Staff") {
    return NextResponse.json({ message: "Access Denied!" }, { status: 403 });
  }
  try {
    const staffDetails = await prisma.staffDetails.findUnique({
      where: { id: userId },
      select: { batchId: true },
    });

    if (!staffDetails || !staffDetails.batchId) {
      return NextResponse.json(
        { message: "Batch not found for the staff!" },
        { status: 404 }
      );
    }

    const batchId = staffDetails.batchId;

    const existingBatch = await prisma.batch.findUnique({
      where: { batchId },
      select: { timetable: true },
    });

    if (!existingBatch?.timetable) {
      return NextResponse.json({
        message: "No timetable found to delete!",
        success: false,
      });
    }

    await prisma.batch.update({
      where: { batchId },
      data: {
        timetable: null,
      },
    });

    return NextResponse.json({
      message: "Timetable deleted successfully!",
      success: true,
    });
  } catch (error: any) {
    console.error("Error deleting timetable:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
