import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/utils/auth";

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.split(" ")[1] || "";
    const decodedUser = await verifyToken(token);
    const userRole = decodedUser?.role;

    if (userRole !== "Admin") {
      return NextResponse.json({ message: "Access Denied!" }, { status: 403 });
    }

    const { electiveGroupId } = await request.json();

    if (!electiveGroupId) {
      return NextResponse.json(
        { message: "electiveGroupId is required" },
        { status: 400 }
      );
    }

    const electiveGroup = await prisma.electiveGroup.findUnique({
      where: { electiveGroupId },
    });

    if (!electiveGroup) {
      return NextResponse.json(
        { message: "Elective group not found" },
        { status: 404 }
      );
    }

    await prisma.electiveGroup.update({
      where: { electiveGroupId },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json(
      { message: "Elective group deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting elective group:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
