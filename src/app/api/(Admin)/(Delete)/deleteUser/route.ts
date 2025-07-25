import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/utils/auth";

export async function PUT(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.split(" ")[1] || "";
  const decodedUser = await verifyToken(token);
  const userRole = decodedUser?.role;

  if (userRole !== "Admin") {
    return NextResponse.json({ message: "Access Denied!" }, { status: 403 });
  }

  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ message: "Bad Request" }, { status: 400 });
    }

    const userRole = await prisma.user.findUnique({
      where: { id },
      select: {
        role: true,
      },
    });

    switch (userRole?.role) {
      case "Student":
        await prisma.studentDetails.update({
          where: { id },
          data: { isActive: false },
        });
        break;
      case "Staff":
        await prisma.staffDetails.update({
          where: { id },
          data: { isActive: false },
        });
        break;
      default:
        return NextResponse.json(
          { message: "Role undefined" },
          { status: 400 }
        );
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({
      message: "User deleted successfully",
      success: true,
    });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ m: error.message }, { status: 500 });
  }
}
