import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/utils/auth";

export async function PATCH(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.split(" ")[1] || "";
  const decodedUser = await verifyToken(token);
  const userId = decodedUser?.id;
  const userRole = decodedUser?.role;

  if (userRole !== "Admin") {
    return NextResponse.json({ message: "Access Denied!" }, { status: 403 });
  }

  try {
    // Parse the request body to get the achievement details to be deleted
    const { title, description, date, category } = await request.json();

    let achievements = [];

    if (userRole === "Staff") {
      // Fetch the staff details including their achievements
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

      achievements = staffDetails.achievements ? staffDetails.achievements : [];
    } else if (userRole === "Student") {
      // Fetch the student details including their achievements
      const studentDetails = await prisma.studentDetails.findUnique({
        where: { id: userId },
        select: { achievements: true },
      });

      if (!studentDetails) {
        return NextResponse.json(
          { message: "Student not found!" },
          { status: 404 }
        );
      }

      achievements = studentDetails.achievements
        ? studentDetails.achievements
        : [];
    }

    // Ensure achievements is an array
    achievements = Array.isArray(achievements) ? achievements : [];

    // Find the index of the achievement to be deleted by matching all fields
    const achievementIndex = achievements.findIndex(
      (achievement: any) =>
        achievement.title === title &&
        achievement.description === description &&
        achievement.date === date &&
        achievement.category === category
    );

    if (achievementIndex === -1) {
      return NextResponse.json({
        message: "Achievement not found!",
        success: false,
      });
    }

    // Remove the achievement from the array
    achievements.splice(achievementIndex, 1);

    // Update the corresponding user details with the updated achievements array
    if (userRole === "Staff") {
      await prisma.staffDetails.update({
        where: { id: userId },
        data: { achievements },
      });
    } else if (userRole === "Student") {
      await prisma.studentDetails.update({
        where: { id: userId },
        data: { achievements },
      });
    }

    return NextResponse.json({
      message: "Achievement deleted successfully!",
      success: true,
      achievements,
    });
  } catch (error: any) {
    console.error("Error deleting achievement:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
