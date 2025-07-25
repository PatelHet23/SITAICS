import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/utils/auth";

export async function POST(request: NextRequest) {
  console.log("API route hit: /api/fetchStudentDetails");
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.split(" ")[1] || "";
    const decodedUser = await verifyToken(token);
    const userId = decodedUser?.id;
    const userRole = decodedUser?.role;

    if (userRole !== "Staff") {
      return NextResponse.json({ message: "Access Denied!" }, { status: 403 });
    }

    const staffDetails = await prisma.staffDetails.findUnique({
      where: { id: userId },
      select: { batchId: true },
    });

    if (!staffDetails || !staffDetails.batchId) {
      console.log("No batch ID found for staff member");
      return NextResponse.json(
        { message: "No batch assigned" },
        { status: 404 }
      );
    }

    const batchId = staffDetails.batchId;

    // Step 2: Fetch the batch name using the batch ID
    const batchDetails = await prisma.batch.findUnique({
      where: { batchId },
      select: { batchName: true },
    });

    if (!batchDetails) {
      console.log("No batch found for the given batch ID");
      return NextResponse.json({ message: "Batch not found" }, { status: 404 });
    }

    const batchName = batchDetails.batchName;
    console.log("Fetched batch name:", batchName);

    // Step 3: Fetch the students associated with the batch name
    const students = await prisma.studentDetails.findMany({
      where: {
        batchName: batchName,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        enrollmentNumber: true,
        courseName: true,
        batchName: true,
        isProfileCompleted: true,
      },
    });

    console.log("Number of students fetched:", students.length);
    return NextResponse.json({ students }, { status: 200 });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
