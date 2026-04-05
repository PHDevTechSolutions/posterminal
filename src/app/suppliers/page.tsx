"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Truck, Plus, Package, Phone, Mail, MapPin, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supplierManagement, Supplier, PurchaseOrder } from "@/lib/supplier-management";

export default function SupplierManagementPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    categories: [] as string[],
    paymentTerms: "Net 30",
    leadTime: 7
  });

  useEffect(() => {
    if (user && (profile?.role === 'super_admin' || profile?.role === 'admin')) {
      loadData();
    }
  }, [user, profile]);

  const loadData = async () => {
    try {
      setLoading(true);
      await supplierManagement.initialize();
      setSuppliers(supplierManagement.getSuppliers());
      setPurchaseOrders(supplierManagement.getPurchaseOrders());
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSupplier = async () => {
    try {
      await supplierManagement.createSupplier({
        ...newSupplier,
        rating: 5,
        isActive: true
      });
      setIsAddOpen(false);
      setNewSupplier({
        name: "",
        contactPerson: "",
        phone: "",
        email: "",
        address: "",
        categories: [],
        paymentTerms: "Net 30",
        leadTime: 7
      });
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const summary = supplierManagement.getPurchaseSummary();

  if (profile?.role !== 'super_admin' && profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-400">Unauthorized access</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal Header */}
      <header className="h-16 border-b px-6 flex items-center justify-between sticky top-0 bg-white z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="font-semibold">Suppliers</span>
        </div>
        <Button size="sm" onClick={() => setIsAddOpen(true)} className="bg-black hover:bg-gray-800">
          <Plus className="h-4 w-4 mr-2" />
          Add Supplier
        </Button>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-none bg-gray-50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-light">{suppliers.length}</p>
              <p className="text-sm text-gray-400">Suppliers</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-none bg-gray-50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-light">{purchaseOrders.length}</p>
              <p className="text-sm text-gray-400">Orders</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-none bg-gray-50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-light">₱{summary.thisMonthTotal?.toLocaleString() || 0}</p>
              <p className="text-sm text-gray-400">This Month</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-none bg-gray-50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-light">{summary.pendingOrders || 0}</p>
              <p className="text-sm text-gray-400">Pending</p>
            </CardContent>
          </Card>
        </div>

        {/* Suppliers List */}
        <Card className="border-0 shadow-none bg-gray-50">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-6">Suppliers</h3>
            {loading ? (
              <div className="h-32 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : suppliers.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Truck className="h-12 w-12 mx-auto mb-4" />
                <p>No suppliers yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suppliers.map((supplier) => (
                  <Card key={supplier.id} className="bg-white border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{supplier.name}</h3>
                          <p className="text-sm text-gray-400">{supplier.contactPerson}</p>
                        </div>
                        <div className="flex gap-0.5">
                          {[...Array(supplier.rating)].map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-gray-400 text-gray-400" />
                          ))}
                        </div>
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          <span>{supplier.phone}</span>
                        </div>
                        {supplier.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            <span>{supplier.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{supplier.address}</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t flex justify-between text-xs text-gray-400">
                        <span>{supplier.paymentTerms}</span>
                        <span>{supplier.leadTime} days lead</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Supplier Modal */}
        {isAddOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Add New Supplier</h2>
              <div className="space-y-4">
                <div>
                  <Label>Company Name *</Label>
                  <Input
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})}
                    placeholder="Supplier name"
                  />
                </div>
                <div>
                  <Label>Contact Person *</Label>
                  <Input
                    value={newSupplier.contactPerson}
                    onChange={(e) => setNewSupplier({...newSupplier, contactPerson: e.target.value})}
                    placeholder="Contact person name"
                  />
                </div>
                <div>
                  <Label>Phone *</Label>
                  <Input
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier({...newSupplier, phone: e.target.value})}
                    placeholder="Phone number"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={newSupplier.email}
                    onChange={(e) => setNewSupplier({...newSupplier, email: e.target.value})}
                    placeholder="Email address"
                  />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input
                    value={newSupplier.address}
                    onChange={(e) => setNewSupplier({...newSupplier, address: e.target.value})}
                    placeholder="Full address"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" className="flex-1" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button className="flex-1 bg-indigo-600" onClick={handleCreateSupplier}>
                  Add Supplier
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
