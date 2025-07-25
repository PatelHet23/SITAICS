import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/utils/auth";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.split(" ")[1] || "";
  const decodedUser = await verifyToken(token);

  const userRole = decodedUser?.role;

  if (userRole !== "Student") {
    return NextResponse.json({ message: "Access Denied!" }, { status: 403 });
  }

  try {
    const reqBody = await request.json();
    const {
      id,
      name,
      fatherName,
      motherName,
      enrollmentNumber,
      courseName,
      batchName,
      dateOfBirth,
      gender,
      bloodGroup,
      contactNo,
      address,
      city,
      state,
      pinCode,
    } = reqBody;

    const parsedDateOfBirth = new Date(`${dateOfBirth}T00:00:00Z`);

    const courseRecord = await prisma.course.findUnique({
      where: { courseName: courseName },
      select: { courseName: true },
    });

    if (!courseRecord) {
      return NextResponse.json(
        { error: `Course with name '${courseName}' does not exist` },
        { status: 400 }
      );
    }

    const batchRecord = await prisma.batch.findUnique({
      where: { batchName: batchName },
      select: { batchId: true },
    });

    if (!batchRecord) {
      return NextResponse.json({ error: "Batch not found" }, { status: 400 });
    }

    const existingStudent = await prisma.studentDetails.findUnique({
      where: { id: id },
    });

    let studentDetails;
    let updatedBatch;

    if (existingStudent) {
      [studentDetails, updatedBatch] = await prisma.$transaction([
        prisma.studentDetails.update({
          where: { id: id },
          data: {
            name,
            fatherName,
            motherName,
            enrollmentNumber,
            courseName,
            batchName,
            dateOfBirth: parsedDateOfBirth,
            gender,
            bloodGroup,
            contactNo,
            address,
            city,
            state,
            pinCode,
            isProfileCompleted: true,
          },
        }),
        prisma.batch.update({
          where: { batchId: batchRecord.batchId },
          data: {
            students: {
              connect: { id: id },
            },
          },
        }),
      ]);
    }

    console.log(
      (existingStudent ? "Updated" : "Created") + " student details:",
      studentDetails
    );
    console.log("Updated batch:", updatedBatch);

    return NextResponse.json({
      message: `Student Details ${
        existingStudent ? "updated" : "created"
      } successfully`,
      success: true,
      studentDetails,
      updatedBatch,
    });
  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
