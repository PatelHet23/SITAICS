import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/utils/auth";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.split(" ")[1] || "";
  const decodedUser = await verifyToken(token);
  const userId = decodedUser?.id;
  const userRole = decodedUser?.role;

  if (userRole !== "Staff") {
    return NextResponse.json({ message: "Access Denied!" }, { status: 403 });
  }
  try {
    const reqBody = await request.json();
    const {
      email,
      name,
      gender,
      address,
      city,
      state,
      pinCode,
      contactNumber,
      dateOfBirth,
      isBatchCoordinator,
      batchId,
    } = reqBody;

    const parsedDateOfBirth = new Date(`${dateOfBirth}`);

    const existingStaff = await prisma.staffDetails.findUnique({
      where: { id: userId },
    });

    let staffDetails;

    if (existingStaff) {
      staffDetails = await prisma.$transaction([
        prisma.staffDetails.update({
          where: { id: userId },
          data: {
            name,
            email,
            gender,
            address,
            city,
            state,
            pinCode,
            contactNumber,
            dateOfBirth: parsedDateOfBirth,
            isBatchCoordinator, // updated data
            batchId: isBatchCoordinator ? batchId : null, // assign batchId only if batch coordinator
            isProfileCompleted: true,
          },
        }),
      ]);
    }

    console.log(
      (existingStaff ? "Updated" : "Created") + " staff details:",
      staffDetails
    );

    return NextResponse.json({
      message: `Staff Details ${
        existingStaff ? "updated" : "created"
      } successfully`,
      success: true,
      staffDetails,
    });
  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
