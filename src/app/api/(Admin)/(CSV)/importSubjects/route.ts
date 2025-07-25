import { NextRequest, NextResponse } from "next/server";
import csv from "csv-parser";
import { Readable } from "stream";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/utils/auth";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.split(" ")[1] || "";
  const decodedUser = await verifyToken(token);
  const userRole = decodedUser?.role;

  if (userRole !== "Admin") {
    return NextResponse.json({ message: "Access Denied!" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file uploaded" },
        { status: 400 }
      );
    }

    console.log(
      "File received:",
      file.name,
      "Size:",
      file.size,
      "Type:",
      file.type
    );

    const buffer = await file.arrayBuffer();
    const results: any[] = [];

    await new Promise<void>((resolve, reject) => {
      Readable.from(Buffer.from(buffer))
        .pipe(csv())
        .on("data", (data) => {
          const normalizedData = Object.fromEntries(
            Object.entries(data).map(([key, value]) => [
              key.replace(/^\uFEFF/, ""),
              value,
            ])
          );
          results.push(normalizedData);
        })
        .on("end", () => resolve())
        .on("error", (error) => reject(error));
    });

    var successRate = 0;
    const failedSubjects: {
      subjectName: string;
      subjectCode: string;
      semester: number;
      courseName: string;
      reason: string;
    }[] = [];
    const duplicateSubjects: {
      subjectName: string;
      subjectCode: string;
      semester: number;
      courseName: string;
      reason: string;
    }[] = [];

    await prisma.$transaction(async (prisma) => {
      for (const subject of results) {
        try {
          const inactiveSubject = await prisma.subject.findFirst({
            where: {
              subjectName: subject.subjectName,
              isActive: false,
            },
          });

          if (inactiveSubject) {
            failedSubjects.push({
              subjectName: subject.subjectName,
              subjectCode: subject.subjectCode,
              semester: subject.semester,
              courseName: subject.courseName,
              reason: "Inactive Subject found",
            });
            continue;
          }

          const existingSubject = await prisma.subject.findFirst({
            where: {
              subjectName: subject.subjectName,
            },
          });

          if (existingSubject) {
            duplicateSubjects.push({
              subjectName: subject.subjectName,
              subjectCode: subject.subjectCode,
              semester: subject.semester,
              courseName: subject.courseName,
              reason: "Subject already exists",
            });
            continue;
          }

          const courseId = await prisma.course.findUnique({
            where: {
              courseName: subject.courseName,
            },
            select: {
              courseId: true,
            },
          });

          if (courseId?.courseId) {
            await prisma.subject.create({
              data: {
                subjectName: subject.subjectName,
                courseId: courseId.courseId,
                subjectCode: subject.subjectCode,
                semester: parseInt(subject.semester),
              },
            });
          } else {
            throw new Error("courseId is required and must be defined.");
          }
          successRate++;
        } catch (error: any) {
          failedSubjects.push({
            subjectName: subject.batchName,
            courseName: subject.courseName,
            subjectCode: subject.subjectCode,
            semester: subject.semester,
            reason: error.message,
          });
        }
      }
    });

    const failureRate = failedSubjects.length;
    const duplicationRate = duplicateSubjects.length;

    return NextResponse.json(
      {
        success: true,
        successRate,
        failureRate,
        duplicationRate,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
