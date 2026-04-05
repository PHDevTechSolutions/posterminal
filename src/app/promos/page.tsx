"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Percent, Clock, Gift, Tag, Trash2, Edit2, Loader2, Package, CheckSquare, Square, Globe, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { discountPromoService, Promo } from "@/lib/discount-promo";
import { getMenuItems } from "@/lib/firestore-service";
import { MenuItem } from "@/types";

const CATEGORIES = ["Grains", "Grocery", "Drinks", "Household"];

export default function PromoManagementPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [promos, setPromos] = useState<Promo[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  const [newPromo, setNewPromo] = useState({
    name: "",
    description: "",
    type: "percentage" as Promo['type'],
    value: 10,
    startDate: "",
    endDate: "",
    minPurchase: 0,
    maxDiscount: 0,
    memberOnly: false,
  });
  
  const [applyToAll, setApplyToAll] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [itemSearchQuery, setItemSearchQuery] = useState("");

  useEffect(() => {
    if (user) {
      loadPromos();
      loadMenuItems();
    }
  }, [user]);

  const loadPromos = async () => {
    try {
      setLoading(true);
      const allPromos = await discountPromoService.getAllPromos();
      setPromos(allPromos);
    } catch (error) {
      console.error("Error loading promos:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMenuItems = async () => {
    try {
      const items = await getMenuItems();
      setMenuItems(items);
    } catch (error) {
      console.error("Error loading menu items:", error);
    }
  };

  const handleCreatePromo = async () => {
    try {
      if (!newPromo.name || !newPromo.description || !newPromo.startDate || !newPromo.endDate) {
        toast.error("Please fill in all required fields");
        return;
      }

      const conditions: any = {
        minPurchase: newPromo.minPurchase || undefined,
        maxDiscount: newPromo.maxDiscount || undefined,
        memberOnly: newPromo.memberOnly,
      };

      if (!applyToAll) {
        if (selectedItems.length > 0) {
          conditions.applicableItems = selectedItems;
        }
        if (selectedCategories.length > 0) {
          conditions.applicableCategories = selectedCategories;
        }
      }

      await discountPromoService.createPromo({
        name: newPromo.name,
        description: newPromo.description,
        type: newPromo.type,
        value: newPromo.value,
        startDate: new Date(newPromo.startDate),
        endDate: new Date(newPromo.endDate),
        isActive: true,
        conditions
      });
      
      toast.success(`Promo "${newPromo.name}" created successfully!`);
      setIsAddOpen(false);
      resetForm();
      loadPromos();
    } catch (error: any) {
      console.error("Error creating promo:", error);
      toast.error(error.message || "Failed to create promo");
    }
  };

  const resetForm = () => {
    setNewPromo({
      name: "",
      description: "",
      type: "percentage",
      value: 10,
      startDate: "",
      endDate: "",
      minPurchase: 0,
      maxDiscount: 0,
      memberOnly: false,
    });
    setApplyToAll(true);
    setSelectedItems([]);
    setSelectedCategories([]);
    setItemSearchQuery("");
  };

  const toggleItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'percentage': return <Percent className="h-4 w-4" />;
      case 'fixed': return <Tag className="h-4 w-4" />;
      case 'bogo': return <Gift className="h-4 w-4" />;
      case 'happy_hour': return <Clock className="h-4 w-4" />;
      default: return <Tag className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'percentage': return 'bg-blue-100 text-blue-700';
      case 'fixed': return 'bg-orange-100 text-orange-700';
      case 'bogo': return 'bg-green-100 text-green-700';
      case 'happy_hour': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredItems = menuItems.filter(item => 
    item.name.toLowerCase().includes(itemSearchQuery.toLowerCase())
  );

  if (!user || (profile?.role !== 'super_admin' && profile?.role !== 'admin')) {
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
          <span className="font-semibold">Promos</span>
        </div>
        <Button size="sm" onClick={() => setIsAddOpen(true)} className="bg-black hover:bg-gray-800">
          <Plus className="h-4 w-4 mr-2" />
          New Promo
        </Button>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Quick Templates */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-0 shadow-none bg-gray-50" onClick={() => {
            setNewPromo(prev => ({...prev, name: "Happy Hour", description: "20% off drinks", type: "happy_hour", value: 20}));
            setApplyToAll(false);
            setSelectedCategories(["Drinks"]);
            setIsAddOpen(true);
          }}>
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 mx-auto mb-2 text-gray-600" />
              <p className="font-medium text-sm">Happy Hour</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-0 shadow-none bg-gray-50" onClick={() => {
            setNewPromo(prev => ({...prev, name: "BOGO", description: "Buy 1 Get 1", type: "bogo", value: 100}));
            setApplyToAll(true);
            setIsAddOpen(true);
          }}>
            <CardContent className="p-4 text-center">
              <Gift className="h-6 w-6 mx-auto mb-2 text-gray-600" />
              <p className="font-medium text-sm">BOGO</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-0 shadow-none bg-gray-50" onClick={() => {
            setNewPromo(prev => ({...prev, name: "Member Discount", description: "10% for members", type: "percentage", value: 10, memberOnly: true}));
            setApplyToAll(true);
            setIsAddOpen(true);
          }}>
            <CardContent className="p-4 text-center">
              <Percent className="h-6 w-6 mx-auto mb-2 text-gray-600" />
              <p className="font-medium text-sm">Members</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-0 shadow-none bg-gray-50" onClick={() => {
            setNewPromo(prev => ({...prev, name: "Storewide Sale", description: "15% off everything", type: "percentage", value: 15}));
            setApplyToAll(true);
            setIsAddOpen(true);
          }}>
            <CardContent className="p-4 text-center">
              <Globe className="h-6 w-6 mx-auto mb-2 text-gray-600" />
              <p className="font-medium text-sm">Storewide</p>
            </CardContent>
          </Card>
        </div>

        {/* Promo List */}
        {loading ? (
          <div className="h-40 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : promos.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Tag className="h-12 w-12 mx-auto mb-4" />
            <p>No promotions yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {promos.map((promo) => (
              <Card key={promo.id} className="border-0 shadow-none bg-gray-50">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gray-200">
                        {getTypeIcon(promo.type)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{promo.name}</h3>
                        <div className="flex gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded ${promo.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                            {promo.isActive ? 'Active' : 'Inactive'}
                          </span>
                          {promo.conditions?.memberOnly && <span className="text-xs px-2 py-0.5 rounded bg-gray-200">Members</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8"><Edit2 className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">{promo.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {promo.type === 'percentage' ? `${promo.value}% OFF` : promo.type === 'fixed' ? `₱${promo.value} OFF` : 'BOGO'}
                    </span>
                    <span className="text-gray-400 text-xs">Used: {promo.usageCount || 0}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add Promo Dialog */}
        {isAddOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Create Promotion</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Promo Name *</Label>
                    <Input value={newPromo.name} onChange={(e) => setNewPromo({...newPromo, name: e.target.value})} placeholder="e.g., Summer Sale" />
                  </div>
                  <div>
                    <Label>Type *</Label>
                    <select className="w-full p-2 border rounded-lg" value={newPromo.type} onChange={(e) => setNewPromo({...newPromo, type: e.target.value as any})}>
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₱)</option>
                      <option value="bogo">Buy 1 Get 1</option>
                      <option value="happy_hour">Happy Hour</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label>Description *</Label>
                  <Input value={newPromo.description} onChange={(e) => setNewPromo({...newPromo, description: e.target.value})} placeholder="Describe the promotion..." />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Value {newPromo.type === 'percentage' ? '(%)' : '(₱)'}</Label>
                    <Input type="number" value={newPromo.value} onChange={(e) => setNewPromo({...newPromo, value: Number(e.target.value)})} />
                  </div>
                  <div>
                    <Label>Start Date *</Label>
                    <Input type="date" value={newPromo.startDate} onChange={(e) => setNewPromo({...newPromo, startDate: e.target.value})} />
                  </div>
                  <div>
                    <Label>End Date *</Label>
                    <Input type="date" value={newPromo.endDate} onChange={(e) => setNewPromo({...newPromo, endDate: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Min Purchase (₱)</Label>
                    <Input type="number" value={newPromo.minPurchase || ''} onChange={(e) => setNewPromo({...newPromo, minPurchase: Number(e.target.value)})} placeholder="Optional" />
                  </div>
                  <div>
                    <Label>Max Discount (₱)</Label>
                    <Input type="number" value={newPromo.maxDiscount || ''} onChange={(e) => setNewPromo({...newPromo, maxDiscount: Number(e.target.value)})} placeholder="Optional" />
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Switch checked={newPromo.memberOnly} onCheckedChange={(checked) => setNewPromo({...newPromo, memberOnly: checked})} />
                  <Label className="mb-0 cursor-pointer">Members Only</Label>
                </div>

                {/* Product Selection */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2"><Package className="h-5 w-5" />Apply To</h3>
                  
                  <div className="flex items-center gap-3 mb-4 p-3 bg-indigo-50 rounded-lg">
                    <Switch checked={applyToAll} onCheckedChange={setApplyToAll} />
                    <div>
                      <Label className="mb-0 cursor-pointer font-medium">{applyToAll ? 'All Products (Storewide)' : 'Specific Products Only'}</Label>
                      <p className="text-xs text-gray-500">{applyToAll ? 'Promo applies to every item' : 'Select which items/categories'}</p>
                    </div>
                  </div>

                  {!applyToAll && (
                    <div className="space-y-4">
                      <div>
                        <Label className="mb-2">Select Categories</Label>
                        <div className="flex flex-wrap gap-2">
                          {CATEGORIES.map((category) => (
                            <Button key={category} type="button" variant={selectedCategories.includes(category) ? 'default' : 'outline'} size="sm" onClick={() => toggleCategory(category)}>
                              {selectedCategories.includes(category) ? <CheckSquare className="h-4 w-4 mr-1" /> : <Square className="h-4 w-4 mr-1" />}
                              {category}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="mb-2">Or Select Specific Items</Label>
                        <Input placeholder="Search items..." value={itemSearchQuery} onChange={(e) => setItemSearchQuery(e.target.value)} className="mb-2" />
                        <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-1">
                          {filteredItems.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">No items found</p>
                          ) : (
                            filteredItems.map((item) => (
                              <div key={item.id} className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${selectedItems.includes(item.id) ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-gray-50'}`} onClick={() => toggleItem(item.id)}>
                                <div className="flex items-center gap-2">
                                  {selectedItems.includes(item.id) ? <CheckSquare className="h-5 w-5 text-indigo-600" /> : <Square className="h-5 w-5 text-gray-400" />}
                                  <div>
                                    <p className="font-medium text-sm">{item.name}</p>
                                    <p className="text-xs text-gray-500">₱{item.price} • {item.category}</p>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{selectedItems.length} items selected</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t">
                <Button variant="outline" className="flex-1" onClick={() => {setIsAddOpen(false); resetForm();}}>Cancel</Button>
                <Button className="flex-1 bg-indigo-600" onClick={handleCreatePromo}>Create Promo</Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
