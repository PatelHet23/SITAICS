import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/utils/auth";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.split(" ")[1] || "";
  const decodedUser = await verifyToken(token);
  const userId = decodedUser?.id;
  const userRole = decodedUser?.role;

  try {
    if (userRole == "Staff") {
      const staffDetails = await prisma.staffDetails.findUnique({
        where: { id: userId },
        select: { achievements: true },
      });
      if (!staffDetails) {
        return NextResponse.json(
          { message: "Staff not found!" },
          { status: 404 }
        );
      }
      console.log(staffDetails);

      const achievements = staffDetails.achievements
        ? staffDetails.achievements
        : [];

      return NextResponse.json({
        success: true,
        achievements: achievements,
      });
    } else if (userRole == "Student") {
      const studentDetails = await prisma.studentDetails.findUnique({
        where: { id: userId },
        select: { achievements: true },
      });
      console.log(studentDetails);
      if (!studentDetails) {
        return NextResponse.json(
          { message: "Student not found!" },
          { status: 404 }
        );
      }

      const achievements = studentDetails.achievements
        ? studentDetails.achievements
        : [];

      return NextResponse.json({
        success: true,
        achievements: achievements,
      });
    }
  } catch (error: any) {
    console.error("Error fetching achievements:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
