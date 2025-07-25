import { PrismaClient, Role } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminUser = await prisma.user.upsert({
    where: { email: "rajveer@gmail.com" },
    update: {},
    create: {
      email: "rajveer@gmail.com",
      password: await bcrypt.hash("rajveer", 10),
      name: "Rajveer Kania",
      role: Role.Admin,
      username: "rajveerkania",
    },
  });

  const courses = [
    "Computer Science",
    "Electrical Engineering",
    "Mechanical Engineering",
    "Civil Engineering",
    "Chemical Engineering",
  ];

  const batches = [
    "Autumn 2023",
    "Spring 2024",
    "Summer 2024",
    "Autumn 2024",
    "Spring 2025",
  ];

  const subjects = [
    { name: "Mathematics", code: "MATH101" },
    { name: "Physics", code: "PHYS101" },
    { name: "Chemistry", code: "CHEM101" },
    { name: "Introduction to Programming", code: "CS101" },
    { name: "Digital Logic", code: "EE101" },
  ];

  const createdCourses = [];
  const createdBatches = [];
  const createdStudents = [];
  const createdStaffMembers = [];
  const createdSubjects = [];

  for (let i = 0; i < courses.length; i++) {
    const course = await prisma.course.upsert({
      where: { courseName: courses[i] },
      update: {},
      create: { courseName: courses[i] },
    });
    createdCourses.push(course);

    const batch = await prisma.batch.upsert({
      where: { batchName: batches[i] },
      update: {
        courseId: course.courseId,
        batchDuration: 4,
        currentSemester: 1,
      },
      create: {
        batchName: batches[i],
        courseId: course.courseId,
        batchDuration: 4,
        currentSemester: 1,
      },
    });
    createdBatches.push(batch);

    for (const subject of subjects) {
      const createdSubject = await prisma.subject.create({
        data: {
          subjectName: subject.name,
          subjectCode: subject.code,
          semester: 1,
          courseId: course.courseId,
        },
      });
      createdSubjects.push(createdSubject);

      await prisma.batchSubject.create({
        data: {
          batchId: batch.batchId,
          subjectId: createdSubject.subjectId,
          semester: 1,
        },
      });
    }

    for (let j = 1; j <= 10; j++) {
      const email = `${courses[i]
        .toLowerCase()
        .replace(/\s+/g, "")}${j}@example.com`;
      const username = `${courses[i].toLowerCase().replace(/\s+/g, "")}${j}`;
      const existingStudent = await prisma.user.findUnique({
        where: { email },
      });
      if (!existingStudent) {
        const student = await prisma.user.create({
          data: {
            email,
            password: await bcrypt.hash("studentpassword", 10),
            name: `Student ${j}`,
            role: Role.Student,
            username,
            studentDetails: {
              create: {
                email,
                username,
                name: `Student ${j}`,
                enrollmentNumber: `${courses[i]
                  .substring(0, 2)
                  .toUpperCase()}2023${i}${j}`,
                courseName: course.courseName,
                batchName: batch.batchName,
              },
            },
          },
        });
        createdStudents.push(student);
      }
    }

    const staffEmail = `${courses[i]
      .toLowerCase()
      .replace(/\s+/g, "")}staff@example.com`;
    const existingStaff = await prisma.user.findUnique({
      where: { email: staffEmail },
    });
    if (!existingStaff) {
      const staffUser = await prisma.user.create({
        data: {
          email: staffEmail,
          password: await bcrypt.hash("staffpassword", 10),
          name: `${courses[i]} Staff`,
          role: Role.Staff,
          username: `${courses[i].toLowerCase().replace(/\s+/g, "")}staff`,
          staffDetails: {
            create: {
              email: staffEmail,
              username: `${courses[i].toLowerCase().replace(/\s+/g, "")}staff`,
              name: `${courses[i]} Staff`,
              isBatchCoordinator: true,
              batchId: batch.batchId,
            },
          },
        },
      });
      createdStaffMembers.push(staffUser);
    }
  }

  console.log({
    adminUser,
    courses: createdCourses,
    batches: createdBatches,
    subjects: createdSubjects,
    students: createdStudents,
    staffMembers: createdStaffMembers,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
