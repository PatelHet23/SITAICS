import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/utils/auth";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.split(" ")[1] || "";
  const user = await verifyToken(token);
  if (user?.role !== "Admin") {
    return NextResponse.json(
      { message: "Access Denied", success: false },
      { status: 403 }
    );
  }
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get("category");
    switch (category) {
      case "admin":
        const admins = await prisma.user.findMany({
          where: {
            isActive: false,
            role: "Admin",
          },
          select: {
            id: true,
            email: true,
            name: true,
            username: true,
          },
        });
        return NextResponse.json(
          { success: true, records: admins },
          { status: 200 }
        );

      case "student":
        const students = await prisma.studentDetails.findMany({
          where: {
            isActive: false,
          },
          select: {
            id: true,
            email: true,
            name: true,
            username: true,
          },
        });
        return NextResponse.json(
          { success: true, records: students },
          { status: 200 }
        );

      case "staff":
        const staff = await prisma.staffDetails.findMany({
          where: {
            isActive: false,
          },
          select: {
            id: true,
            email: true,
            name: true,
            username: true,
          },
        });
        return NextResponse.json(
          { success: true, records: staff },
          { status: 200 }
        );

      case "batch":
        const batches = await prisma.batch.findMany({
          where: {
            isActive: false,
          },
          select: {
            batchName: true,
            batchId: true,
          },
        });
        const batchRecords = batches.map(({ batchId, batchName }) => ({
          id: batchId,
          batchName,
        }));
        return NextResponse.json(
          { success: true, records: batchRecords },
          { status: 200 }
        );

      case "subject":
        const subjects = await prisma.subject.findMany({
          where: {
            isActive: false,
          },
          select: {
            subjectId: true,
            subjectName: true,
          },
        });
        const subjectRecords = subjects.map(({ subjectId, subjectName }) => ({
          id: subjectId,
          subjectName,
        }));
        return NextResponse.json(
          { success: true, records: subjectRecords },
          { status: 200 }
        );

      case "course":
        const courses = await prisma.course.findMany({
          where: {
            isActive: false,
          },
          select: {
            courseId: true,
            courseName: true,
          },
        });
        // Map `courseId` to `id`
        const courseRecords = courses.map(({ courseId, courseName }) => ({
          id: courseId,
          courseName,
        }));
        return NextResponse.json(
          { success: true, records: courseRecords },
          { status: 200 }
        );

      default:
        return NextResponse.json(
          { message: "Bad request", success: false },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch batches" },
      { status: 500 }
    );
  }
}
