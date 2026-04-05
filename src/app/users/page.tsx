"use client";

import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Search, 
  Edit, 
  Loader2,
  Users,
  Shield,
  Mail,
  User as UserIcon,
  Plus
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { UserProfile } from "@/types";
import { getAllUsers, updateUserProfile } from "@/lib/firestore-service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function UsersPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<Partial<UserProfile>>({});
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    displayName: "",
    role: "cashier"
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || profile?.role !== 'super_admin')) {
      toast.error("Unauthorized access");
      router.push("/");
    }
  }, [user, profile, authLoading, router]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.role === 'super_admin') loadUsers();
  }, [profile]);

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.displayName) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setSaving(true);
      console.log('Creating user:', newUser);
      
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      
      const data = await response.json();
      console.log('User creation response:', data);
      
      if (data.success) {
        toast.success("User created successfully");
        setIsAddOpen(false);
        setNewUser({ email: "", password: "", displayName: "", role: "cashier" });
        loadUsers();
      } else {
        console.error('User creation failed:', data.error);
        toast.error(data.error || "Failed to create user");
      }
    } catch (error: any) {
      console.error('User creation error:', error);
      toast.error(error.message || "Failed to create user");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!currentProfile.uid || !currentProfile.role) return;

    try {
      setSaving(true);
      await updateUserProfile(currentProfile.uid, { 
        role: currentProfile.role,
        status: currentProfile.status 
      });
      toast.success("User role updated successfully");
      setIsEditOpen(false);
      loadUsers();
    } catch (error) {
      toast.error("Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return "bg-purple-100 text-purple-700 border-purple-200";
      case 'admin': return "bg-blue-100 text-blue-700 border-blue-200";
      case 'kitchen': return "bg-orange-100 text-orange-700 border-orange-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  if (authLoading || !user || profile?.role !== 'super_admin') {
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
          <h1 className="font-black text-xl text-gray-900 tracking-tighter">Staff</h1>
        </div>
        <Dialog open={isAddOpen} onOpenChange={(open) => {
          setIsAddOpen(open);
          if (open) setNewUser({ email: "", password: "", displayName: "", role: "cashier" });
        }}>
          <DialogTrigger>
            <Button size="icon" className="bg-indigo-600 hover:bg-indigo-700 h-10 w-10 rounded-xl shadow-lg shadow-indigo-100">
              <Plus className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95%] sm:max-w-[425px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tighter">Add Staff</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label className="text-xs font-bold uppercase text-gray-400">Full Name</Label>
                <Input className="rounded-xl h-11" placeholder="e.g. Juan Dela Cruz" value={newUser.displayName} onChange={(e) => setNewUser({...newUser, displayName: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-bold uppercase text-gray-400">Email</Label>
                <Input className="rounded-xl h-11" type="email" placeholder="email@example.com" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-bold uppercase text-gray-400">Password</Label>
                <Input className="rounded-xl h-11" type="password" placeholder="Min. 6 chars" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-bold uppercase text-gray-400">Role</Label>
                <Select value={newUser.role} onValueChange={(val: any) => setNewUser({...newUser, role: val})}>
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="cashier">Cashier</SelectItem>
                    <SelectItem value="kitchen">Kitchen/Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button className="w-full h-12 rounded-xl bg-indigo-600 font-bold" onClick={handleCreateUser} disabled={saving}>
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create Account"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-8 space-y-6 lg:space-y-8">
        <div className="hidden lg:flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="h-12 w-12 rounded-2xl hover:bg-white hover:shadow-md transition-all">
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tighter flex items-center gap-3">
                <Users className="h-10 w-10 text-indigo-600" />
                Staff Management
              </h1>
              <p className="text-gray-500 font-medium">Control user access and system permissions</p>
            </div>
          </div>

          <Dialog open={isAddOpen} onOpenChange={(open) => {
            setIsAddOpen(open);
            if (open) setNewUser({ email: "", password: "", displayName: "", role: "cashier" });
          }}>
            <DialogTrigger>
              <Button className="bg-indigo-600 hover:bg-indigo-700 h-12 px-6 rounded-2xl gap-2 font-bold shadow-xl shadow-indigo-100 transition-all active:scale-95">
                <Plus className="h-5 w-5" />
                Add New Staff
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-3xl p-8">
              <DialogHeader>
                <DialogTitle className="text-3xl font-black tracking-tighter">New Account</DialogTitle>
                <DialogDescription className="font-medium text-gray-400">Register a new system user</DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-6">
                <div className="grid gap-2">
                  <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Full Name</Label>
                  <Input className="rounded-2xl h-12 bg-gray-50 border-none" value={newUser.displayName} onChange={(e) => setNewUser({...newUser, displayName: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Email Address</Label>
                  <Input className="rounded-2xl h-12 bg-gray-50 border-none" type="email" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Password</Label>
                  <Input className="rounded-2xl h-12 bg-gray-50 border-none" type="password" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Role</Label>
                  <Select value={newUser.role} onValueChange={(val: any) => setNewUser({...newUser, role: val})}>
                    <SelectTrigger className="rounded-2xl h-12 bg-gray-50 border-none">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="cashier">Cashier</SelectItem>
                      <SelectItem value="kitchen">Kitchen/Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button className="w-full h-14 rounded-2xl bg-indigo-600 font-black text-lg shadow-xl shadow-indigo-100" onClick={handleCreateUser} disabled={saving}>
                  {saving ? <Loader2 className="h-6 w-6 animate-spin" /> : "CREATE ACCOUNT"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border p-4 lg:p-8 space-y-6">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input 
              placeholder="Search by name or email..." 
              className="pl-12 h-12 lg:h-14 rounded-2xl bg-gray-50 border-none text-lg group focus-within:bg-white transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="hidden lg:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b-2 border-gray-50">
                  <TableHead className="font-black text-gray-400 uppercase text-[10px] tracking-widest">User</TableHead>
                  <TableHead className="font-black text-gray-400 uppercase text-[10px] tracking-widest">Role</TableHead>
                  <TableHead className="font-black text-gray-400 uppercase text-[10px] tracking-widest">Status</TableHead>
                  <TableHead className="text-right font-black text-gray-400 uppercase text-[10px] tracking-widest">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-40 text-center">
                      <Loader2 className="h-10 w-10 animate-spin mx-auto text-indigo-600 opacity-20" />
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-40 text-center text-gray-400 font-bold">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((u) => (
                    <TableRow key={u.uid} className="group hover:bg-gray-50/50 transition-colors border-b border-gray-50">
                      <TableCell className="py-6">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black">
                            {u.displayName?.[0] || u.email[0].toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900">{u.displayName || "No Name"}</span>
                            <span className="text-xs font-medium text-gray-400 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${getRoleBadgeColor(u.role)} font-black text-[10px] uppercase px-3 py-1 border-none shadow-sm`}>
                          <Shield className="h-3 w-3 mr-1" />
                          {u.role.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.status === 'active' ? "default" : "secondary"} className={`${u.status === 'active' ? "bg-emerald-500 hover:bg-emerald-500" : "bg-gray-200"} font-black text-[10px] uppercase px-3 py-1 border-none`}>
                          {u.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {u.uid !== user.uid && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl"
                            onClick={() => {
                              setCurrentProfile(u);
                              setIsEditOpen(true);
                            }}
                          >
                            <Edit className="h-5 w-5" />
                          </Button>
                        )}
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
            ) : filteredUsers.length === 0 ? (
              <div className="py-20 text-center text-gray-400 font-bold">No users found.</div>
            ) : (
              filteredUsers.map((u) => (
                <div key={u.uid} className="p-5 rounded-3xl border bg-white shadow-sm flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black">
                        {u.displayName?.[0] || u.email[0].toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <h3 className="font-black text-gray-900 tracking-tight">{u.displayName || "No Name"}</h3>
                        <span className="text-[10px] font-bold text-gray-400 uppercase truncate max-w-[150px]">{u.email}</span>
                      </div>
                    </div>
                    {u.uid !== user.uid && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl"
                        onClick={() => {
                          setCurrentProfile(u);
                          setIsEditOpen(true);
                        }}
                      >
                        <Edit className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center justify-between border-t border-dashed pt-4">
                    <Badge variant="outline" className={`${getRoleBadgeColor(u.role)} font-black text-[10px] uppercase px-3 py-1 border-none shadow-sm`}>
                      {u.role.replace('_', ' ')}
                    </Badge>
                    <Badge variant={u.status === 'active' ? "default" : "secondary"} className={`${u.status === 'active' ? "bg-emerald-500" : "bg-gray-200"} font-black text-[10px] uppercase px-3 py-1 border-none`}>
                      {u.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="w-[95%] sm:max-w-[425px] rounded-3xl p-8">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black tracking-tighter">Edit Access</DialogTitle>
            <DialogDescription className="font-medium text-gray-400">Update permissions for {currentProfile.email}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-6">
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">System Role</Label>
              <Select value={currentProfile.role} onValueChange={(val: any) => setCurrentProfile({...currentProfile, role: val})}>
                <SelectTrigger className="rounded-2xl h-12 bg-gray-50 border-none">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="cashier">Cashier</SelectItem>
                  <SelectItem value="kitchen">Kitchen/Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Account Status</Label>
              <Select value={currentProfile.status} onValueChange={(val: any) => setCurrentProfile({...currentProfile, status: val})}>
                <SelectTrigger className="rounded-2xl h-12 bg-gray-50 border-none">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive (Blocked)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button className="w-full h-14 rounded-2xl bg-indigo-600 font-black text-lg shadow-xl shadow-indigo-100" onClick={handleUpdateRole} disabled={saving}>
              {saving ? <Loader2 className="h-6 w-6 animate-spin" /> : "UPDATE ACCESS"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
