import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/utils/auth";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.split(" ")[1] || "";
  const decodedUser = await verifyToken(token);
  const userRole = decodedUser?.role;

  if (userRole !== "Admin") {
    return NextResponse.json({ message: "Access Denied!" }, { status: 403 });
  }

  try {
    const studentCount = await prisma.studentDetails.count({
      where: { isActive: true },
    }); 

    const staffCount = await prisma.staffDetails.count({
      where: { isActive: true },
    });

    const totalCoursesCount = await prisma.course.count({
      where: { isActive: true },
    });

    const courseData = await prisma.course.findMany({
      where: { isActive: true },
      include: {
        StudentDetails: {
          where: { isActive: true },
        },
      },
    });

    const formattedCourseData = courseData.map((course) => ({
      courseName: course.courseName,
      Students: course.StudentDetails.length,
    }));

    return NextResponse.json(
      {
        studentCount,
        staffCount,
        totalCoursesCount,
        formattedCourseData,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}