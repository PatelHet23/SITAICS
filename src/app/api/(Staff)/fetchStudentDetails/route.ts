import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/utils/auth";

export async function POST(request: NextRequest) {
  console.log("API route hit: /api/fetchStudentDetails");
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    console.log("Token:", token ? "Present" : "Not present");
    let id = null, role = null;

    if (token) {
      const decodedToken = verifyToken();
      if (decodedToken && typeof decodedToken === "object") {
        id = decodedToken.id;
        role = decodedToken.role;
        console.log("Decoded token - ID:", id, "Role:", role);
      }
    }

    if (!id || role !== "Staff") {
      console.log("Unauthorized access attempt");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Step 1: Fetch the batch ID of the staff member
    const staffDetails = await prisma.staffDetails.findUnique({
      where: { id },
      select: { batchId: true },
    });

    if (!staffDetails || !staffDetails.batchId) {
      console.log("No batch ID found for staff member");
      return NextResponse.json({ message: "No batch assigned" }, { status: 404 });
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
  } 
  catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json({ message: "An unexpected error occurred" }, { status: 500 });
  }
}
