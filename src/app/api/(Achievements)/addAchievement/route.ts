import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/utils/auth";
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs for achievements

export async function POST(request: NextRequest) {
  const decodedUser = verifyToken();
  const userRole = decodedUser?.role;
  const userId = decodedUser?.id;

  if (userRole !== "Staff") {
    return NextResponse.json({ message: "Access Denied!" }, { status: 403 });
  }

  try {
    // Parse the JSON input for the new achievement
    const { title, description, date, category } = await request.json();

    // Fetch the existing staff details with their achievements
    const staffDetails = await prisma.staffDetails.findUnique({
      where: { id: userId },
      select: { achievements: true },
    });

    if (!staffDetails) {
      return NextResponse.json({ message: "Staff not found!" }, { status: 404 });
    }

    // Get current achievements or initialize an empty array
    let achievements = staffDetails.achievements ? staffDetails.achievements : [];

    // Ensure achievements are in JSON format
    achievements = Array.isArray(achievements) ? achievements : [];

    // Check if the achievement already exists (by comparing title, description, date, and category)
    const achievementExists = achievements.some(
      (achievement: any) =>
        achievement.title === title &&
        achievement.description === description &&
        achievement.date === date &&
        achievement.category === category
    );

    if (achievementExists) {
      return NextResponse.json({ message: "Achievement already exists!" }, { status: 409 });
    }

    // Create a new achievement with a unique ID
    const newAchievement = {
      id: uuidv4(),
      title,
      description,
      date,
      category,
    };

    // Append the new achievement to the existing array
    achievements.push(newAchievement);

    // Update the staff details in the database with the new achievement
    const updatedStaffDetails = await prisma.staffDetails.update({
      where: { id: userId },
      data: { achievements },
    });

    // Respond with the updated achievements
    return NextResponse.json({
      message: "Achievement added successfully!",
      success: true,
      achievements: updatedStaffDetails.achievements,
    });
  } catch (error: any) {
    console.error("Error adding achievement:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
