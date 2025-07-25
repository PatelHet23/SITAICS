import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/utils/auth";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.split(" ")[1] || "";
    const decodedUser = await verifyToken(token);
    const userRole = decodedUser?.role;

    if (userRole !== "Admin") {
      return NextResponse.json({ message: "Access Denied!" }, { status: 403 });
    }

    const electiveGroups = await prisma.electiveGroup.findMany({
      include: {
        course: true,
      },
    });

    return NextResponse.json({ groups: electiveGroups }, { status: 200 });
  } catch (error) {
    console.error("Error fetching elective groups:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
