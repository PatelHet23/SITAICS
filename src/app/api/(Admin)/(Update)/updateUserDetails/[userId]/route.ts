import { NextResponse } from "next/server";
import { PrismaClient, Role, User, StudentDetails, StaffDetails } from "@prisma/client";

const prisma = new PrismaClient();

type UserWithDetails = User & {
  studentDetails: StudentDetails | null;
  staffDetails: StaffDetails | null;
};

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;

  try {
    const data = await request.json();

    // First, fetch the existing user to determine their role
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: {
        studentDetails: true,
        staffDetails: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Start a transaction to update both user and role-specific details
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Update basic user details
      const userUpdate = await tx.user.update({
        where: { id },
        data: {
          name: data.name,
          email: data.email,
          username: data.username,
          isActive: data.isActive,
        },
      });

      // Update role-specific details
      if (existingUser.role === Role.Student) {
        await tx.studentDetails.update({
          where: { id },
          data: {
            name: data.name,
            email: data.email,
            username: data.username,
            fatherName: data.fatherName,
            motherName: data.motherName,
            enrollmentNumber: data.enrollmentNumber,
            courseName: data.courseName,
            batchName: data.batchName,
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
            gender: data.gender,
            bloodGroup: data.bloodGroup,
            contactNo: data.contactNo,
            address: data.address,
            city: data.city,
            state: data.state,
            pinCode: data.pinCode ? parseInt(data.pinCode) : undefined,
            achievements: data.achievements,
            isProfileCompleted: data.isProfileCompleted,
          },
        });
      } else if (existingUser.role === Role.Staff) {
        await tx.staffDetails.update({
          where: { id },
          data: {
            name: data.name,
            email: data.email,
            username: data.username,
            isBatchCoordinator: data.isBatchCoordinator,
            batchId: data.batchId,
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
            gender: data.gender,
            contactNumber: data.contactNumber,
            achievements: data.achievements,
            address: data.address,
            city: data.city,
            state: data.state,
            pinCode: data.pinCode ? parseInt(data.pinCode) : undefined,
            isProfileCompleted: data.isProfileCompleted,
          },
        });
      }

      // Fetch and return the updated user with all details
      const updatedUserWithDetails = await tx.user.findUnique({
        where: { id },
        include: {
          studentDetails: true,
          staffDetails: true,
        },
      });

      if (!updatedUserWithDetails) {
        throw new Error("Failed to fetch updated user details");
      }

      return updatedUserWithDetails;
    });

    // Since we've added the null check in the transaction, TypeScript knows updatedUser can't be null here
    const roleDetails = getRoleDetails(updatedUser);

    const response = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      username: updatedUser.username,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
      roleDetails,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Helper function to get role-specific details
function getRoleDetails(user: UserWithDetails) {
  if (user.role === Role.Student && user.studentDetails) {
    return {
      ...user.studentDetails,
    };
  } else if (user.role === Role.Staff && user.staffDetails) {
    return {
      ...user.staffDetails,
    };
  }
  return {};
}