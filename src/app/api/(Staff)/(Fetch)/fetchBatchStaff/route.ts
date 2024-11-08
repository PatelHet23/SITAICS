import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "@/utils/auth";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const decodedUser = verifyToken();
  const userRole = decodedUser?.role;

  if (userRole !== "Staff") {
    return NextResponse.json({ message: "Access Denied!" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const batchId = searchParams.get("batchId");

  try {
    if (batchId) {
      const batch = await prisma.batch.findUnique({
        where: { batchId },
        include: {
          course: {
            select: { courseName: true },
          },
          students: true,
        },
      });

      if (!batch) {
        return NextResponse.json(
          { message: "Batch not found" },
          { status: 404 }
        );
      }

      const formattedBatch = {
        batchId: batch.batchId,
        batchName: batch.batchName,
        courseName: batch.course.courseName
      };

      return NextResponse.json(formattedBatch, { status: 200 });
    } else {
      const batches = await prisma.batch.findMany({
        where: { isActive: true },
        include: {
          course: {
            select: {
              courseName: true,
            },
          },
          students: true,
        },  
      });

      const formattedBatches = batches.map((batch) => ({
        batchId: batch.batchId,
        batchName: batch.batchName,
        courseName: batch.course.courseName
      }));

      return NextResponse.json(formattedBatches, { status: 200 });
    }
  } catch (error) {
    console.error("Error fetching batches:", error);
    return NextResponse.json(
      { error: "Failed to fetch batches" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}