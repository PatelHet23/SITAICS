import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FiCheck, FiX, FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi';

interface Leave {
  id: string;
  studentName: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Denied';
  leaveType: string;
  fromDate: string;
  toDate: string;
}

const Leave = () => {
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [leaves, setLeaves] = useState<Leave[]>([]);

  // Fetch leave requests from the API
  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const response = await fetch('/api/fetchLeave');
        const data = await response.json();
        if (data.success) {
          setLeaves(data.leaves);
        } else {
          console.error("Failed to fetch leaves:", data.message);
        }
      } catch (error) {
        console.error("Error fetching leaves:", error);
      }
    };
    fetchLeaves();
  }, []);
  
  const activeLeaves = leaves.filter(leave => leave.status === 'Pending');
  const archivedLeaves = leaves.filter(leave => leave.status !== 'Pending');

  const handleApprove = async (leaveId: string) => {
    try {
      const response = await fetch('/api/approveLeave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaveId }),
      });
      const data = await response.json();
      if (data.success) {
        setLeaves(prevLeaves => prevLeaves.map(leave => 
          leave.id === leaveId ? { ...leave, status: 'Approved' } : leave
        ));
      } else {
        console.error("Failed to approve leave:", data.message);
      }
    } catch (error) {
      console.error("Error approving leave:", error);
    }
  };

  const handleDeny = async (leaveId: string) => {
    try {
      const response = await fetch('/api/denyLeave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaveId }),
      });
      const data = await response.json();
      if (data.success) {
        setLeaves(prevLeaves => prevLeaves.map(leave => 
          leave.id === leaveId ? { ...leave, status: 'Denied' } : leave
        ));
      } else {
        console.error("Failed to deny leave:", data.message);
      }
    } catch (error) {
      console.error("Error denying leave:", error);
    }
  };

  return (
    <div className="p-15 mx-auto max-w-10xl">
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Leave Requests</h2>

        <div className="mb-4">
          <Button
            onClick={() => setActiveTab('active')}
            className={`mr-2 ${activeTab === 'active' ? 'bg-black text-white' : 'bg-gray-200 text-black'} py-2 px-4 rounded-lg transition-transform transform hover:scale-105`}
          >
            Active
          </Button>
          <Button
            onClick={() => setActiveTab('archived')}
            className={`${activeTab === 'archived' ? 'bg-black text-white' : 'bg-gray-200 text-black'} py-2 px-4 rounded-lg transition-transform transform hover:scale-105`}
          >
            Archived
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table className="w-full border-collapse">
            <TableHeader className="bg-gray-100">
              <TableRow>
                <TableHead className="p-4 text-left">Name</TableHead>
                <TableHead className="p-4 text-left">Reason</TableHead>
                <TableHead className="p-4 text-left">Leave Type</TableHead>
                <TableHead className="p-4 text-left">From Date</TableHead>
                <TableHead className="p-4 text-left">To Date</TableHead>
                <TableHead className="p-4 text-left">Status</TableHead>
                <TableHead className="p-4 text-left">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(activeTab === 'active' ? activeLeaves : archivedLeaves).map((leave) => (
                <TableRow key={leave.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <TableCell className="p-4 border-b">{leave.studentName || 'N/A'}</TableCell>
                  <TableCell className="p-4 border-b">{leave.reason}</TableCell>
                  <TableCell className="p-4 border-b">{leave.leaveType}</TableCell>
                  <TableCell className="p-4 border-b">{leave.fromDate}</TableCell>
                  <TableCell className="p-4 border-b">{leave.toDate}</TableCell>
                  <TableCell className="p-4 border-b">
                    <span
                      className={`flex items-center space-x-2 px-3 py-1 rounded-full font-semibold $(
                        leave.status === 'Pending' ? 'text-gray-500' :
                        leave.status === 'Approved' ? 'bg-green-500 text-white' :
                        'bg-red-500 text-white'
                      ) transition-colors duration-300`}
                    >
                      {leave.status === 'Pending' && <FiClock />}
                      {leave.status === 'Approved' && <FiCheckCircle />}
                      {leave.status === 'Denied' && <FiXCircle />}
                      <span>{leave.status}</span>
                    </span>
                  </TableCell>
                  <TableCell className="p-4 border-b">
                    {activeTab === 'active' && leave.status === 'Pending' ? (
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleApprove(leave.id)}
                          className="flex items-center space-x-2 bg-black hover:bg-gray-800 text-white font-semibold py-1 px-3 rounded-lg transition-transform transform hover:scale-105"
                        >
                          <FiCheck />
                          <span>Approve</span>
                        </Button>
                        <Button
                          onClick={() => handleDeny(leave.id)}
                          className="flex items-center space-x-2 bg-gray-300 hover:bg-gray-400 text-black font-semibold py-1 px-3 rounded-lg transition-transform transform hover:scale-105"
                        >
                          <FiX />
                          <span>Deny</span>
                        </Button>
                      </div>
                    ) : (
                      activeTab === 'archived' && (
                        <div className="flex space-x-2">
                          {leave.status !== 'Approved' && (
                            <Button
                              onClick={() => handleApprove(leave.id)}
                              className="flex items-center space-x-2 bg-black hover:bg-gray-800 text-white font-semibold py-1 px-3 rounded-lg transition-transform transform hover:scale-105"
                            >
                              <FiCheck />
                              <span>Approve</span>
                            </Button>
                          )}
                          {leave.status !== 'Denied' && (
                            <Button
                              onClick={() => handleDeny(leave.id)}
                              className="flex items-center space-x-2 bg-gray-300 hover:bg-gray-400 text-black font-semibold py-1 px-3 rounded-lg transition-transform transform hover:scale-105"
                            >
                              <FiX />
                              <span>Deny</span>
                            </Button>
                          )}
                        </div>
                      )
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default Leave;
