"use client";

import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Edit2, 
  Wallet,
  TrendingDown,
  Calendar,
  Search,
  Loader2,
  Filter,
  DollarSign,
  Receipt
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  getDocs, 
  query, 
  orderBy,
  Timestamp,
  where
} from "firebase/firestore";

interface Expense {
  id?: string;
  description: string;
  amount: number;
  category: string;
  date: Date;
  notes?: string;
  createdAt?: Timestamp;
}

const EXPENSE_CATEGORIES = [
  { value: "rent", label: "Rent", color: "bg-red-100 text-red-700" },
  { value: "utilities", label: "Utilities", color: "bg-blue-100 text-blue-700" },
  { value: "salary", label: "Staff Salary", color: "bg-green-100 text-green-700" },
  { value: "supplies", label: "Supplies", color: "bg-yellow-100 text-yellow-700" },
  { value: "inventory", label: "Inventory Purchase", color: "bg-purple-100 text-purple-700" },
  { value: "marketing", label: "Marketing", color: "bg-pink-100 text-pink-700" },
  { value: "equipment", label: "Equipment", color: "bg-orange-100 text-orange-700" },
  { value: "maintenance", label: "Maintenance", color: "bg-gray-100 text-gray-700" },
  { value: "taxes", label: "Taxes", color: "bg-indigo-100 text-indigo-700" },
  { value: "other", label: "Other", color: "bg-slate-100 text-slate-700" },
];

