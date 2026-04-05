"use client";

import { useState, useRef, useEffect } from "react";
import { 
  ArrowLeft, 
  Scan, 
  Search, 
  Plus, 
  Package,
  Camera,
  Keyboard,
  QrCode,
  CheckCircle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { barcodeScanning, BarcodeProduct } from "@/lib/barcode-scanning";
import { getMenuItems } from "@/lib/firestore-service";
import { MenuItem } from "@/types";

export default function BarcodeScanningPage() {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [scannedProduct, setScannedProduct] = useState<BarcodeProduct | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentScans, setRecentScans] = useState<BarcodeProduct[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMenuItems();
    barcodeScanning.initializeBarcodes();
    
    // Setup hardware scanner listener
    if (inputRef.current) {
      barcodeScanning.setupHardwareScanner(inputRef.current, handleProductFound);
    }
  }, []);

  const loadMenuItems = async () => {
    try {
      const items = await getMenuItems();
      setMenuItems(items);
      
      // Auto-generate barcodes for items without them
      items.forEach(item => {
        const existing = barcodeScanning.lookupProduct(item.id);
        if (!existing) {
          const barcode = barcodeScanning.generateBarcode(item.id);
          barcodeScanning.addBarcode({
            barcode,
            itemId: item.id,
            name: item.name,
            price: item.price,
            stock: item.stock,
            category: item.category
          });
        }
      });
    } catch (error) {
      console.error("Error loading menu:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductFound = (product: BarcodeProduct) => {
    setScannedProduct(product);
    setRecentScans(prev => [product, ...prev.slice(0, 4)]);
    toast.success(`Found: ${product.name} - ₱${product.price}`);
  };

  const startCameraScanning = async () => {
    if (!videoRef.current) return;
    
    const success = await barcodeScanning.startCameraScanning(videoRef.current);
    if (success) {
      setScanning(true);
      toast.info("Camera scanning started. Point at barcode.");
    } else {
      toast.error("Failed to access camera");
    }
  };

  const stopCameraScanning = () => {
    barcodeScanning.stopCameraScanning();
    setScanning(false);
  };

  const handleManualScan = () => {
    if (!manualInput.trim()) return;
    
    const product = barcodeScanning.lookupProduct(manualInput.trim());
    if (product) {
      handleProductFound(product);
      setManualInput("");
    } else {
      toast.error("Product not found");
    }
  };

  const simulateScan = (barcode: string) => {
    const product = barcodeScanning.simulateScan(barcode);
    if (product) {
      handleProductFound(product);
    }
  };

  const addToCart = (product: BarcodeProduct) => {
    // Add to cart logic here
    toast.success(`${product.name} added to cart`);
    setScannedProduct(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Scan className="h-8 w-8 text-indigo-600" />
                Barcode Scanner
              </h1>
              <p className="text-gray-500">Scan products to add to cart</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Camera Scanner */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Camera Scanner
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className={`w-full h-full object-cover ${scanning ? 'block' : 'hidden'}`}
                />
                {!scanning && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Camera inactive</p>
                    </div>
                  </div>
                )}
                {scanning && (
                  <div className="absolute inset-0 border-2 border-indigo-500/50 m-8 rounded-lg">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-32 h-32 border-2 border-indigo-500 rounded-lg" />
                    </div>
                  </div>
                )}
              </div>
              
              <Button
                className="w-full"
                onClick={scanning ? stopCameraScanning : startCameraScanning}
                variant={scanning ? "destructive" : "default"}
              >
                {scanning ? (
                  <>
                    <Scan className="h-4 w-4 mr-2" />
                    Stop Scanning
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    Start Camera Scan
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Manual Input & Hardware Scanner */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Keyboard className="h-5 w-5" />
                Manual / Hardware Scanner
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Barcode Input</label>
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    placeholder="Scan or type barcode..."
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleManualScan()}
                    className="flex-1"
                  />
                  <Button onClick={handleManualScan}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Connect USB barcode scanner and scan directly, or type barcode manually
                </p>
              </div>

              {/* Test Barcodes */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Test Barcodes</label>
                <div className="grid grid-cols-2 gap-2">
                  {barcodeScanning.getAllBarcodes().slice(0, 6).map((product) => (
                    <Button
                      key={product.barcode}
                      variant="outline"
                      size="sm"
                      onClick={() => simulateScan(product.barcode)}
                      className="text-xs justify-start"
                    >
                      <QrCode className="h-3 w-3 mr-1" />
                      {product.name.substring(0, 15)}...
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scanned Product Result */}
        {scannedProduct && (
          <Card className="border-indigo-200 bg-indigo-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-white rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{scannedProduct.name}</h3>
                  <p className="text-sm text-gray-500">Category: {scannedProduct.category}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <Badge variant="secondary">Stock: {scannedProduct.stock}</Badge>
                    <span className="text-xl font-bold text-indigo-600">
                      ₱{scannedProduct.price.toFixed(2)}
                    </span>
                  </div>
                </div>
                <Button 
                  size="lg" 
                  onClick={() => addToCart(scannedProduct)}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add to Cart
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Scans */}
        {recentScans.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Scans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {recentScans.map((product, index) => (
                  <Card key={`${product.barcode}-${index}`} className="bg-gray-50">
                    <CardContent className="p-4">
                      <Package className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="font-medium text-sm truncate">{product.name}</p>
                      <p className="text-xs text-gray-500">₱{product.price.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Barcode List */}
        <Card>
          <CardHeader>
            <CardTitle>Registered Barcodes ({barcodeScanning.getAllBarcodes().length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-32 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3">Barcode</th>
                      <th className="text-left p-3">Product</th>
                      <th className="text-left p-3">Category</th>
                      <th className="text-right p-3">Price</th>
                      <th className="text-right p-3">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {barcodeScanning.getAllBarcodes().map((product) => (
                      <tr key={product.barcode} className="border-t">
                        <td className="p-3 font-mono text-xs">{product.barcode}</td>
                        <td className="p-3">{product.name}</td>
                        <td className="p-3">{product.category}</td>
                        <td className="p-3 text-right">₱{product.price.toFixed(2)}</td>
                        <td className="p-3 text-right">{product.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
