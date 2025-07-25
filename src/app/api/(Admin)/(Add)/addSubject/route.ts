import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/utils/auth";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.split(" ")[1] || "";
  const decodedUser = await verifyToken(token);
  const userRole = decodedUser?.role;

  if (userRole !== "Admin") {
    return NextResponse.json({ message: "Access Denied!" }, { status: 403 });
  }

  try {
    const {
      subjectName,
      subjectCode,
      semester,
      courseId: providedCourseId,
      isElective,
      electiveGroupId,
    } = await request.json();

    if (!subjectName || !subjectCode || !semester || !providedCourseId) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    const semesterInt = parseInt(semester, 10);
    if (isNaN(semesterInt)) {
      return NextResponse.json(
        { message: "Semester must be a valid number" },
        { status: 400 }
      );
    }

    let course = await prisma.course.findUnique({
      where: { courseId: providedCourseId },
    });

    if (!course) {
      course = await prisma.course.findUnique({
        where: { courseName: providedCourseId },
      });

      if (!course) {
        return NextResponse.json(
          { message: "Course not found. Please check the course ID or name." },
          { status: 404 }
        );
      }
    }

    const existingSubject = await prisma.subject.findFirst({
      where: {
        subjectName,
        subjectCode,
        courseId: course.courseId,
      },
    });

    if (existingSubject) {
      return NextResponse.json(
        { message: "Subject already exists for this course" },
        { status: 400 }
      );
    }

    // If this is an elective subject, verify the elective group exists
    if (isElective && electiveGroupId) {
      const electiveGroup = await prisma.electiveGroup.findFirst({
        where: {
          electiveGroupId,
          courseId: course.courseId,
          semester: semesterInt,
        },
      });

      if (!electiveGroup) {
        return NextResponse.json(
          { message: "Invalid elective group for this course and semester" },
          { status: 400 }
        );
      }
    }

    const subject = await prisma.subject.create({
      data: {
        subjectName,
        subjectCode,
        semester: semesterInt,
        courseId: course.courseId,
        isElective: isElective || false,
        electiveGroupId: isElective ? electiveGroupId : null,
        isActive: true,
      },
    });

    return NextResponse.json(subject, { status: 200 });
  } catch (error: any) {
    console.error("Error adding subject:", error);
    return NextResponse.json(
      {
        message: "An error occurred while adding the subject",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
