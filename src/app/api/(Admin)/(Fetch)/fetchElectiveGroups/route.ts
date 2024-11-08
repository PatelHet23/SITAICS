import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/utils/auth";

export async function GET(req: Request) {
  try {
    const decodedUser = verifyToken();
    const userRole = decodedUser?.role;

    if (userRole !== "Admin") {
      return NextResponse.json({ message: "Access Denied!" }, { status: 403 });
    }

    const electiveGroups = await prisma.electiveGroup.findMany({
      include: {
        course: {
          select: {
            courseName: true,
          },
        },
        subjects: true,
      },
    });

    const groupsWithCourseName = electiveGroups.map((group) => ({
      ...group,
      courseName: group.course.courseName,
      course: undefined,
    }));

    return NextResponse.json({ groups: groupsWithCourseName }, { status: 200 });
  } catch (error) {
    console.error("Error fetching elective groups:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
