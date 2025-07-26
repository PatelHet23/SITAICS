import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const totalStudents = await prisma.studentDetails.count();

    console.log("Total Students:", totalStudents);

    return NextResponse.json({ totalStudents });
  } catch (error) {
    console.error("Error fetching total students:", error);

    return NextResponse.json(
      { message: "Error fetching total students" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
