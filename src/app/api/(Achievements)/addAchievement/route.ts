import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/utils/auth";
import { v4 as uuidv4 } from "uuid";
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.split(" ")[1] || "";
  const decodedUser = await verifyToken(token);
  const userId = decodedUser?.id;
  const userRole = decodedUser?.role;

  if (userRole !== "Admin") {
    return NextResponse.json({ message: "Access Denied!" }, { status: 403 });
  }

  try {
    const { title, description, date, category } = await request.json();

    let achievements: any[] = [];

    if (userRole === "Staff") {
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

      achievements = Array.isArray(staffDetails.achievements)
        ? staffDetails.achievements
        : [];
    } else if (userRole === "Student") {
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

      achievements = Array.isArray(studentDetails.achievements)
        ? studentDetails.achievements
        : [];
    }

    achievements = Array.isArray(achievements) ? achievements : [];

    const achievementExists = achievements.some(
      (achievement: any) =>
        achievement.title === title &&
        achievement.description === description &&
        achievement.date === date &&
        achievement.category === category
    );

    if (achievementExists) {
      return NextResponse.json(
        { message: "Achievement already exists!" },
        { status: 409 }
      );
    }

    const newAchievement = {
      id: uuidv4(),
      title,
      description,
      date,
      category,
    };

    achievements.push(newAchievement);

    if (userRole === "Staff") {
      const updatedStaffDetails = await prisma.staffDetails.update({
        where: { id: userId },
        data: { achievements },
      });

      return NextResponse.json({
        message: "Achievement added successfully for Staff!",
        success: true,
        achievements: updatedStaffDetails.achievements,
      });
    } else if (userRole === "Student") {
      const updatedStudentDetails = await prisma.studentDetails.update({
        where: { id: userId },
        data: { achievements },
      });

      return NextResponse.json({
        message: "Achievement added successfully for Student!",
        success: true,
        achievements: updatedStudentDetails.achievements,
      });
    }
  } catch (error: any) {
    console.error("Error adding achievement:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
