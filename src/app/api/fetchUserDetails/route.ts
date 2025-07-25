import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/utils/auth";

export async function GET(request: NextRequest) {
  try {

    

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    let id = null,
      role = null;

    if (token) {
      const decodedToken = verifyToken();
      if (decodedToken && typeof decodedToken === "object") {
        id = decodedToken.id;
        role = decodedToken.role;
      }
    }

    if (!id || !role) {
      return NextResponse.json({ message: "Bad Request" }, { status: 400 });
    }

    let user;
    switch (role) {
      case "Admin":
        try {
          user = await prisma.user.findUnique({
            where: { id },
            select: {
              name: true,
              email: true,
              username: true,
              role: true,
            },
          });
          return NextResponse.json({ user }, { status: 200 });
        } catch (error) {
          return NextResponse.json(
            { message: "Error while fetching user data!" },
            { status: 500 }
          );
        }

      case "Student":
        try {
          user = await prisma.studentDetails.findUnique({
            where: { id },
            select: {
              id: true,
              email: true,
              username: true,
              name: true,
              fatherName: true,
              motherName: true,
              enrollmentNumber: true,
              courseName: true,
              batchName: true,
              results: true,
              bloodGroup: true,
              dateOfBirth: true,
              gender: true,
              contactNo: true,
              address: true,
              city: true,
              state: true,
              pinCode: true,
              achievements: true,
              isProfileCompleted: true,
            },
          });
          return NextResponse.json({ user, role: "Student" }, { status: 200 });
        } catch (error: any) {
          return NextResponse.json({ message: error.message }, { status: 500 });
        }

      case "Staff":
        try {
          user = await prisma.staffDetails.findUnique({
            where: { id },
            select: {
              id: true,
              email: true,
              username: true,
              name: true,
              gender: true,
              address: true,
              city: true,
              state: true,
              pinCode: true,
              dateOfBirth: true,
              contactNumber: true,
              isBatchCoordinator: true,
              batchId: true,
              subjects: true,
              achievements: true,
              // isProfileCompleted: true
            },
          });
          return NextResponse.json({ user, role: "Staff" }, { status: 200 });
        } catch (error) {
          console.log(error);
          return NextResponse.json(
            { message: "Error while fetching user data!" },
            { status: 500 }
          );
        }

      default:
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { message: "Unexpected error occurred!" },
      { status: 500 }
    );
  }
}
