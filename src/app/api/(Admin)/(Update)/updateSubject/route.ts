import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/utils/auth";

export async function PUT(req: Request) {
  const decodedUser = verifyToken();

  if (decodedUser?.role !== "Admin") {
    return NextResponse.json({ message: "Access Denied!" }, { status: 403 });
  }

  try {
    const { subjectId, subjectName, subjectCode, semester, courseName } = await req.json();

    const course = await prisma.course.findUnique({
      where: { courseName },
      select: { courseId: true }
    });

    if (!course) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 });
    }

    const updatedSubject = await prisma.subject.update({
      where: { subjectId },
      data: {
        subjectName,
        subjectCode,
        semester,
        courseId: course.courseId
      }
    });

    return NextResponse.json(
      { message: "Subject updated successfully", subject: updatedSubject },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating subject:", error);
    return NextResponse.json(
      { message: "Failed to update subject", error: error.message },
      { status: 500 }
    );
  }
}