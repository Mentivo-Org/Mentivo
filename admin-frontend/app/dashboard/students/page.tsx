"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Edit2, Trash2, Search, X } from "lucide-react";

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Edit State
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    grade: ""
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchStudents(searchTerm);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const fetchStudents = async (query = "") => {
    setLoading(true);
    try {
      const { data } = await api.get(`/students?search=${encodeURIComponent(query)}`);
      setStudents(data);
    } catch (err) {
      console.error("Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (student: any) => {
    setEditingStudent(student);
    setEditForm({
      name: student.name || "",
      email: student.email || "",
      phone: student.phone || "",
      grade: student.grade || ""
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    setIsSaving(true);
    try {
      const { data } = await api.put(`/students/${editingStudent.id}`, editForm);
      
      // Update local state
      setStudents(students.map(s => s.id === editingStudent.id ? data : s));
      setEditingStudent(null);
    } catch (err) {
      alert("Failed to update student.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this student?")) return;
    try {
      await api.delete(`/students/${id}`);
      setStudents(students.filter(s => s.id !== id));
    } catch (err) {
      alert("Failed to delete student.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-text">Student Management</h1>
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-4">
          <div className="relative flex-1 max-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search students by name or email..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-secondary text-sm font-semibold uppercase tracking-wider">
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Phone</th>
              <th className="px-6 py-4">Grade</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-secondary">Loading students...</td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-secondary">No students found.</td></tr>
            ) : students.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-text">{student.name}</td>
                <td className="px-6 py-4 text-secondary">{student.email}</td>
                <td className="px-6 py-4 text-secondary">{student.phone}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded uppercase">
                    {student.grade || "N/A"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-3">
                  <button 
                    onClick={() => handleEditClick(student)}
                    className="text-primary hover:text-primary-dark inline-flex items-center"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(student.id)}
                    className="text-red-500 hover:text-red-700 inline-flex items-center"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card w-full max-w-md rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-text">Edit Student</h2>
              <button 
                onClick={() => setEditingStudent(null)}
                className="text-gray-400 hover:text-text transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Email Address (Cannot be changed)</label>
                <input
                  type="email"
                  disabled
                  className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg outline-none cursor-not-allowed text-gray-500"
                  value={editForm.email}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Phone Number</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Grade</label>
                <select 
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary"
                  value={editForm.grade}
                  onChange={(e) => setEditForm({...editForm, grade: e.target.value})}
                >
                  <option value="">Select Grade</option>
                  <option value="11">Class 11</option>
                  <option value="12">Class 12</option>
                  <option value="Dropper">Dropper</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-secondary font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
