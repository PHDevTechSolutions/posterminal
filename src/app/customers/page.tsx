"use client";

import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  User, 
  Phone, 
  Mail, 
  Star,
  History,
  Gift,
  Loader2,
  Edit2,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

interface Customer {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  loyaltyPoints: number;
  totalSpent: number;
  visitCount: number;
  lastVisit?: Date;
  notes?: string;
  createdAt?: Timestamp;
}

export default function CustomersPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Customer>({
    name: "",
    phone: "",
    email: "",
    address: "",
    loyaltyPoints: 0,
    totalSpent: 0,
    visitCount: 0,
    notes: ""
  });

  useEffect(() => {
    if (!authLoading && (!user || (profile?.role !== 'super_admin' && profile?.role !== 'admin'))) {
      toast.error("Unauthorized access");
      router.push("/");
    }
  }, [user, profile, authLoading, router]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const customersQuery = query(
        collection(db, "customers"),
        orderBy("createdAt", "desc")
      );
      
      const snapshot = await getDocs(customersQuery);
      const customersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastVisit: doc.data().lastVisit?.toDate()
      })) as Customer[];
      
      setCustomers(customersData);
    } catch (error: any) {
      console.error("Error loading customers:", error);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadCustomers();
  }, [user]);

  const handleAddCustomer = async () => {
    if (!currentCustomer.name || !currentCustomer.phone) {
      toast.error("Name and phone are required");
      return;
    }

    try {
      const customerData = {
        ...currentCustomer,
        createdAt: Timestamp.now(),
        createdBy: user?.uid
      };

      await addDoc(collection(db, "customers"), customerData);
      toast.success("Customer added successfully");
      setIsAddOpen(false);
      setCurrentCustomer({
        name: "",
        phone: "",
        email: "",
        address: "",
        loyaltyPoints: 0,
        totalSpent: 0,
        visitCount: 0,
        notes: ""
      });
      loadCustomers();
    } catch (error: any) {
      console.error("Error adding customer:", error);
      toast.error("Failed to add customer");
    }
  };

  const handleUpdateCustomer = async () => {
    if (!currentCustomer.id) return;

    try {
      const customerRef = doc(db, "customers", currentCustomer.id);
      await updateDoc(customerRef, {
        name: currentCustomer.name,
        phone: currentCustomer.phone,
        email: currentCustomer.email,
        address: currentCustomer.address,
        notes: currentCustomer.notes
      });
      
      toast.success("Customer updated successfully");
      setIsEditOpen(false);
      loadCustomers();
    } catch (error: any) {
      console.error("Error updating customer:", error);
      toast.error("Failed to update customer");
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;

    try {
      await deleteDoc(doc(db, "customers", customerId));
      toast.success("Customer deleted successfully");
      loadCustomers();
    } catch (error: any) {
      console.error("Error deleting customer:", error);
      toast.error("Failed to delete customer");
    }
  };

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getLoyaltyTier = (points: number) => {
    if (points >= 1000) return { name: "Platinum", color: "bg-purple-100 text-purple-700" };
    if (points >= 500) return { name: "Gold", color: "bg-yellow-100 text-yellow-700" };
    if (points >= 100) return { name: "Silver", color: "bg-gray-100 text-gray-700" };
    return { name: "Bronze", color: "bg-orange-100 text-orange-700" };
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
      <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <User className="h-8 w-8 text-indigo-600" />
                Customer Management
              </h1>
              <p className="text-gray-500">Manage customers and loyalty program</p>
            </div>
          </div>
          <Button 
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={() => setIsAddOpen(true)}
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Customer
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customers.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Loyalty Points</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {customers.reduce((sum, c) => sum + c.loyaltyPoints, 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₱{customers.reduce((sum, c) => sum + c.totalSpent, 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Avg. Spend/Customer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₱{customers.length > 0 
                  ? (customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length).toFixed(0)
                  : 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search customers by name, phone, or email..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Customers Grid */}
        {loading ? (
          <div className="h-40 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="font-medium">No customers found</p>
            <p className="text-sm">Add your first customer to start</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.map((customer) => {
              const tier = getLoyaltyTier(customer.loyaltyPoints);
              return (
                <Card key={customer.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{customer.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span className="text-sm text-gray-500">{customer.phone}</span>
                          </div>
                        </div>
                      </div>
                      <Badge className={tier.color}>{tier.name}</Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                      <div className="bg-gray-50 rounded-lg p-2">
                        <div className="text-lg font-bold text-indigo-600">
                          {customer.loyaltyPoints}
                        </div>
                        <div className="text-xs text-gray-500">Points</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <div className="text-lg font-bold text-green-600">
                          ₱{customer.totalSpent.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">Spent</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <div className="text-lg font-bold text-blue-600">
                          {customer.visitCount}
                        </div>
                        <div className="text-xs text-gray-500">Visits</div>
                      </div>
                    </div>

                    {customer.lastVisit && (
                      <p className="text-xs text-gray-400 mb-3">
                        Last visit: {new Date(customer.lastVisit).toLocaleDateString()}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          setCurrentCustomer(customer);
                          setIsEditOpen(true);
                        }}
                      >
                        <Edit2 className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteCustomer(customer.id!)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Customer Dialog */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Customer</h2>
            <div className="space-y-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={currentCustomer.name}
                  onChange={(e) => setCurrentCustomer({...currentCustomer, name: e.target.value})}
                  placeholder="Customer name"
                />
              </div>
              <div>
                <Label>Phone *</Label>
                <Input
                  value={currentCustomer.phone}
                  onChange={(e) => setCurrentCustomer({...currentCustomer, phone: e.target.value})}
                  placeholder="Phone number"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={currentCustomer.email}
                  onChange={(e) => setCurrentCustomer({...currentCustomer, email: e.target.value})}
                  placeholder="Email address"
                />
              </div>
              <div>
                <Label>Address</Label>
                <Input
                  value={currentCustomer.address}
                  onChange={(e) => setCurrentCustomer({...currentCustomer, address: e.target.value})}
                  placeholder="Address"
                />
              </div>
              <div>
                <Label>Notes</Label>
                <Input
                  value={currentCustomer.notes}
                  onChange={(e) => setCurrentCustomer({...currentCustomer, notes: e.target.value})}
                  placeholder="Additional notes"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button className="flex-1 bg-indigo-600" onClick={handleAddCustomer}>
                Add Customer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Dialog */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Customer</h2>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={currentCustomer.name}
                  onChange={(e) => setCurrentCustomer({...currentCustomer, name: e.target.value})}
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={currentCustomer.phone}
                  onChange={(e) => setCurrentCustomer({...currentCustomer, phone: e.target.value})}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={currentCustomer.email}
                  onChange={(e) => setCurrentCustomer({...currentCustomer, email: e.target.value})}
                />
              </div>
              <div>
                <Label>Address</Label>
                <Input
                  value={currentCustomer.address}
                  onChange={(e) => setCurrentCustomer({...currentCustomer, address: e.target.value})}
                />
              </div>
              <div>
                <Label>Notes</Label>
                <Input
                  value={currentCustomer.notes}
                  onChange={(e) => setCurrentCustomer({...currentCustomer, notes: e.target.value})}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button className="flex-1 bg-indigo-600" onClick={handleUpdateCustomer}>
                Update
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
