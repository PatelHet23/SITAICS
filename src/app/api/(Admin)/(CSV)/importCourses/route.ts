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
    const failedCourses: { courseName: string; reason: string }[] = [];
    const duplicateCourses: { courseName: string; reason: string }[] = [];

    await prisma.$transaction(async (prisma) => {
      for (const course of results) {
        try {
          const inactiveCourse = await prisma.course.findFirst({
            where: {
              courseName: course.courseName,
              isActive: false,
            },
          });

          if (inactiveCourse) {
            failedCourses.push({
              courseName: course.courseName,
              reason: "Inactive course found",
            });
            continue;
          }

          const existingCourse = await prisma.course.findFirst({
            where: {
              courseName: course.courseName,
            },
          });

          if (existingCourse) {
            duplicateCourses.push({
              courseName: course.courseName,
              reason: "Course already exists",
            });
            continue;
          }

          await prisma.course.create({
            data: {
              courseName: course.courseName,
            },
          });

          successRate++;
        } catch (error: any) {
          failedCourses.push({
            courseName: course.courseName,
            reason: error.message,
          });
        }
      }
    });

    const failureRate = failedCourses.length;
    const duplicationRate = duplicateCourses.length;

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
