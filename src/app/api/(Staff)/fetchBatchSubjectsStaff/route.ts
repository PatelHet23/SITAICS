import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "@/utils/auth";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.split(" ")[1] || "";
    const decodedUser = await verifyToken(token);

    const userRole = decodedUser?.role;

    if (userRole !== "Staff") {
      return NextResponse.json({ message: "Access Denied!" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get("batchId");

    if (!batchId) {
      return NextResponse.json(
        { message: "Batch ID is required" },
        { status: 400 }
      );
    }

    const batch = await prisma.batch.findUnique({
      where: {
        batchId,
        isActive: true,
      },
      select: {
        courseId: true,
        batchName: true,
        course: {
          select: {
            courseName: true,
          },
        },
      },
    });

    if (!batch) {
      return NextResponse.json(
        { message: `Batch with ID ${batchId} not found` },
        { status: 404 }
      );
    }

    const subjects = await prisma.subject.findMany({
      where: {
        courseId: batch.courseId,
        isActive: true,
      },
      select: {
        subjectId: true,
        subjectName: true,
        subjectCode: true,
        semester: true,
        batches: {
          where: {
            batchId: batchId,
          },
          select: {
            semester: true,
          },
        },
      },
    });

    const formattedSubjects = subjects.map((subject) => ({
      subjectId: subject.subjectId,
      subjectName: subject.subjectName,
      subjectCode: subject.subjectCode,
      semester: subject.semester,
      assignedToBatch: subject.batches.length > 0,
      batchSemester: subject.batches[0]?.semester || subject.semester,
    }));

    return NextResponse.json(
      {
        batchName: batch.batchName,
        courseName: batch.course.courseName,
        subjects: formattedSubjects,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching batch subjects:", error);
    return NextResponse.json(
      { message: "Failed to fetch batch subjects" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
