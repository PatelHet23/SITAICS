"use client";
import Link from "next/link";

const handleLogout = async () => {
  try {
    const response = await fetch("/api/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Logout failed");
    }

    const data = await response.json();
    console.log(data.message);

    window.location.href = "/";
  } catch (err) {
    console.error("Logout failed", err);
  }
};

export default function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h2 className="text-3xl font-bold text-red-600 mb-4">Access Denied!</h2>
      <p className="text-ysm text-gray-700">
        Click{" "}
        <button
          onClick={handleLogout}
          className="text-blue-600 hover:font-bold"
        >
          here
        </button>{" "}
        to return Home
      </p>
    </div>
  );
}
