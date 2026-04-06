"use client";

import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Truck, Plus, Phone, Mail, MapPin, Star, Loader2, Search, ChevronLeft, ChevronRight, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supplierManagement, Supplier, PurchaseOrder } from "@/lib/supplier-management";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ITEMS_PER_PAGE = 10;

export default function SupplierManagementPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState<Supplier | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  
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

  // Filter suppliers based on search
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((supplier) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        supplier.name.toLowerCase().includes(searchLower) ||
        supplier.contactPerson.toLowerCase().includes(searchLower) ||
        supplier.phone.toLowerCase().includes(searchLower) ||
        supplier.email?.toLowerCase().includes(searchLower) ||
        supplier.address.toLowerCase().includes(searchLower) ||
        supplier.categories?.some(cat => cat.toLowerCase().includes(searchLower))
      );
    });
  }, [suppliers, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredSuppliers.length / ITEMS_PER_PAGE);
  const paginatedSuppliers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSuppliers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredSuppliers, currentPage]);

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
      toast.success("Supplier created successfully");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEditSupplier = async () => {
    if (!currentSupplier?.id) return;
    try {
      await supplierManagement.updateSupplier(currentSupplier.id, currentSupplier);
      setIsEditOpen(false);
      setCurrentSupplier(null);
      loadData();
      toast.success("Supplier updated successfully");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!confirm("Are you sure you want to delete this supplier?")) return;
    try {
      await supplierManagement.deleteSupplier(id);
      loadData();
      toast.success("Supplier deleted successfully");
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

      <main className="max-w-7xl mx-auto px-6 py-8">
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

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search suppliers by name, contact, phone, email..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {/* Suppliers Table */}
        <Card className="border-0 shadow-none bg-gray-50">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-6">
              Suppliers ({filteredSuppliers.length} found)
            </h3>
            
            {loading ? (
              <div className="h-32 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : filteredSuppliers.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Truck className="h-12 w-12 mx-auto mb-4" />
                <p>No suppliers found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-b-2 border-gray-200">
                        <TableHead className="font-semibold text-gray-500 uppercase text-xs">Supplier</TableHead>
                        <TableHead className="font-semibold text-gray-500 uppercase text-xs">Contact</TableHead>
                        <TableHead className="font-semibold text-gray-500 uppercase text-xs">Phone</TableHead>
                        <TableHead className="font-semibold text-gray-500 uppercase text-xs">Email</TableHead>
                        <TableHead className="font-semibold text-gray-500 uppercase text-xs">Address</TableHead>
                        <TableHead className="font-semibold text-gray-500 uppercase text-xs">Rating</TableHead>
                        <TableHead className="font-semibold text-gray-500 uppercase text-xs">Terms</TableHead>
                        <TableHead className="text-right font-semibold text-gray-500 uppercase text-xs">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedSuppliers.map((supplier) => (
                        <TableRow key={supplier.id} className="hover:bg-white/50 border-b border-gray-100">
                          <TableCell className="font-medium">{supplier.name}</TableCell>
                          <TableCell className="text-sm text-gray-500">{supplier.contactPerson}</TableCell>
                          <TableCell className="text-sm">
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-gray-400" />
                              {supplier.phone}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {supplier.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3 text-gray-400" />
                                <span className="truncate max-w-[150px]">{supplier.email}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-gray-400" />
                              <span className="truncate max-w-[200px]">{supplier.address}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-0.5">
                              {[...Array(supplier.rating || 0)].map((_, i) => (
                                <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            <Badge variant="secondary" className="text-xs">
                              {supplier.paymentTerms} • {supplier.leadTime}d
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  setCurrentSupplier(supplier);
                                  setIsEditOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-600"
                                onClick={() => supplier.id && handleDeleteSupplier(supplier.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <p className="text-sm text-gray-500">
                      Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredSuppliers.length)} of {filteredSuppliers.length} suppliers
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-gray-600">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Add Supplier Dialog */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Supplier</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Company Name *</Label>
                <Input
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                  placeholder="Enter company name"
                />
              </div>
              <div>
                <Label>Contact Person *</Label>
                <Input
                  value={newSupplier.contactPerson}
                  onChange={(e) => setNewSupplier({ ...newSupplier, contactPerson: e.target.value })}
                  placeholder="Enter contact person"
                />
              </div>
              <div>
                <Label>Phone *</Label>
                <Input
                  value={newSupplier.phone}
                  onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newSupplier.email}
                  onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <Label>Address *</Label>
                <Input
                  value={newSupplier.address}
                  onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                  placeholder="Enter address"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Payment Terms</Label>
                  <Input
                    value={newSupplier.paymentTerms}
                    onChange={(e) => setNewSupplier({ ...newSupplier, paymentTerms: e.target.value })}
                    placeholder="e.g., Net 30"
                  />
                </div>
                <div>
                  <Label>Lead Time (days)</Label>
                  <Input
                    type="number"
                    value={newSupplier.leadTime}
                    onChange={(e) => setNewSupplier({ ...newSupplier, leadTime: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button className="flex-1 bg-black hover:bg-gray-800" onClick={handleCreateSupplier}>
                  Create Supplier
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Supplier Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Supplier</DialogTitle>
            </DialogHeader>
            {currentSupplier && (
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Company Name *</Label>
                  <Input
                    value={currentSupplier.name}
                    onChange={(e) => setCurrentSupplier({ ...currentSupplier, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Contact Person *</Label>
                  <Input
                    value={currentSupplier.contactPerson}
                    onChange={(e) => setCurrentSupplier({ ...currentSupplier, contactPerson: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Phone *</Label>
                  <Input
                    value={currentSupplier.phone}
                    onChange={(e) => setCurrentSupplier({ ...currentSupplier, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={currentSupplier.email || ""}
                    onChange={(e) => setCurrentSupplier({ ...currentSupplier, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Address *</Label>
                  <Input
                    value={currentSupplier.address}
                    onChange={(e) => setCurrentSupplier({ ...currentSupplier, address: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Payment Terms</Label>
                    <Input
                      value={currentSupplier.paymentTerms}
                      onChange={(e) => setCurrentSupplier({ ...currentSupplier, paymentTerms: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Lead Time (days)</Label>
                    <Input
                      type="number"
                      value={currentSupplier.leadTime}
                      onChange={(e) => setCurrentSupplier({ ...currentSupplier, leadTime: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setIsEditOpen(false)}>
                    Cancel
                  </Button>
                  <Button className="flex-1 bg-black hover:bg-gray-800" onClick={handleEditSupplier}>
                    Save Changes
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
