"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Database, Plus, Trash2, ArrowUpDown, ChevronLeft, ChevronRight, SlidersHorizontal, Eye, Save, X, Key, Check } from "lucide-react";
import { Skeleton } from "@/components/Skeleton";

interface FieldMeta {
  name: string;
  type: string;
  isRequired: boolean;
  isList: boolean;
  isId: boolean;
  isUnique: boolean;
  relationName?: string;
}

interface TableMeta {
  name: string;
  dbName: string;
  fields: FieldMeta[];
  rowCount: number;
}

export default function DatabasePage() {
  const [tables, setTables] = useState<TableMeta[]>([]);
  const [selectedTable, setSelectedTable] = useState<TableMeta | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  
  // Pagination & query state
  const [totalRows, setTotalRows] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [sortBy, setSortBy] = useState("");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<any[]>([]); // [{ field, operator, value }]

  // Inline edit state
  const [editingCell, setEditingCell] = useState<{ rowId: string; colName: string } | null>(null);
  const [editingValue, setEditingValue] = useState("");

  // Create Row State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newRowData, setNewRowData] = useState<any>({});

  // Error & loading
  const [isTablesLoading, setIsTablesLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch tables list on mount
  useEffect(() => {
    const fetchTables = async () => {
      try {
        setIsTablesLoading(true);
        const res = await api.get("/database/tables");
        setTables(res.data);
        if (res.data.length > 0) {
          setSelectedTable(res.data[0]);
        }
      } catch (err: any) {
        setError("Failed to load schema tables meta");
      } finally {
        setIsTablesLoading(false);
      }
    };
    fetchTables();
  }, []);

  // 2. Fetch rows when parameters or selected table changes
  const fetchRows = async () => {
    if (!selectedTable) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get(`/database/tables/${selectedTable.name}/rows`, {
        params: {
          page,
          limit,
          sortBy,
          order,
          search: search || undefined,
          filters: filters.length > 0 ? JSON.stringify(filters) : undefined
        }
      });
      setRows(res.data.data);
      setTotalRows(res.data.total);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch table records");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    setSortBy("");
    setFilters([]);
    setSearch("");
  }, [selectedTable]);

  useEffect(() => {
    fetchRows();
  }, [selectedTable, page, limit, sortBy, order, filters]);

  // Handle row deletion
  const handleDeleteRow = async (rowId: string) => {
    if (!selectedTable) return;
    const token = `delete-${selectedTable.name}-${rowId}`;
    if (!confirm(`Are you absolutely sure you want to delete this row from ${selectedTable.name}?`)) return;
    
    try {
      await api.delete(`/database/tables/${selectedTable.name}/rows/${rowId}?confirmationToken=${token}`);
      fetchRows();
    } catch (err: any) {
      alert(err.response?.data?.error || "Deletion failed");
    }
  };

  // Handle inline edit submit
  const handleInlineSave = async (rowId: string, colName: string, originalType: string) => {
    if (!selectedTable) return;
    try {
      let finalValue: any = editingValue;
      if (originalType === "Int") finalValue = parseInt(editingValue, 10);
      else if (originalType === "Float" || originalType === "Decimal") finalValue = parseFloat(editingValue);
      else if (originalType === "Boolean") finalValue = editingValue === "true" || editingValue === "1";

      await api.put(`/database/tables/${selectedTable.name}/rows/${rowId}`, {
        [colName]: finalValue
      });
      setEditingCell(null);
      fetchRows();
    } catch (err: any) {
      alert(err.response?.data?.error || "Update failed");
    }
  };

  // Add filters dynamically
  const addFilter = () => {
    if (!selectedTable) return;
    const firstField = selectedTable.fields[0]?.name;
    setFilters([...filters, { field: firstField, operator: "equals", value: "" }]);
  };

  const removeFilter = (idx: number) => {
    setFilters(filters.filter((_, i) => i !== idx));
  };

  // Handle creating a new row
  const handleCreateRow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable) return;
    
    try {
      // Cast forms inputs correctly
      const payload: any = {};
      selectedTable.fields.forEach((f) => {
        const val = newRowData[f.name];
        if (val === undefined || val === "") return;
        
        if (f.type === "Int") payload[f.name] = parseInt(val, 10);
        else if (f.type === "Float" || f.type === "Decimal") payload[f.name] = parseFloat(val);
        else if (f.type === "Boolean") payload[f.name] = val === "true";
        else payload[f.name] = val;
      });

      await api.post(`/database/tables/${selectedTable.name}/rows`, payload);
      setIsCreateOpen(false);
      setNewRowData({});
      fetchRows();
    } catch (err: any) {
      alert(err.response?.data?.error || "Creation failed");
    }
  };

  return (
    <div className="flex h-[calc(100vh-10rem)] border border-border bg-cardSolid rounded-3xl overflow-hidden shadow-glass relative">
      
      {/* Tables sidebar navigation */}
      <aside className="w-64 border-r border-border bg-card/10 flex flex-col h-full shrink-0">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Database size={18} className="text-primary" />
          <h2 className="font-bold text-sm text-text uppercase tracking-wider">Public Tables</h2>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-2">
          {isTablesLoading ? (
            [...Array(8)].map((_, i) => (
              <div key={i} className="px-3 py-1">
                <Skeleton className="h-7 w-full rounded-lg" />
              </div>
            ))
          ) : (
            tables.map((tbl) => (
              <button
                key={tbl.name}
                onClick={() => setSelectedTable(tbl)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${selectedTable?.name === tbl.name ? "bg-primary text-white" : "text-secondary hover:text-text hover:bg-black/5"}`}
              >
                <span className="truncate">{tbl.name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${selectedTable?.name === tbl.name ? "bg-white/20 text-white" : "bg-primary/10 text-primary"}`}>
                  {tbl.rowCount}
                </span>
              </button>
            ))
          )}
        </nav>
      </aside>

      {/* Main Grid View */}
      <main className="flex-1 flex flex-col min-w-0 h-full">
        {isTablesLoading ? (
          <>
            {/* Header Skeleton */}
            <div className="p-4 border-b border-border space-y-3 shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-8 w-24 rounded-xl" />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Skeleton className="h-7 w-64 rounded-xl" />
                <Skeleton className="h-7 w-20 rounded-xl" />
              </div>
            </div>

            {/* Table Mock Skeleton */}
            <div className="flex-1 overflow-auto bg-slate-50/20">
              <table className="w-full text-left border-collapse min-w-max text-xs">
                <thead className="bg-background text-secondary sticky top-0 font-bold border-b border-border z-10">
                  <tr>
                    <th className="p-3 w-16 text-center">
                      <Skeleton className="h-4 w-8 mx-auto" />
                    </th>
                    {[...Array(4)].map((_, i) => (
                      <th key={i} className="p-3 border-r border-border">
                        <Skeleton className="h-4 w-20" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[...Array(8)].map((_, rowIndex) => (
                    <tr key={rowIndex}>
                      <td className="p-3 border-r border-border text-center">
                        <Skeleton className="h-5 w-5 rounded mx-auto" />
                      </td>
                      {[...Array(4)].map((_, colIndex) => (
                        <td key={colIndex} className="p-3 border-r border-border">
                          <Skeleton className={`h-4 ${colIndex % 2 === 0 ? 'w-24' : 'w-16'}`} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Skeleton */}
            <footer className="p-4 border-t border-border flex items-center justify-between shrink-0 bg-background/50">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-6 w-24" />
            </footer>
          </>
        ) : selectedTable ? (
          <>
            {/* Header / query filters bar */}
            <div className="p-4 border-b border-border space-y-3 shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-black text-lg text-text">{selectedTable.name}</span>
                  <span className="text-xs text-secondary font-mono">({selectedTable.dbName})</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setNewRowData({});
                      setIsCreateOpen(true);
                    }}
                    className="flex items-center gap-1 bg-primary text-white py-1.5 px-3.5 rounded-xl text-xs font-bold shadow-premium hover:shadow-premium-hover hover:scale-[1.02] cursor-pointer transition active:scale-95"
                  >
                    <Plus size={14} /> Add Row
                  </button>
                </div>
              </div>

              {/* Filters list and Search */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-64">
                  <input
                    type="text"
                    placeholder="Search table rows..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && fetchRows()}
                    className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-primary text-text"
                  />
                </div>
                <button
                  onClick={addFilter}
                  className="flex items-center gap-1 border border-border hover:bg-black/5 text-secondary hover:text-text py-1.5 px-3 rounded-xl text-xs font-semibold cursor-pointer transition"
                >
                  <SlidersHorizontal size={12} /> Add filter
                </button>

                {filters.map((f, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 bg-background border border-border px-2.5 py-1.5 rounded-xl text-xs">
                    <select
                      value={f.field}
                      onChange={(e) => {
                        const updated = [...filters];
                        updated[idx].field = e.target.value;
                        setFilters(updated);
                      }}
                      className="bg-transparent font-medium text-text border-none focus:outline-none"
                    >
                      {selectedTable.fields.map((field) => (
                        <option key={field.name} value={field.name}>{field.name}</option>
                      ))}
                    </select>

                    <select
                      value={f.operator}
                      onChange={(e) => {
                        const updated = [...filters];
                        updated[idx].operator = e.target.value;
                        setFilters(updated);
                      }}
                      className="bg-transparent font-medium text-text border-none focus:outline-none"
                    >
                      <option value="equals">=</option>
                      <option value="contains">like</option>
                      <option value="gt">&gt;</option>
                      <option value="lt">&lt;</option>
                      <option value="not">!=</option>
                    </select>

                    <input
                      type="text"
                      placeholder="Value"
                      value={f.value}
                      onChange={(e) => {
                        const updated = [...filters];
                        updated[idx].value = e.target.value;
                        setFilters(updated);
                      }}
                      className="bg-transparent border-none w-20 focus:outline-none text-text text-xs"
                    />

                    <button onClick={() => removeFilter(idx)} className="text-red-500 hover:text-red-600 transition cursor-pointer ml-1">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Interactive Table Grid */}
            <div className="flex-1 overflow-auto bg-slate-50/20 relative">
              <table className="w-full text-left border-collapse min-w-max text-xs">
                <thead className="bg-background text-secondary sticky top-0 font-bold border-b border-border z-10">
                  <tr>
                    <th className="p-3 w-16 text-center">Actions</th>
                    {selectedTable.fields.map((f) => (
                      <th
                        key={f.name}
                        onClick={() => {
                          if (sortBy === f.name) {
                            setOrder(order === "asc" ? "desc" : "asc");
                          } else {
                            setSortBy(f.name);
                            setOrder("desc");
                          }
                        }}
                        className="p-3 border-r border-border font-bold hover:bg-black/5 cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5 select-none">
                          <span>{f.name}</span>
                          <span className="text-[9px] font-normal text-secondary font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase">
                            {f.type}
                          </span>
                          <ArrowUpDown size={10} className="text-secondary" />
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-text">
                  {isLoading ? (
                    [...Array(10)].map((_, rowIndex) => (
                      <tr key={rowIndex} className="border-r border-border">
                        <td className="p-2 border-r border-border text-center">
                          <Skeleton className="h-5 w-5 rounded mx-auto" />
                        </td>
                        {selectedTable.fields.map((f, colIndex) => (
                          <td key={f.name} className="p-3 border-r border-border">
                            <Skeleton className={`h-4 ${colIndex % 2 === 0 ? 'w-24' : 'w-16'}`} />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={selectedTable.fields.length + 1} className="text-center py-20 text-secondary">
                        No rows found in this table.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => {
                      const pkField = selectedTable.fields.find(f => f.isId)?.name || 'id';
                      const currentRowId = row[pkField];

                      return (
                      <tr key={currentRowId} className="hover:bg-slate-50 transition border-r border-border">
                        <td className="p-2 border-r border-border text-center">
                          <button
                            onClick={() => handleDeleteRow(currentRowId)}
                            className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg cursor-pointer transition"
                            title="Delete row"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                        {selectedTable.fields.map((f) => {
                          const val = row[f.name];
                          const isIdCol = f.isId;
                          const displayVal = val === null || val === undefined 
                            ? "NULL" 
                            : typeof val === "object" 
                            ? JSON.stringify(val) 
                            : String(val);

                          const isEditing = editingCell?.rowId === currentRowId && editingCell?.colName === f.name;

                          return (
                            <td
                              key={f.name}
                              onDoubleClick={() => {
                                if (!isIdCol) {
                                  setEditingCell({ rowId: currentRowId, colName: f.name });
                                  setEditingValue(val === null || val === undefined ? "" : String(val));
                                }
                              }}
                              className={`p-3 border-r border-border select-all relative group font-mono max-w-xs truncate ${val === null ? "text-slate-400 italic" : "text-text"}`}
                              title={displayVal}
                            >
                              {isEditing ? (
                                <div className="flex items-center gap-1 absolute inset-1 bg-white z-10 px-1 border border-primary rounded-lg shadow-premium">
                                  <input
                                    type="text"
                                    value={editingValue}
                                    onChange={(e) => setEditingValue(e.target.value)}
                                    className="flex-1 bg-transparent border-none text-xs focus:outline-none text-text p-1"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleInlineSave(currentRowId, f.name, f.type);
                                      if (e.key === "Escape") setEditingCell(null);
                                    }}
                                  />
                                  <button onClick={() => handleInlineSave(currentRowId, f.name, f.type)} className="text-emerald-500 hover:bg-emerald-50 p-0.5 rounded cursor-pointer">
                                    <Check size={12} />
                                  </button>
                                  <button onClick={() => setEditingCell(null)} className="text-red-500 hover:bg-red-50 p-0.5 rounded cursor-pointer">
                                    <X size={12} />
                                  </button>
                                </div>
                              ) : (
                                <span>{displayVal}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  }))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Footer */}
            <footer className="p-4 border-t border-border flex items-center justify-between shrink-0 bg-background/50">
              <div className="flex items-center gap-2">
                <span className="text-xs text-secondary">Show</span>
                <select
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value, 10))}
                  className="bg-card border border-border p-1 rounded-lg text-xs font-semibold text-text focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-xs text-secondary">rows</span>
              </div>

              <div className="text-xs text-secondary">
                Showing <b>{(page - 1) * limit + 1}</b> to <b>{Math.min(page * limit, totalRows)}</b> of <b>{totalRows}</b> entries
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="p-1 bg-card hover:bg-black/5 disabled:opacity-40 border border-border rounded-lg transition cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-bold text-text bg-primary/10 px-2.5 py-1.5 rounded-lg border border-primary/20">
                  {page}
                </span>
                <button
                  disabled={page * limit >= totalRows}
                  onClick={() => setPage(page + 1)}
                  className="p-1 bg-card hover:bg-black/5 disabled:opacity-40 border border-border rounded-lg transition cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </footer>
          </>
        ) : (
          <div className="text-center py-40 text-secondary">No table schema available.</div>
        )}
      </main>

      {/* Slide-out Create Row Modal Backdrop */}
      {isCreateOpen && selectedTable && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-end p-4">
          <div className="bg-cardSolid border border-border w-full max-w-lg h-full rounded-2xl p-6 flex flex-col shadow-premium animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
              <div>
                <h3 className="font-bold text-lg text-text">Add Row to {selectedTable.name}</h3>
                <p className="text-secondary text-xs mt-0.5">Define values conforming to table types schema.</p>
              </div>
              <button onClick={() => setIsCreateOpen(false)} className="p-1 text-secondary hover:bg-black/5 rounded-lg cursor-pointer transition">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateRow} className="flex-1 overflow-y-auto space-y-4 pr-1">
              {selectedTable.fields
                .filter((f) => !f.isId && f.name !== "createdAt" && f.name !== "created_at" && f.name !== "updatedAt" && f.name !== "updated_at")
                .map((f) => (
                  <div key={f.name}>
                    <label className="text-xs font-bold text-secondary uppercase block mb-1.5">
                      {f.name} {f.isRequired && <span className="text-red-500">*</span>}
                    </label>
                    {f.type === "Boolean" ? (
                      <select
                        value={newRowData[f.name] || ""}
                        onChange={(e) => setNewRowData({ ...newRowData, [f.name]: e.target.value })}
                        required={f.isRequired}
                        className="w-full bg-background border border-border p-2.5 rounded-xl text-sm focus:outline-none focus:border-primary text-text"
                      >
                        <option value="">-- Choose Option --</option>
                        <option value="true">True</option>
                        <option value="false">False</option>
                      </select>
                    ) : (
                      <input
                        type={f.type === "Int" || f.type === "Float" || f.type === "Decimal" ? "number" : "text"}
                        placeholder={`Enter ${f.type} value...`}
                        value={newRowData[f.name] || ""}
                        onChange={(e) => setNewRowData({ ...newRowData, [f.name]: e.target.value })}
                        required={f.isRequired}
                        className="w-full bg-background border border-border p-2.5 rounded-xl text-sm focus:outline-none focus:border-primary text-text"
                      />
                    )}
                  </div>
                ))}
              <div className="border-t border-border pt-4 mt-6 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 hover:bg-slate-50 border border-border text-secondary font-bold text-xs rounded-xl cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-xl cursor-pointer transition shadow-premium flex items-center gap-1"
                >
                  <Save size={13} /> Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
