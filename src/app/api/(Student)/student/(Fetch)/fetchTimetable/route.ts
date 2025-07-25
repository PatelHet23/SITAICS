import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/utils/auth";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.split(" ")[1] || "";
  const decodedUser = await verifyToken(token);
  const userId = decodedUser?.id;
  const userRole = decodedUser?.role;

  if (userRole !== "Student") {
    return NextResponse.json({ message: "Access Denied!" }, { status: 403 });
  }

  try {
    const studentDetails = await prisma.studentDetails.findUnique({
      where: { id: userId },
      select: { batchName: true },
    });
    console.log(studentDetails);
    if (!studentDetails || !studentDetails.batchName) {
      return NextResponse.json(
        { message: "Batch not found for the student!" },
        { status: 404 }
      );
    }

    const batchName = studentDetails.batchName;

    const existingBatch = await prisma.batch.findUnique({
      where: { batchName },
      select: { timetable: true },
    });

    if (existingBatch?.timetable) {
      return NextResponse.json({
        message: "Timetable fetched successfully!",
        success: true,
        timetableExists: true,
        timetable: existingBatch.timetable.toString(),
      });
    }

    return NextResponse.json(
      { message: "Timetable not found!" },
      { status: 404 }
    );
  } catch (error: any) {
    console.error("Error fetching timetable:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
