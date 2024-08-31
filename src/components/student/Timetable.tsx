"use client";
import React from "react";

interface TimetableRow {
  time: string;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
}

interface TimetableProps {
  timetableData: TimetableRow[];
}

const Timetable: React.FC<TimetableProps> = ({ timetableData }) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Student Timetable</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2 text-left">Time Slot</th>
              <th className="border p-2 text-left">Monday</th>
              <th className="border p-2 text-left">Tuesday</th>
              <th className="border p-2 text-left">Wednesday</th>
              <th className="border p-2 text-left">Thursday</th>
              <th className="border p-2 text-left">Friday</th>
              <th className="border p-2 text-left">Saturday</th>
            </tr>
          </thead>
          <tbody>
            {timetableData.map((row, index) => (
              <tr key={index} className="hover:bg-gray-100">
                <td className="border p-2">{row.time}</td>
                <td className="border p-2">{row.monday}</td>
                <td className="border p-2">{row.tuesday}</td>
                <td className="border p-2">{row.wednesday}</td>
                <td className="border p-2">{row.thursday}</td>
                <td className="border p-2">{row.friday}</td>
                <td className="border p-2">{row.saturday}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Timetable;