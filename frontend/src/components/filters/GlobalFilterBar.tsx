import { Filter, Calendar, Building, Book } from "lucide-react";

export default function GlobalFilterBar() {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3 flex flex-wrap items-center gap-4 shadow-sm z-10 relative">
      <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
        <Filter size={16} /> Global Scope
      </div>
      
      <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
        <Calendar size={14} className="text-gray-500" />
        <select className="bg-transparent text-sm font-semibold text-gray-700 focus:outline-none cursor-pointer">
          <option>Academic Year: 2026-2027</option>
          <option>Academic Year: 2025-2026</option>
        </select>
      </div>

      <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
        <Calendar size={14} className="text-gray-500" />
        <select className="bg-transparent text-sm font-semibold text-gray-700 focus:outline-none cursor-pointer">
          <option>Semester: Term 1</option>
          <option>Semester: Term 2</option>
        </select>
      </div>

      <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
        <Building size={14} className="text-gray-500" />
        <select className="bg-transparent text-sm font-semibold text-gray-700 focus:outline-none cursor-pointer">
          <option>All Departments</option>
          <option>Computer Science (CSE)</option>
          <option>Electronics (ECE)</option>
          <option>Mechanical (MECH)</option>
        </select>
      </div>
      
      <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
        <Book size={14} className="text-gray-500" />
        <select className="bg-transparent text-sm font-semibold text-gray-700 focus:outline-none cursor-pointer">
          <option>All Programmes</option>
          <option>B.Tech</option>
          <option>M.Tech</option>
        </select>
      </div>
    </div>
  );
}
