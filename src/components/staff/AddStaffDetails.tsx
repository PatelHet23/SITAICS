"use client";
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface AddStaffDetailsProps {
  id: string;
  setShowAddStaffDetails: (value: boolean) => void;
  fetchUserDetails: () => void;
}

const AddStaffDetails: React.FC<AddStaffDetailsProps> = ({
  id,
  setShowAddStaffDetails,
  fetchUserDetails,
}) => {
  const MAX_SUBJECTS = 10;
  const [currentStep, setCurrentStep] = useState(1);
  const [staffFormData, setStaffFormData] = useState({
    id,
    email: "",
    name: "",
    gender: "",
    address: "",
    city: "",
    state: "",
    pinCode: "",
    contactNumber: "",
    dateOfBirth: "",
    isBatchCoordinator: null as boolean | null,
    batchId: "",
    subjectCount: 0,
    subjects: [] as string[],
  });

  const [errors, setErrors] = useState({
    email: "",
    name: "",
    gender: "",
    address: "",
    city: "",
    state: "",
    pinCode: "",
    contactNumber: "",
    dateOfBirth: "",
    batchId: "",
    subjects: "",
    subjectCount: "",
  });

  const [batches, setBatches] = useState<
    {
      batchId: string;
      batchName: string;
      courseName: string;
    }[]
  >([]);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const response = await fetch("/api/fetchBatchStaff");
        if (!response.ok) {
          throw new Error("Failed to fetch batches");
        }
        const data = await response.json();
        setBatches(data);
      } catch (error) {
        console.error("Error fetching batches:", error);
        toast.error("Failed to fetch batches. Please try again.");
      }
    };

    if (staffFormData.isBatchCoordinator) {
      fetchBatches();
    }
  }, [staffFormData.isBatchCoordinator]);

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Logout failed");
      window.location.href = "/";
    } catch (err) {
      console.error("Logout failed", err);
      toast.error("Logout failed. Please try again.");
    }
  };

  const handleStaffInputChange = (
    e: React.ChangeEvent<HTMLElement & { name?: string }>
  ) => {
    const { name, value } = e.target as HTMLInputElement;

    setStaffFormData((prevData) => ({
      ...prevData,
      [name]: name === "pinCode" ? parseInt(value) || "" : value,
    }));

    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: "",
    }));
  };

  const handleBatchCoordinatorChange = (checked: boolean) => {
    setStaffFormData((prev) => ({
      ...prev,
      isBatchCoordinator: checked,
      batchId: checked ? prev.batchId : "",
    }));
  };

  const handleSubjectCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (/^[0-9]*$/.test(value)) {
      const newCount = value === "" ? 0 : parseInt(value, 10);

      if (newCount > MAX_SUBJECTS) {
        toast.error(`Maximum ${MAX_SUBJECTS} subjects are allowed.`);
        return;
      }

      setStaffFormData((prevData) => ({
        ...prevData,
        subjectCount: newCount,
        subjects: Array(newCount)
          .fill("")
          .map((_, i) => prevData.subjects[i] || ""),
      }));
      setErrors((prevErrors) => ({
        ...prevErrors,
        subjectCount: "",
      }));
    }
  };

  const handleSubjectChange = (index: number, value: string) => {
    setStaffFormData((prevData) => {
      const newSubjects = [...prevData.subjects];
      newSubjects[index] = value;
      return {
        ...prevData,
        subjects: newSubjects,
      };
    });
  };

  const validateStep = () => {
    let stepIsValid = true;
    let stepErrors = { ...errors };

    if (currentStep === 1) {
      if (!staffFormData.email) {
        stepErrors.email = "Email is required.";
        stepIsValid = false;
      }
      if (!staffFormData.name) {
        stepErrors.name = "Full Name is required.";
        stepIsValid = false;
      }
      if (!staffFormData.gender) {
        stepErrors.gender = "Gender is required.";
        stepIsValid = false;
      }
    }

    if (currentStep === 2) {
      if (!staffFormData.address) {
        stepErrors.address = "Address is required.";
        stepIsValid = false;
      }
      if (!staffFormData.city) {
        stepErrors.city = "City is required.";
        stepIsValid = false;
      }
      if (!staffFormData.state) {
        stepErrors.state = "State is required.";
        stepIsValid = false;
      }
      if (!staffFormData.pinCode) {
        stepErrors.pinCode = "Pin Code is required.";
        stepIsValid = false;
      }
    }

    if (currentStep === 3) {
      if (!staffFormData.contactNumber) {
        stepErrors.contactNumber = "Contact Number is required.";
        stepIsValid = false;
      }
      if (!staffFormData.dateOfBirth) {
        stepErrors.dateOfBirth = "Date of Birth is required.";
        stepIsValid = false;
      }
      if (staffFormData.isBatchCoordinator && !staffFormData.batchId) {
        stepErrors.batchId = "Batch is required for coordinators.";
        stepIsValid = false;
      }
    }

    if (currentStep === 4) {
      if (staffFormData.subjectCount === 0) {
        stepErrors.subjectCount = "Please select number of subjects.";
        stepIsValid = false;
      }
      if (
        staffFormData.subjectCount > 0 &&
        staffFormData.subjects.some((subject) => !subject.trim())
      ) {
        stepErrors.subjects = "All subject names are required.";
        stepIsValid = false;
      }
    }

    setErrors(stepErrors);

    if (!stepIsValid) {
      console.warn("Validation failed with errors:", stepErrors);
    }

    return stepIsValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/fetchBatchSubjectsStaff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(staffFormData),
      });

      if (response.ok) {
        toast.success("Staff details added successfully.");
        setShowAddStaffDetails(false);
        fetchUserDetails();
      } else {
        toast.error("Failed to add staff details.");
      }
    } catch (error) {
      console.error("An error occurred:", error);
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  const nextStep = () => {
    if (validateStep()) {
      setCurrentStep((prevStep) => prevStep + 1);
    }
  };

  const previousStep = () => {
    setCurrentStep((prevStep) => prevStep - 1);
  };

  return (
    <div className="relative min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="absolute top-4 right-4">
        <Button onClick={handleLogout}>Logout</Button>
      </div>
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-3xl font-bold mb-3 text-center">Staff Details</h1>
        <p className="text-sm text-gray-400 text-center mb-6">
          Enter staff details to continue
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {currentStep === 1 && (
            <>
              <Input
                type="email"
                name="email"
                placeholder="Email"
                value={staffFormData.email}
                onChange={handleStaffInputChange}
                required
              />
              {errors.email && <p className="text-red-500">{errors.email}</p>}
              <Input
                type="text"
                name="name"
                placeholder="Full Name"
                maxLength={30}
                value={staffFormData.name}
                onChange={handleStaffInputChange}
                required
              />
              {errors.name && <p className="text-red-500">{errors.name}</p>}
              <Select
                name="gender"
                onValueChange={(value) =>
                  handleStaffInputChange({
                    target: { name: "gender", value },
                  } as React.ChangeEvent<HTMLSelectElement>)
                }
                value={staffFormData.gender}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Gender" />
                </SelectTrigger>
                <SelectContent>
                  {["Male", "Female", "Other"].map((gender) => (
                    <SelectItem key={gender} value={gender}>
                      {gender}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.gender && <p className="text-red-500">{errors.gender}</p>}
            </>
          )}

          {currentStep === 2 && (
            <>
              <Input
                type="text"
                name="address"
                placeholder="Address"
                maxLength={100}
                value={staffFormData.address}
                onChange={handleStaffInputChange}
                required
              />
              {errors.address && (
                <p className="text-red-500">{errors.address}</p>
              )}
              <Input
                type="text"
                name="city"
                placeholder="City"
                value={staffFormData.city}
                onChange={handleStaffInputChange}
                required
              />
              {errors.city && <p className="text-red-500">{errors.city}</p>}
              <Input
                type="text"
                name="state"
                placeholder="State"
                value={staffFormData.state}
                onChange={handleStaffInputChange}
                required
              />
              {errors.state && <p className="text-red-500">{errors.state}</p>}
              <Input
                type="text"
                name="pinCode"
                placeholder="Pin Code"
                maxLength={6}
                value={staffFormData.pinCode}
                onChange={handleStaffInputChange}
                required
              />
              {errors.pinCode && (
                <p className="text-red-500">{errors.pinCode}</p>
              )}
            </>
          )}

          {currentStep === 3 && (
            <>
              <Input
                type="text"
                name="contactNumber"
                placeholder="Contact Number"
                value={staffFormData.contactNumber}
                onChange={handleStaffInputChange}
                required
              />
              {errors.contactNumber && (
                <p className="text-red-500">{errors.contactNumber}</p>
              )}
              <Input
                type="date"
                name="dateOfBirth"
                placeholder="Date of Birth"
                value={staffFormData.dateOfBirth}
                onChange={handleStaffInputChange}
                required
              />
              {errors.dateOfBirth && (
                <p className="text-red-500">{errors.dateOfBirth}</p>
              )}

              <div className="mt-4">
                <Select
                  value={
                    staffFormData.isBatchCoordinator === null
                      ? ""
                      : staffFormData.isBatchCoordinator
                      ? "Yes"
                      : "No"
                  }
                  onValueChange={(value) =>
                    handleBatchCoordinatorChange(value === "Yes")
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Are you a Batch Coordinator?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {staffFormData.isBatchCoordinator && (
                <div className="mt-2">
                  <Select
                    name="batchId"
                    value={staffFormData.batchId}
                    onValueChange={(value) =>
                      handleStaffInputChange({
                        target: { name: "batchId", value },
                      } as React.ChangeEvent<HTMLSelectElement>)
                    }
                    required
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Batch" />
                    </SelectTrigger>
                    <SelectContent>
                      {batches.map((batch) => (
                        <SelectItem key={batch.batchId} value={batch.batchId}>
                          {batch.batchName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.batchId && (
                    <p className="text-red-500">{errors.batchId}</p>
                  )}
                </div>
              )}
            </>
          )}

          {currentStep === 4 && (
            <div className="flex flex-col space-y-2">
              <div className="mt-4">
                <label className="block mb-3 font-medium text-sm">
                  Number of Subjects
                </label>
                <Select
                  name="subjectCount"
                  value={
                    staffFormData.subjectCount > 0
                      ? staffFormData.subjectCount.toString()
                      : ""
                  }
                  onValueChange={(value) =>
                    handleSubjectCountChange({
                      target: { value },
                    } as React.ChangeEvent<HTMLInputElement>)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Total Subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((count) => (
                      <SelectItem key={count} value={count.toString()}>
                        {count}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {errors.subjectCount && (
                  <p className="text-red-500">{errors.subjectCount}</p>
                )}
              </div>
              {Array.from({ length: staffFormData.subjectCount }).map(
                (_, index) => (
                  <Input
                    key={index}
                    type="text"
                    name={`subject-${index}`}
                    placeholder={`Subject ${index + 1}`}
                    value={staffFormData.subjects[index] || ""}
                    onChange={(e) => handleSubjectChange(index, e.target.value)}
                  />
                )
              )}
              {errors.subjects && (
                <p className="text-red-500">{errors.subjects}</p>
              )}
            </div>
          )}

          <div className="flex justify-between">
            {currentStep > 1 && (
              <Button type="button" onClick={previousStep}>
                Previous
              </Button>
            )}
            <Button
              type={currentStep === 4 ? "submit" : "button"}
              onClick={currentStep === 4 ? handleSubmit : nextStep}
            >
              {currentStep === 4 ? "Submit" : "Next"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStaffDetails;
