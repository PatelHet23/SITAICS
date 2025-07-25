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
    const failedBatches: {
      batchName: string;
      courseName: string;
      duration: number;
      currentSemester: number;
      reason: string;
    }[] = [];
    const duplicateBatches: {
      batchName: string;
      courseName: string;
      duration: number;
      currentSemester: number;
      reason: string;
    }[] = [];

    await prisma.$transaction(async (prisma) => {
      for (const batch of results) {
        try {
          const inactiveBatch = await prisma.batch.findFirst({
            where: {
              batchName: batch.batchName,
              isActive: false,
            },
          });

          if (inactiveBatch) {
            failedBatches.push({
              batchName: batch.batchName,
              courseName: batch.courseName,
              duration: batch.duration,
              currentSemester: batch.currentSemester,
              reason: "Inactive batch found",
            });
            continue;
          }

          const existingBatch = await prisma.batch.findFirst({
            where: {
              batchName: batch.batchName,
            },
          });

          if (existingBatch) {
            duplicateBatches.push({
              batchName: batch.batchName,
              courseName: batch.courseName,
              duration: batch.duration,
              currentSemester: batch.currentSemester,
              reason: "Batch already exists",
            });
            continue;
          }

          const courseId = await prisma.course.findUnique({
            where: {
              courseName: batch.courseName,
            },
            select: {
              courseId: true,
            },
          });

          if (courseId?.courseId) {
            await prisma.batch.create({
              data: {
                batchName: batch.batchName,
                courseId: courseId.courseId,
                batchDuration: parseInt(batch.duration, 5),
                currentSemester: parseInt(batch.currentSemester, 9),
              },
            });
          } else {
            throw new Error("courseId is required and must be defined.");
          }
          successRate++;
        } catch (error: any) {
          failedBatches.push({
            batchName: batch.batchName,
            courseName: batch.courseName,
            duration: batch.duration,
            currentSemester: batch.currentSemester,
            reason: error.message,
          });
        }
      }
    });

    const failureRate = failedBatches.length;
    const duplicationRate = duplicateBatches.length;

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
