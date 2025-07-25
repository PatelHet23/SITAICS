import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/utils/auth";
import { Console } from "console";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.split(" ")[1] || "";
  const decodedUser = await verifyToken(token);
  const userId = decodedUser?.id;
  const userRole = decodedUser?.role;

  if (userRole !== "Admin") {
    return NextResponse.json({ message: "Access Denied!" }, { status: 403 });
  }

  try {
    // Fetch the staff details including achievements
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
      // Ensure achievements are returned as an array (even if null or empty)
      const achievements = staffDetails.achievements
        ? staffDetails.achievements
        : [];
      // Send the achievements array back to the client
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

      // Ensure achievements are returned as an array (even if null or empty)
      const achievements = studentDetails.achievements
        ? studentDetails.achievements
        : [];
      // Send the achievements array back to the client
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
