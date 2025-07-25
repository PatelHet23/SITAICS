import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "@/utils/auth";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.split(" ")[1] || "";
  const decodedUser = await verifyToken(token);
  const userRole = decodedUser?.role;

  if (!["Admin", "Staff"].includes(userRole!)) {
    return NextResponse.json({ message: "Access Denied!" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const batchId = searchParams.get("batchId");

  if (!batchId) {
    return NextResponse.json(
      { message: "batchId parameter is required" },
      { status: 400 }
    );
  }

  try {
    const batch = await prisma.batch.findUnique({
      where: { batchId },
      include: {
        students: {
          include: {
            user: {
              select: {
                email: true,
                username: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!batch) {
      return NextResponse.json({ message: "Batch not found" }, { status: 404 });
    }

    const formattedStudents = batch.students.map((student) => ({
      studentId: student.id,
      email: student.email,
      username: student.username,
      name: student.name,
      fatherName: student.fatherName,
      motherName: student.motherName,
      enrollmentNumber: student.enrollmentNumber,
      courseName: student.courseName,
      dateOfBirth: student.dateOfBirth,
      gender: student.gender,
      bloodGroup: student.bloodGroup,
      contactNo: student.contactNo,
      address: student.address,
      city: student.city,
      state: student.state,
      pinCode: student.pinCode,
      achievements: student.achievements,
    }));

    return NextResponse.json({ students: formattedStudents }, { status: 200 });
  } catch (error) {
    console.error("Error fetching students for batch:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