export default function ExpensesPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [currentExpense, setCurrentExpense] = useState<Expense>({
    description: "",
    amount: 0,
    category: "other",
    date: new Date(),
    notes: ""
  });

  useEffect(() => {
    if (!authLoading && (!user || (profile?.role !== 'super_admin' && profile?.role !== 'admin'))) {
      toast.error("Unauthorized access");
      router.push("/");
    }
  }, [user, profile, authLoading, router]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const expensesQuery = query(
        collection(db, "expenses"),
        orderBy("date", "desc")
      );
      
      const snapshot = await getDocs(expensesQuery);
      const expensesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date()
      })) as Expense[];
      
      setExpenses(expensesData);
    } catch (error: any) {
      console.error("Error loading expenses:", error);
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadExpenses();
  }, [user]);

  const handleAddExpense = async () => {
    if (!currentExpense.description || !currentExpense.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const expenseData = {
        ...currentExpense,
        date: Timestamp.fromDate(currentExpense.date),
        createdAt: Timestamp.now(),
        createdBy: user?.uid
      };

      await addDoc(collection(db, "expenses"), expenseData);
      toast.success("Expense added successfully");
      setIsAddOpen(false);
      setCurrentExpense({
        description: "",
        amount: 0,
        category: "other",
        date: new Date(),
        notes: ""
      });
      loadExpenses();
    } catch (error: any) {
      console.error("Error adding expense:", error);
      toast.error("Failed to add expense");
    }
  };

  const handleUpdateExpense = async () => {
    if (!currentExpense.id) return;

    try {
      const expenseRef = doc(db, "expenses", currentExpense.id);
      await updateDoc(expenseRef, {
        description: currentExpense.description,
        amount: currentExpense.amount,
        category: currentExpense.category,
        date: Timestamp.fromDate(currentExpense.date),
        notes: currentExpense.notes
      });
      
      toast.success("Expense updated successfully");
      setIsEditOpen(false);
      loadExpenses();
    } catch (error: any) {
      console.error("Error updating expense:", error);
      toast.error("Failed to update expense");
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    try {
      await deleteDoc(doc(db, "expenses", expenseId));
      toast.success("Expense deleted successfully");
      loadExpenses();
    } catch (error: any) {
      console.error("Error deleting expense:", error);
      toast.error("Failed to delete expense");
    }
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         expense.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || expense.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const getCategoryLabel = (value: string) => {
    return EXPENSE_CATEGORIES.find(cat => cat.value === value)?.label || value;
  };

  const getCategoryColor = (value: string) => {
    return EXPENSE_CATEGORIES.find(cat => cat.value === value)?.color || "bg-gray-100 text-gray-700";
  };

  if (authLoading || !user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b px-4 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="h-10 w-10 rounded-xl">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="font-bold text-xl text-gray-900">Expenses</h1>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger>
            <Button size="icon" className="bg-indigo-600 hover:bg-indigo-700 h-10 w-10 rounded-xl">
              <Plus className="h-5 w-5" />
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6">
        {/* Desktop Header */}
        <div className="hidden lg:flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="h-12 w-12 rounded-xl">
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Wallet className="h-8 w-8 text-indigo-600" />
                Expense Management
              </h1>
              <p className="text-gray-500">Track operating costs and expenses</p>
            </div>
          </div>
          <Dialog>
            <DialogTrigger>
              <Button className="bg-indigo-600 hover:bg-indigo-700 h-12 px-6 rounded-xl gap-2 font-semibold">
                <Plus className="h-5 w-5" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">Add New Expense</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Description *</Label>
                  <Input
                    placeholder="e.g., Monthly Rent, Electricity Bill"
                    value={currentExpense.description}
                    onChange={(e) => setCurrentExpense({...currentExpense, description: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Amount (₱) *</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={currentExpense.amount || ""}
                    onChange={(e) => setCurrentExpense({...currentExpense, amount: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select 
                    value={currentExpense.category} 
                    onValueChange={(value: string | null) => value && setCurrentExpense({...currentExpense, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={currentExpense.date.toISOString().split('T')[0]}
                    onChange={(e) => setCurrentExpense({...currentExpense, date: new Date(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <Input
                    placeholder="Additional details..."
                    value={currentExpense.notes || ""}
                    onChange={(e) => setCurrentExpense({...currentExpense, notes: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddExpense} className="bg-indigo-600 hover:bg-indigo-700">
                  Save Expense
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-red-50 border-red-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-600 flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Total Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700">
                ₱{totalExpenses.toLocaleString()}
              </div>
              <p className="text-xs text-red-500 mt-1">
                {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-600 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">
                ₱{expenses
                  .filter(e => {
                    const expenseDate = new Date(e.date);
                    const now = new Date();
                    return expenseDate.getMonth() === now.getMonth() && 
                           expenseDate.getFullYear() === now.getFullYear();
                  })
                  .reduce((sum, e) => sum + e.amount, 0)
                  .toLocaleString()}
              </div>
              <p className="text-xs text-blue-500 mt-1">Current month expenses</p>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600 flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">
                ₱{expenses
                  .filter(e => {
                    const expenseDate = new Date(e.date);
                    const today = new Date();
                    return expenseDate.toDateString() === today.toDateString();
                  })
                  .reduce((sum, e) => sum + e.amount, 0)
                  .toLocaleString()}
              </div>
              <p className="text-xs text-green-500 mt-1">Today's expenses</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search expenses..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={categoryFilter} onValueChange={(value: string | null) => setCategoryFilter(value || 'all')}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {EXPENSE_CATEGORIES.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Expenses Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Expense List</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-40 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="font-medium">No expenses found</p>
                <p className="text-sm">Add your first expense to start tracking</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>
                        {new Date(expense.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">
                        {expense.description}
                      </TableCell>
                      <TableCell>
                        <Badge className={getCategoryColor(expense.category)}>
                          {getCategoryLabel(expense.category)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-red-600">
                        ₱{expense.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">
                        {expense.notes || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setCurrentExpense(expense);
                              setIsEditOpen(true);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteExpense(expense.id!)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Description *</Label>
              <Input
                value={currentExpense.description}
                onChange={(e) => setCurrentExpense({...currentExpense, description: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Amount (₱) *</Label>
              <Input
                type="number"
                value={currentExpense.amount || ""}
                onChange={(e) => setCurrentExpense({...currentExpense, amount: parseFloat(e.target.value) || 0})}
              />
            </div>
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select 
                value={currentExpense.category} 
                onValueChange={(value: string | null) => value && setCurrentExpense({...currentExpense, category: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={currentExpense.date.toISOString().split('T')[0]}
                onChange={(e) => setCurrentExpense({...currentExpense, date: new Date(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                value={currentExpense.notes || ""}
                onChange={(e) => setCurrentExpense({...currentExpense, notes: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateExpense} className="bg-indigo-600 hover:bg-indigo-700">
              Update Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
