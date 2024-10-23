import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/utils/auth";

export async function GET(request: Request) {
  const decodedUser = verifyToken();
  if (!decodedUser) {
    return NextResponse.json({ message: "Access Denied!" }, { status: 403 });
  }
  const userRole = decodedUser.role;

  if (userRole !== "Staff") {
    return NextResponse.json({ message: "Access Denied!" }, { status: 403 });
  }

  try {
    const staffId = decodedUser.id;

    const staffBatches = await prisma.staffDetails.findUnique({
      where: { id: staffId },
      select: { 
        batch: {
          select: {
            batchId: true,
            batchName: true,
            course: {
              select: {
                courseId: true,
                courseName: true,
              },
            },
          },
        },
      },
    });

    const batches = staffBatches?.batch
      ? [
          {
            batchId: staffBatches.batch.batchId,
            batchName: staffBatches.batch.batchName,
            courseName: staffBatches.batch.course.courseName,
          },
        ]
      : [];

    return NextResponse.json(batches);
  } catch (error) {
    console.error("Error fetching batches:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching batches" },
      { status: 500 }
    );
  }
}