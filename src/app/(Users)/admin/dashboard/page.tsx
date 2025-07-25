"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/StatCard";
import { IndianCalendar } from "@/components/IndianCalendar";
import { UserDetailsDialog } from "@/components/admin/UserDetailsDialog";
import { Navbar } from "@/components/Navbar";
import UsersTab from "@/components/admin/UsersTab";
import CoursesTab from "@/components/admin/CoursesTab";
import SubjectsTab from "@/components/admin/SubjectsTab";
import LeavesTab from "@/components/admin/LeavesTab";
import AttendanceTab from "@/components/admin/Attendance";
import BatchTab from "@/components/admin/BatchTab";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { Toaster, toast } from "sonner";
import AccessDenied from "@/components/accessDenied";
import InactiveRecords from "@/components/admin/InactiveRecords";

interface CourseData {
  courseName: string;
  Students: number;
}

interface Stats {
  studentCount: number;
  staffCount: number;
  totalCoursesCount: number;
  formattedCourseData: CourseData[];
}

const AdminDashboard = () => {
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [overviewStats, setOverviewStats] = useState<Stats | null>(null);

  const tabs = [
    "Overview",
    "Users",
    "Courses",
    "Batches",
    "Subjects",
    "Leaves",
    "Attendance",
    "Inactive",
  ];

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await fetch("/api/fetchUserDetails", {
          method: "GET",
          credentials: "include",
        });
        const data = await response.json();
        if (response.status !== 200)
          toast.error(data.message || "Error while fetching user data");

        const overviewStatsResponse = await fetch(`/api/overviewStats`);
        const stats = await overviewStatsResponse.json();
        if (
          overviewStatsResponse.status !== 200 &&
          overviewStatsResponse.status !== 403
        )
          toast.error(stats.message || "Error while fetching the stats");
        else if (overviewStatsResponse.status === 403) {
          return <AccessDenied />;
        }

        setOverviewStats(stats);
        setUserData(data.user);
      } catch (error) {
        toast.error("Error while fetching the data!");
      } finally {
        setLoading(false);
      }
    };
    fetchUserDetails();
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  if (loading) {
    return (
      <div className="">
        <LoadingSkeleton loadingText="Dashboard" />;
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster />
      <Navbar name={userData?.name} role={userData?.role} />
      <div className="container mx-auto mt-8 px-4">
        <div className="lg:hidden mb-4">
          <button
            className="p-2 rounded-md bg-gray-200 hover:bg-gray-300"
            onClick={toggleMobileMenu}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16m-7 6h7"
              />
            </svg>
          </button>
        </div>
        <div
          className={`${
            isMobileMenuOpen ? "flex" : "hidden"
          } lg:hidden flex-col bg-gray-800 absolute top-0 left-0 w-full h-full p-4 z-10 transition-all duration-300 ease-in-out`}
        >
          <button
            className="self-end p-2 rounded-md hover:bg-gray-700"
            onClick={toggleMobileMenu}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <ul className="mt-6 space-y-4">
            {tabs.map((tab) => (
              <li key={tab} className="w-full">
                <button
                  className={`w-full text-left px-4 py-2 rounded-md transition-colors duration-300 ease-in-out transform hover:scale-105 ${
                    activeTab === tab.toLowerCase()
                      ? "bg-gray-900 text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                  onClick={() => {
                    setActiveTab(tab.toLowerCase());
                    toggleMobileMenu();
                  }}
                >
                  {tab}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Desktop Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="hidden lg:flex flex-wrap justify-start gap-2 mb-8 p-4 bg-white text-black rounded-lg shadow-md">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab.toLowerCase()}
                className={`
                  flex-grow basis-full sm:basis-1/2 md:basis-auto
                  text-center px-4 py-2 rounded-md
                  font-medium text-sm
                  transition-all duration-200 ease-in-out
                  ${
                    activeTab === tab.toLowerCase()
                      ? "bg-gray-900 text-white shadow-md shadow-gray-800 border-b-4 border-gray-600 z-10 relative"
                      : "bg-gray-200 text-black hover:bg-gray-300"
                  }
                `}
                onClick={() => setActiveTab(tab.toLowerCase())}
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Overview Tab Content */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              <StatCard
                title="Total Students"
                value={overviewStats?.studentCount || ""}
                description={""}
              />
              <StatCard
                title="Total Staff Members"
                value={overviewStats?.staffCount || ""}
                description={""}
              />
              <StatCard
                title="Total Courses"
                value={overviewStats?.totalCoursesCount || ""}
                description={""}
              />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Students per Course</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="w-full h-[300px] sm:h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={overviewStats?.formattedCourseData || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="courseName" />
                        response
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Students" fill="#000000" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Calendar</CardTitle>
                </CardHeader>
                <CardContent>
                  <IndianCalendar />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <UsersTab />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="courses">
            <Card>
              <CardHeader>
                <CardTitle>Course Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CoursesTab />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="batches">
            <Card>
              <CardHeader>
                <CardTitle>Batch Management</CardTitle>
              </CardHeader>
              <CardContent>
                <BatchTab />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="subjects">
            <Card>
              <CardHeader>
                <CardTitle>Subject Management</CardTitle>
              </CardHeader>
              <CardContent>
                <SubjectsTab />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="leaves">
            <Card>
              <CardHeader>
                <CardTitle>Leave Management</CardTitle>
              </CardHeader>
              <CardContent>
                <LeavesTab />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Management</CardTitle>
              </CardHeader>
              <CardContent>
                <AttendanceTab />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="inactive">
            <Card>
              <CardHeader>
                <CardTitle>Inactive Records</CardTitle>
              </CardHeader>
              <CardContent>
                <InactiveRecords />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <UserDetailsDialog
        open={showUserDetails}
        onOpenChange={setShowUserDetails}
        userId={""}
      />
    </div>
  );
};

export default AdminDashboard;
