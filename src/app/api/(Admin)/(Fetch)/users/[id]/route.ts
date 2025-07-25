import { PrismaClient, Role } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(request: Request, props: { params: { id: string } }) {
  const params = await props.params;
  const { id } = params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        studentDetails: {
          include: {
            course: true,
            batch: true,
            electiveChoices: {
              include: {
                subject: true,
                electiveGroup: true,
              },
            },
          },
        },
        staffDetails: {
          include: {
            batch: true,
            subjects: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let roleDetails: any = {};

    if (user.role === Role.Student && user.studentDetails) {
      const {
        id: _id,
        course: _course,
        batch: _batch,
        ...studentDetails
      } = user.studentDetails;

      roleDetails = {
        ...studentDetails,
        courseName: user.studentDetails.course?.courseName,
        batchName: user.studentDetails.batch?.batchName,
        electiveSubjects: user.studentDetails.electiveChoices.map((choice) => ({
          groupName: choice.electiveGroup.groupName,
          subjectName: choice.subject.subjectName,
          subjectCode: choice.subject.subjectCode,
        })),
      };
    } else if (user.role === Role.Staff && user.staffDetails) {
      // Destructure without the 'user' property since it doesn't exist
      const { id: _id, batch: _batch, ...staffDetails } = user.staffDetails;

      roleDetails = {
        ...staffDetails,
        subjects: user.staffDetails.subjects.map((subject) => ({
          subjectName: subject.subjectName,
          subjectCode: subject.subjectCode,
          semester: subject.semester,
        })),
        batchName: user.staffDetails.batch?.batchName,
      };
    }

    const detailedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roleDetails,
    };

    return NextResponse.json(detailedUser);
  } catch (error: any) {
    console.error("Error fetching user details:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const { id } = params;

  try {
    const data = await request.json();
    const { roleDetails, ...userData } = data;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        studentDetails: true,
        staffDetails: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update basic user information
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name: userData.name,
        isActive: userData.isActive,
      },
    });

    // Update role-specific details
    if (user.role === Role.Student) {
      await prisma.studentDetails.update({
        where: { id },
        data: {
          contactNo: roleDetails.contactNo,
          address: roleDetails.address,
          city: roleDetails.city,
          state: roleDetails.state,
          pinCode: roleDetails.pinCode ? parseInt(roleDetails.pinCode) : null,
          fatherName: roleDetails.fatherName,
          motherName: roleDetails.motherName,
          dateOfBirth: roleDetails.dateOfBirth,
          gender: roleDetails.gender,
          bloodGroup: roleDetails.bloodGroup,
          achievements: roleDetails.achievements,
        },
      });
    } else if (user.role === Role.Staff) {
      await prisma.staffDetails.update({
        where: { id },
        data: {
          contactNumber: roleDetails.contactNo,
          address: roleDetails.address,
          city: roleDetails.city,
          state: roleDetails.state,
          pinCode: roleDetails.pinCode ? parseInt(roleDetails.pinCode) : null,
          dateOfBirth: roleDetails.dateOfBirth,
          gender: roleDetails.gender,
          achievements: roleDetails.achievements,
        },
      });
    }

    // Fetch updated user details
    return await GET(request, { params: { id } });
  } catch (error: any) {
    console.error("Error updating user details:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
