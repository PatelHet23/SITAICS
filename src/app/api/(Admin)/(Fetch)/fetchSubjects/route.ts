import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "@/utils/auth";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.split(" ")[1] || "";
  const decodedUser = await verifyToken(token);
  const userRole = decodedUser?.role;

  if (!["Admin", "Staff"].includes(userRole!)) {
    return NextResponse.json({ message: "Access Denied!" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const batchId = searchParams.get("batchId");

  try {
    let subjects;

    if (batchId) {
      subjects = await prisma.batchSubject.findMany({
        where: { batchId },
        include: {
          subject: {
            select: {
              subjectId: true,
              subjectName: true,
              subjectCode: true,
              semester: true,
              course: {
                select: {
                  courseName: true,
                },
              },
            },
          },
        },
      });

      if (subjects.length === 0) {
        return NextResponse.json(
          { message: "No subjects found for this batch" },
          { status: 406 }
        );
      }

      const formattedSubjects = subjects.map(({ subject }) => ({
        subjectId: subject.subjectId,
        subjectName: subject.subjectName,
        subjectCode: subject.subjectCode,
        semester: subject.semester,
        courseName: subject.course?.courseName || "N/A",
      }));

      return NextResponse.json(formattedSubjects, { status: 200 });
    } else {
      subjects = await prisma.subject.findMany({
        select: {
          subjectId: true,
          subjectName: true,
          subjectCode: true,
          semester: true,
          course: {
            select: {
              courseName: true,
            },
          },
        },
      });

      const formattedSubjects = subjects.map((subject) => ({
        subjectId: subject.subjectId,
        subjectName: subject.subjectName,
        subjectCode: subject.subjectCode,
        semester: subject.semester,
        courseName: subject.course?.courseName || "N/A",
      }));

      return NextResponse.json(formattedSubjects, { status: 200 });
    }
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return NextResponse.json(
      { error: "Failed to fetch subjects" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
