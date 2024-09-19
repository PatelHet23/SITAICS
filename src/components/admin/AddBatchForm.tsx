import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import axios from "axios";

interface Course {
  courseName: string;
}

interface AddBatchFormProps {
  onBatchAdded: () => void;
  onTabChange: (tab: string) => void;
}

const AddBatchForm: React.FC<AddBatchFormProps> = ({
  onBatchAdded,
  onTabChange,
}) => {
  const [newBatch, setNewBatch] = useState({
    batchName: "",
    courseName: "",
    batchDuration: "",
    currentSemester: "",
  });
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch("/api/fetchCourses");
      const data = await response.json();
      if (response.status === 200) {
        setCourses(data.courses);
      } else {
        toast.error(data.message);
      }
    } catch (error: any) {
      toast.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post("/api/addBatch", newBatch);
      setNewBatch({
        batchName: "",
        courseName: "",
        batchDuration: "",
        currentSemester: "",
      });
      onBatchAdded();
      onTabChange("manage");
      if (response.status === 200) toast.success("Batch added successfully");
    } catch (error: any) {
      toast.error(error);
    }
  };

  return (
    <form onSubmit={handleAddBatch} className="space-y-4">
      <Input
        placeholder="Batch Name"
        value={newBatch.batchName}
        onChange={(e) =>
          setNewBatch({ ...newBatch, batchName: e.target.value })
        }
        required
      />
      <Select
        value={newBatch.courseName}
        onValueChange={(value) =>
          setNewBatch({ ...newBatch, courseName: value })
        }
        required
      >
        <SelectTrigger>
          <SelectValue placeholder="Select Course" />
        </SelectTrigger>
        <SelectContent>
          {loading ? (
            <SelectItem value="none" disabled>
              Loading Courses...
            </SelectItem>
          ) : courses.length > 0 ? (
            courses.map((course, index) => (
              <SelectItem key={index} value={course.courseName}>
                {course.courseName}
              </SelectItem>
            ))
          ) : (
            <SelectItem value="none" disabled>
              No Courses Available
            </SelectItem>
          )}
        </SelectContent>
      </Select>
      <Input
        placeholder="Duration (in years)"
        type="number"
        value={newBatch.batchDuration}
        onChange={(e) =>
          setNewBatch({ ...newBatch, batchDuration: e.target.value })
        }
        required
      />
      <Input
        placeholder="Current Semester"
        type="number"
        value={newBatch.currentSemester}
        onChange={(e) =>
          setNewBatch({ ...newBatch, currentSemester: e.target.value })
        }
        required
      />
      <Button type="submit" className="flex items-center">
        Create Batch
      </Button>
    </form>
  );
};

export default AddBatchForm;
