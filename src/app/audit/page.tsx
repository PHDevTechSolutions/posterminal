"use client";

import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  History, 
  Search, 
  Loader2,
  Calendar,
  User as UserIcon,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AuditLog } from "@/types";
import { getAuditLogs } from "@/lib/firestore-service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AuditPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await getAuditLogs();
      setLogs(data);
    } catch (error) {
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadLogs();
  }, [user]);

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.userId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getActionColor = (action: string) => {
    if (action.includes("CREATE")) return "bg-emerald-50 text-emerald-600";
    if (action.includes("UPDATE")) return "bg-blue-50 text-blue-600";
    if (action.includes("DELETE") || action.includes("CANCEL")) return "bg-red-50 text-red-600";
    return "bg-gray-50 text-gray-600";
  };

  if (authLoading || !user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b px-4 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="h-10 w-10 rounded-xl">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="font-black text-xl text-gray-900 tracking-tighter">Audit Trail</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={loadLogs} className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl">
          <Activity className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-8 space-y-6 lg:space-y-8">
        <div className="hidden lg:flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="h-12 w-12 rounded-2xl hover:bg-white hover:shadow-md transition-all">
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tighter flex items-center gap-3">
                <History className="h-10 w-10 text-indigo-600" />
                Audit Log
              </h1>
              <p className="text-gray-500 font-medium">Track system activities and security events</p>
            </div>
          </div>
          <Button 
            className="bg-white hover:bg-indigo-50 text-indigo-600 border-indigo-100 h-12 px-6 rounded-2xl gap-2 font-bold shadow-sm transition-all active:scale-95"
            onClick={loadLogs}
            disabled={loading}
          >
            <Activity className="h-5 w-5" />
            Refresh Logs
          </Button>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border p-4 lg:p-8 space-y-6">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input 
              placeholder="Search by action, user, or detail..." 
              className="pl-12 h-12 lg:h-14 rounded-2xl bg-gray-50 border-none text-lg group focus-within:bg-white transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="hidden lg:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b-2 border-gray-50">
                  <TableHead className="font-black text-gray-400 uppercase text-[10px] tracking-widest">Timestamp</TableHead>
                  <TableHead className="font-black text-gray-400 uppercase text-[10px] tracking-widest">User</TableHead>
                  <TableHead className="font-black text-gray-400 uppercase text-[10px] tracking-widest">Action</TableHead>
                  <TableHead className="font-black text-gray-400 uppercase text-[10px] tracking-widest">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-40 text-center">
                      <Loader2 className="h-10 w-10 animate-spin mx-auto text-indigo-600 opacity-20" />
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-40 text-center text-gray-400 font-bold">
                      No logs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id} className="group hover:bg-gray-50/50 transition-colors border-b border-gray-50">
                      <TableCell className="py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-gray-900 tracking-tight">{log.timestamp?.toDate().toLocaleTimeString()}</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase">{log.timestamp?.toDate().toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black">
                            {(log as any).userName?.[0] || 'A'}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-700">{(log as any).userName || "Anonymous"}</span>
                            <span className="text-[10px] font-medium text-gray-400 truncate max-w-[120px]">{log.userId}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`${getActionColor(log.action)} border-none font-black text-[10px] uppercase px-3 py-1`}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-gray-500 max-w-md truncate">
                        {log.details}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile View */}
          <div className="lg:hidden space-y-4">
            {loading ? (
              <div className="py-20 flex justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600 opacity-20" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="py-20 text-center text-gray-400 font-bold">No logs found.</div>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="p-5 rounded-3xl border bg-white shadow-sm flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{log.timestamp?.toDate().toLocaleString()}</span>
                      <Badge variant="secondary" className={`${getActionColor(log.action)} border-none font-black text-[10px] uppercase px-2 py-0.5 mt-1 self-start`}>
                        {log.action}
                      </Badge>
                    </div>
                    <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 font-black text-xs">
                      {(log as any).userName?.[0] || 'A'}
                    </div>
                  </div>
                  <p className="text-sm font-bold text-gray-700 leading-snug">{log.details}</p>
                  <div className="text-[10px] font-medium text-gray-400 border-t border-dashed pt-2 truncate">
                    BY: {(log as any).userName || "Anonymous"} ({log.userId})
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
