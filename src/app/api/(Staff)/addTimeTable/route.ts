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

    console.log(staffDetails);

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

    if (existingBatch?.timetable) {
      return NextResponse.json({
        message: "Timetable already exists!",
        success: true,
        timetableExists: true,
        timetable: existingBatch.timetable.toString(),
      });
    }

    const formData = await request.formData();
    const timetableFile = formData.get("timetable") as File;

    if (!timetableFile) {
      return NextResponse.json(
        { message: "No timetable file provided!" },
        { status: 400 }
      );
    }

    if (timetableFile.type !== "application/pdf") {
      return NextResponse.json(
        { message: "Only PDF files are allowed." },
        { status: 400 }
      );
    }

    const timetableBuffer = Buffer.from(await timetableFile.arrayBuffer());

    const updatedBatch = await prisma.batch.update({
      where: { batchId },
      data: {
        timetable: timetableBuffer,
      },
    });

    return NextResponse.json({
      message: "Timetable uploaded successfully!",
      success: true,
      updatedBatch,
    });
  } catch (error: any) {
    console.error("Error uploading timetable:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
