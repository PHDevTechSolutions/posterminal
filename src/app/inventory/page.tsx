"use client";

import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Edit, 
  Loader2,
  AlertTriangle,
  Image as ImageIcon,
  Upload,
  X,
  Tag
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
import { MenuItem, Category } from "@/types";
import { 
  getMenuItems, 
  addMenuItem, 
  updateMenuItem, 
  getCategories, 
  addCategory, 
  deleteCategory 
} from "@/lib/firestore-service";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function InventoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [currentItem, setCurrentItem] = useState<Partial<MenuItem>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log("Loading inventory data...");
      console.log("Current user:", user?.email, "UID:", user?.uid);
      
      const [menuData, catData] = await Promise.all([
        getMenuItems().catch(err => {
          console.error("Menu items error:", err);
          throw err;
        }),
        getCategories().catch(err => {
          console.error("Categories error:", err);
          throw err;
        })
      ]);
      
      console.log("Menu items loaded:", menuData.length);
      console.log("Categories loaded:", catData.length);
      setItems(menuData);
      setCategories(catData);
    } catch (error: any) {
      console.error("Failed to load inventory data:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      
      if (error.code === 'permission-denied') {
        toast.error("Permission denied. Please check your Firebase security rules and ensure you're logged in.");
      } else if (error.code === 'unauthenticated') {
        toast.error("You must be logged in to access inventory.");
      } else {
        toast.error(`Failed to load inventory data: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      
      const imageUrl = await uploadToCloudinary(base64);
      setCurrentItem({ ...currentItem, image: imageUrl });
      toast.success("Image uploaded!");
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await addCategory(newCategoryName.trim());
      setNewCategoryName("");
      const updatedCats = await getCategories();
      setCategories(updatedCats);
      toast.success("Category added");
    } catch (error) {
      toast.error("Failed to add category");
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"? Items in this category will remain.`)) return;
    try {
      await deleteCategory(id, name);
      const updatedCats = await getCategories();
      setCategories(updatedCats);
      toast.success("Category deleted");
    } catch (error) {
      toast.error("Failed to delete category");
    }
  };

  const handleSave = async () => {
    if (!currentItem.name || !currentItem.price || !currentItem.category) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setSaving(true);
      console.log("Saving item:", currentItem);
      
      if (currentItem.id) {
        // Update existing item
        const updateData = {
          ...currentItem,
          cost: Number(currentItem.cost || 0),
          price: Number(currentItem.price || 0),
          stock: Number(currentItem.stock || 0)
        };
        console.log("Updating item with data:", updateData);
        await updateMenuItem(currentItem.id, updateData);
        toast.success("Item updated successfully");
        setIsEditOpen(false);
      } else {
        // Add new item
        const newItem = {
          name: currentItem.name,
          price: Number(currentItem.price),
          cost: Number(currentItem.cost || 0),
          category: currentItem.category,
          stock: Number(currentItem.stock || 0),
          image: currentItem.image || ""
        };
        console.log("Adding new item:", newItem);
        await addMenuItem(newItem);
        toast.success("Item added successfully");
        setIsAddOpen(false);
        setCurrentItem({}); // Reset form
      }
      
      // Reload data to reflect changes
      await loadData();
    } catch (error: any) {
      console.error("Failed to save item:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      
      if (error.code === 'permission-denied') {
        toast.error("Permission denied. You don't have rights to modify inventory items.");
      } else if (error.code === 'unauthenticated') {
        toast.error("You must be logged in to save items.");
      } else {
        toast.error(`Failed to save item: ${error.message}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <h1 className="font-black text-xl text-gray-900 tracking-tighter">Inventory</h1>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger>
            <Button size="icon" className="bg-indigo-600 hover:bg-indigo-700 h-10 w-10 rounded-xl shadow-lg shadow-indigo-100" onClick={() => setCurrentItem({})}>
              <Plus className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95%] sm:max-w-[425px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tighter">Add New Item</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label className="text-xs font-bold uppercase text-gray-400">Item Name</Label>
                <Input className="rounded-xl h-11" placeholder="e.g. Sinandomeng 1kg" value={currentItem.name || ""} onChange={(e) => setCurrentItem({...currentItem, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-xs font-bold uppercase text-gray-400">Cost (₱)</Label>
                  <Input className="rounded-xl h-11" type="number" placeholder="0.00" value={currentItem.cost || ""} onChange={(e) => setCurrentItem({...currentItem, cost: Number(e.target.value)})} />
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs font-bold uppercase text-gray-400">Price (₱)</Label>
                  <Input className="rounded-xl h-11" type="number" placeholder="0.00" value={currentItem.price || ""} onChange={(e) => setCurrentItem({...currentItem, price: Number(e.target.value)})} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-bold uppercase text-gray-400">Initial Stock</Label>
                <Input className="rounded-xl h-11" type="number" placeholder="0" value={currentItem.stock || ""} onChange={(e) => setCurrentItem({...currentItem, stock: Number(e.target.value)})} />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-bold uppercase text-gray-400">Category</Label>
                <Select value={currentItem.category as any} onValueChange={(val) => setCurrentItem({...currentItem, category: val})}>
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button className="w-full h-12 rounded-xl bg-indigo-600 font-bold" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save Item"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-8 space-y-6 lg:space-y-8">
        <div className="hidden lg:flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="h-12 w-12 rounded-2xl hover:bg-white hover:shadow-md transition-all">
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Inventory</h1>
              <p className="text-gray-500 font-medium">Manage your products and monitor stock levels</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Dialog open={isCategoryOpen} onOpenChange={setIsCategoryOpen}>
              <DialogTrigger>
                <Button variant="outline" className="h-12 px-6 rounded-2xl gap-2 font-bold border-indigo-100 text-indigo-600 hover:bg-indigo-50">
                  <Tag className="h-5 w-5" />
                  Categories
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] rounded-3xl p-8">
                <DialogHeader>
                  <DialogTitle className="text-3xl font-black tracking-tighter">Categories</DialogTitle>
                  <DialogDescription className="font-medium text-gray-400">Add or remove product categories</DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-6">
                  <div className="flex gap-2">
                    <Input 
                      placeholder="New category name..." 
                      className="rounded-xl h-12 bg-gray-50 border-none"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                    />
                    <Button className="h-12 rounded-xl bg-indigo-600" onClick={handleAddCategory}>
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {categories.map((cat) => (
                      <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <span className="font-bold text-gray-700">{cat.name}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg" onClick={() => handleDeleteCategory(cat.id, cat.name)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger>
                <Button className="bg-indigo-600 hover:bg-indigo-700 h-12 px-6 rounded-2xl gap-2 font-bold shadow-xl shadow-indigo-100 transition-all active:scale-95" onClick={() => setCurrentItem({})}>
                  <Plus className="h-5 w-5" />
                  Add New Item
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] rounded-3xl p-8 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-3xl font-black tracking-tighter">Add Item</DialogTitle>
                  <DialogDescription className="font-medium text-gray-400">Enter product details and upload image</DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-6">
                  <div className="flex justify-center">
                    <div className="relative group">
                      <div className="h-32 w-32 rounded-3xl bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-200 overflow-hidden">
                        {currentItem.image ? (
                          <img src={currentItem.image} alt="Preview" className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="h-10 w-10 text-gray-300" />
                        )}
                        {uploading && (
                          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                          </div>
                        )}
                      </div>
                      <label className="absolute -bottom-2 -right-2 h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white cursor-pointer shadow-lg hover:bg-indigo-700 transition-colors">
                        <Upload className="h-5 w-5" />
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                      </label>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Product Name</Label>
                    <Input className="rounded-2xl h-12 bg-gray-50 border-none" value={currentItem.name || ""} onChange={(e) => setCurrentItem({...currentItem, name: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Cost (₱)</Label>
                      <Input className="rounded-2xl h-12 bg-gray-50 border-none" type="number" value={currentItem.cost || ""} onChange={(e) => setCurrentItem({...currentItem, cost: Number(e.target.value)})} />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Price (₱)</Label>
                      <Input className="rounded-2xl h-12 bg-gray-50 border-none" type="number" value={currentItem.price || ""} onChange={(e) => setCurrentItem({...currentItem, price: Number(e.target.value)})} />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Stock Level</Label>
                    <Input className="rounded-2xl h-12 bg-gray-50 border-none" type="number" value={currentItem.stock || ""} onChange={(e) => setCurrentItem({...currentItem, stock: Number(e.target.value)})} />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Category</Label>
                    <Select value={currentItem.category as any} onValueChange={(val) => setCurrentItem({...currentItem, category: val})}>
                      <SelectTrigger className="rounded-2xl h-12 bg-gray-50 border-none">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button className="w-full h-14 rounded-2xl bg-indigo-600 font-black text-lg shadow-xl shadow-indigo-100" onClick={handleSave} disabled={saving || uploading}>
                    {saving ? <Loader2 className="h-6 w-6 animate-spin" /> : "CREATE PRODUCT"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border p-4 lg:p-8 space-y-6">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input 
              placeholder="Search by name or category..." 
              className="pl-12 h-12 lg:h-14 rounded-2xl bg-gray-50 border-none text-lg group focus-within:bg-white transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="hidden lg:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b-2 border-gray-50">
                  <TableHead className="font-black text-gray-400 uppercase text-[10px] tracking-widest">Product</TableHead>
                  <TableHead className="font-black text-gray-400 uppercase text-[10px] tracking-widest">Category</TableHead>
                  <TableHead className="font-black text-gray-400 uppercase text-[10px] tracking-widest">Cost</TableHead>
                  <TableHead className="font-black text-gray-400 uppercase text-[10px] tracking-widest">Selling Price</TableHead>
                  <TableHead className="font-black text-gray-400 uppercase text-[10px] tracking-widest">Profit</TableHead>
                  <TableHead className="font-black text-gray-400 uppercase text-[10px] tracking-widest">Stock</TableHead>
                  <TableHead className="font-black text-gray-400 uppercase text-[10px] tracking-widest">Status</TableHead>
                  <TableHead className="text-right font-black text-gray-400 uppercase text-[10px] tracking-widest">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-40 text-center">
                      <Loader2 className="h-10 w-10 animate-spin mx-auto text-indigo-600 opacity-20" />
                    </TableCell>
                  </TableRow>
                ) : filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-40 text-center text-gray-400 font-bold">
                      No products found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={item.id} className="group hover:bg-gray-50/50 transition-colors border-b border-gray-50">
                      <TableCell className="font-bold text-gray-900 py-6">{item.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 border-none font-bold text-[10px] uppercase px-3 py-1">
                          {item.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-400 font-bold">₱{(item.cost || 0).toFixed(2)}</TableCell>
                      <TableCell className="font-black text-indigo-600">₱{item.price.toFixed(2)}</TableCell>
                      <TableCell>
                        <span className="text-emerald-500 font-black">
                          ₱{(item.price - (item.cost || 0)).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="font-bold text-gray-700">{item.stock}</TableCell>
                      <TableCell>
                        {item.stock <= 0 ? (
                          <Badge className="bg-red-100 text-red-600 hover:bg-red-100 border-none font-bold gap-1 px-3 py-1">
                            <AlertTriangle className="h-3 w-3" />
                            EMPTY
                          </Badge>
                        ) : item.stock <= 10 ? (
                          <Badge className="bg-amber-100 text-amber-600 hover:bg-amber-100 border-none font-bold gap-1 px-3 py-1">
                            <AlertTriangle className="h-3 w-3" />
                            LOW
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-100 text-emerald-600 hover:bg-emerald-100 border-none font-bold px-3 py-1">
                            HEALTHY
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-10 w-10 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl"
                          onClick={() => {
                            setCurrentItem(item);
                            setIsEditOpen(true);
                          }}
                        >
                          <Edit className="h-5 w-5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Product List */}
          <div className="lg:hidden space-y-4">
            {loading ? (
              <div className="py-20 flex justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600 opacity-20" />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="py-20 text-center text-gray-400 font-bold">No products found.</div>
            ) : (
              filteredItems.map((item) => (
                <div key={item.id} className="p-4 rounded-2xl border bg-gray-50/50 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-black text-gray-900 tracking-tight">{item.name}</h3>
                      <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 border-none font-bold text-[10px] uppercase mt-1">
                        {item.category}
                      </Badge>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-10 w-10 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl"
                      onClick={() => {
                        setCurrentItem(item);
                        setIsEditOpen(true);
                      }}
                    >
                      <Edit className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white p-2 rounded-xl border-none shadow-sm flex flex-col items-center">
                      <span className="text-[8px] font-black text-gray-400 uppercase">Cost</span>
                      <span className="font-bold text-xs">₱{(item.cost || 0).toFixed(0)}</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border-none shadow-sm flex flex-col items-center">
                      <span className="text-[8px] font-black text-gray-400 uppercase">Price</span>
                      <span className="font-black text-xs text-indigo-600">₱{item.price.toFixed(0)}</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border-none shadow-sm flex flex-col items-center">
                      <span className="text-[8px] font-black text-gray-400 uppercase">Stock</span>
                      <span className="font-bold text-xs">{item.stock}</span>
                    </div>
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
            <DialogTitle className="text-3xl font-black tracking-tighter">Edit Product</DialogTitle>
            <DialogDescription className="font-medium text-gray-400">Update item details and image</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-6">
            <div className="flex justify-center">
              <div className="relative group">
                <div className="h-32 w-32 rounded-3xl bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-200 overflow-hidden">
                  {currentItem.image ? (
                    <img src={currentItem.image} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-gray-300" />
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                    </div>
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white cursor-pointer shadow-lg hover:bg-indigo-700 transition-colors">
                  <Upload className="h-5 w-5" />
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Product Name</Label>
              <Input className="rounded-2xl h-12 bg-gray-50 border-none" value={currentItem.name || ""} onChange={(e) => setCurrentItem({...currentItem, name: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Cost (₱)</Label>
                <Input className="rounded-2xl h-12 bg-gray-50 border-none" type="number" value={currentItem.cost || ""} onChange={(e) => setCurrentItem({...currentItem, cost: Number(e.target.value)})} />
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Price (₱)</Label>
                <Input className="rounded-2xl h-12 bg-gray-50 border-none" type="number" value={currentItem.price || ""} onChange={(e) => setCurrentItem({...currentItem, price: Number(e.target.value)})} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Update Stock</Label>
              <Input className="rounded-2xl h-12 bg-gray-50 border-none" type="number" value={currentItem.stock || ""} onChange={(e) => setCurrentItem({...currentItem, stock: Number(e.target.value)})} />
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Category</Label>
              <Select value={currentItem.category as any} onValueChange={(val) => setCurrentItem({...currentItem, category: val})}>
                <SelectTrigger className="rounded-2xl h-12 bg-gray-50 border-none">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button className="w-full h-14 rounded-2xl bg-indigo-600 font-black text-lg shadow-xl shadow-indigo-100" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-6 w-6 animate-spin" /> : "UPDATE PRODUCT"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
