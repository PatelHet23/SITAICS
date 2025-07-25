import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/utils/auth";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.split(" ")[1] || "";
  const decodedUser = await verifyToken(token);

  if (decodedUser?.role !== "Admin") {
    return NextResponse.json({ message: "Access Denied!" }, { status: 403 });
  }

  try {
    const courses = await prisma.course.findMany({
      where: {
        isActive: true,
      },
      include: {
        batches: {
          select: {
            batchId: true,
            batchDuration: true,
          },
        },
        subjects: {
          select: {
            subjectId: true,
          },
        },
      },
    });

    const formattedCourses = courses.map((course) => ({
      courseId: course.courseId,
      courseName: course.courseName,
      totalBatches: course.batches.length,
      totalSubjects: course.subjects.length,
      isActive: true,
    }));

    return NextResponse.json(
      { message: "Courses fetched", courses: formattedCourses },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: "Failed to fetch courses", error: error.message },
      { status: 500 }
    );
  }
}
