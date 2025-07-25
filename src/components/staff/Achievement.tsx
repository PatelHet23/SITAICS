import React, { useState, useEffect } from "react";
import { FaRegEdit, FaTrashAlt } from "react-icons/fa";

interface Achievement {
  id: number;
  title: string;
  description: string;
  date: string;
  category: string;
}

const AchievementComponent: React.FC = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [activeTab, setActiveTab] = useState<"view" | "add">("view");

  const categories = [
    "Academic",
    "Sports",
    "Extracurricular",
    "Professional",
    "Other",
  ];

  useEffect(() => {
    const storedAchievements = localStorage.getItem("achievements");
    if (storedAchievements) {
      setAchievements(JSON.parse(storedAchievements));
    }
  }, []);

  const filteredAchievements = achievements.filter((a) => {
    const matchesSearch = a.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === "All" || a.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (id: number) => {
    const achievement = achievements.find((a) => a.id === id);
    if (achievement) {
      setTitle(achievement.title);
      setDescription(achievement.description);
      setDate(achievement.date);
      setCategory(achievement.category);
      setEditingId(id);
      setActiveTab("add");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId !== null) {
      setAchievements((prev) =>
        prev.map((ach) =>
          ach.id === editingId
            ? { ...ach, title, description, date, category }
            : ach
        )
      );
      setEditingId(null);
    } else {
      const newAchievement: Achievement = {
        id: Date.now(),
        title,
        description,
        date,
        category,
      };
      setAchievements([...achievements, newAchievement]);
    }
    resetForm();
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDate("");
    setCategory("");
    setEditingId(null);
  };

  const handleDelete = async (achievement: Achievement) => {
    try {
      const response = await fetch("/api/deleteAchievement", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(achievement),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Deleted:", data);
        setAchievements((prev) => prev.filter((a) => a.id !== achievement.id));
      } else {
        throw new Error("Failed to delete achievement");
      }
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 md:p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Achievements</h2>

      <div className="flex mb-4 border-b">
        <button
          className={`flex-1 p-2 ${
            activeTab === "view" ? "bg-black text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("view")}
        >
          View
        </button>
        <button
          className={`flex-1 p-2 ${
            activeTab === "add" ? "bg-black text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("add")}
        >
          Add
        </button>
      </div>

      {activeTab === "view" && (
        <div>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="p-2 border rounded w-full"
            />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="p-2 border rounded w-full md:w-1/3"
            >
              <option value="All">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {filteredAchievements.length > 0 ? (
            filteredAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className="border p-4 mb-4 rounded shadow"
              >
                <h3 className="text-xl font-semibold">{achievement.title}</h3>
                <p>{achievement.description}</p>
                <p className="text-sm text-gray-500">
                  {achievement.date} | {achievement.category}
                </p>
                <div className="flex space-x-2 mt-2">
                  <button
                    onClick={() => handleEdit(achievement.id)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded flex items-center"
                  >
                    <FaRegEdit className="mr-2" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(achievement)}
                    className="bg-red-600 text-white px-3 py-1 rounded flex items-center"
                  >
                    <FaTrashAlt className="mr-2" /> Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p>No achievements found.</p>
          )}
        </div>
      )}

      {activeTab === "add" && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full p-2 border rounded"
            required
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
          >
            {editingId ? "Update Achievement" : "Add Achievement"}
          </button>
        </form>
      )}
    </div>
  );
};

export default AchievementComponent;
