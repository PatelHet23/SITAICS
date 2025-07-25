import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/utils/auth";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.split(" ")[1] || "";
  const decodedUser = await verifyToken(token);

  const userRole = decodedUser?.role;

  if (userRole !== "Student") {
    return NextResponse.json({ message: "Access Denied!" }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    if (!studentId) {
      return NextResponse.json(
        { error: "studentId is required" },
        { status: 400 }
      );
    }

    const studentWithSubjects = await prisma.studentDetails.findUnique({
      where: { id: studentId },
      select: {
        courseName: true,
        batchName: true,
        course: {
          select: {
            subjects: {
              select: {
                subjectId: true,
                subjectName: true,
                subjectCode: true,
                semester: true,
                staff: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        batch: {
          select: {
            subjects: {
              select: {
                subject: {
                  select: {
                    subjectId: true,
                    subjectName: true,
                    subjectCode: true,
                    semester: true,
                    staff: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                      },
                    },
                  },
                },
                semester: true,
              },
            },
            staffMembers: {
              select: {
                id: true,
                name: true,
                email: true,
                subjects: {
                  select: {
                    subjectId: true,
                    subjectName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!studentWithSubjects) {
      throw new Error("Student not found");
    }

    const staffMap = new Map();
    studentWithSubjects.batch?.staffMembers.forEach((staff) => {
      staff.subjects.forEach((subject) => {
        if (!staffMap.has(subject.subjectId)) {
          staffMap.set(subject.subjectId, [
            {
              id: staff.id,
              name: staff.name,
              email: staff.email,
            },
          ]);
        } else {
          staffMap.get(subject.subjectId).push({
            id: staff.id,
            name: staff.name,
            email: staff.email,
          });
        }
      });
    });

    const allSubjects = [
      ...(studentWithSubjects.course?.subjects || []),
      ...(studentWithSubjects.batch?.subjects.map((bs) => ({
        ...bs.subject,
        semester: bs.semester,
      })) || []),
    ];

    const uniqueSubjects = allSubjects.reduce(
      (acc, subject) => {
        if (!acc.some((s) => s.subjectId === subject.subjectId)) {
          const staffFromMap = staffMap.get(subject.subjectId) || [];
          const subjectStaff = subject.staff || [];
          const combinedStaff = [...staffFromMap, ...subjectStaff].filter(
            (staff, index, self) =>
              index === self.findIndex((t) => t.id === staff.id)
          );

          acc.push({
            subjectId: subject.subjectId,
            subjectName: subject.subjectName,
            subjectCode: subject.subjectCode,
            semester: subject.semester,
            staff: combinedStaff.length > 0 ? combinedStaff : "NA",
          });
        }
        return acc;
      },
      [] as Array<{
        subjectId: string;
        subjectName: string;
        subjectCode: string;
        semester: number;
        staff: Array<{ id: string; name: string; email: string }> | "NA";
      }>
    );

    return NextResponse.json({
      studentId,
      courseName: studentWithSubjects.courseName,
      batchName: studentWithSubjects.batchName,
      subjects: uniqueSubjects,
    });
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching subjects" },
      { status: 500 }
    );
  }
}
