// Barcode Scanning Service - Camera/Scanner support for products
export interface BarcodeProduct {
  barcode: string;
  itemId: string;
  name: string;
  price: number;
  stock: number;
  category: string;
}

class BarcodeScanningService {
  private barcodeMap: Map<string, BarcodeProduct> = new Map();
  private isScanning: boolean = false;
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private stream: MediaStream | null = null;

  // Initialize with sample barcodes (in production, load from database)
  async initializeBarcodes() {
    // Sample barcode mappings
    const sampleBarcodes: BarcodeProduct[] = [
      { barcode: '4801234567890', itemId: '1', name: 'Sinandomeng Rice (1kg)', price: 55, stock: 500, category: 'Grains' },
      { barcode: '4801234567891', itemId: '2', name: 'Dinorado Rice (1kg)', price: 65, stock: 300, category: 'Grains' },
      { barcode: '4801234567892', itemId: '3', name: 'Instant Noodles', price: 15, stock: 100, category: 'Grocery' },
      { barcode: '4801234567893', itemId: '4', name: 'Canned Sardines', price: 25, stock: 80, category: 'Grocery' },
      { barcode: '4801234567894', itemId: '5', name: 'Bottled Water (500ml)', price: 15, stock: 200, category: 'Drinks' },
      { barcode: '4801234567895', itemId: '6', name: 'Coffee Sachet', price: 12, stock: 150, category: 'Drinks' },
    ];

    sampleBarcodes.forEach(product => {
      this.barcodeMap.set(product.barcode, product);
    });
  }

  // Lookup product by barcode
  lookupProduct(barcode: string): BarcodeProduct | null {
    return this.barcodeMap.get(barcode) || null;
  }

  // Add barcode mapping
  addBarcode(product: BarcodeProduct) {
    this.barcodeMap.set(product.barcode, product);
  }

  // Generate barcode for product
  generateBarcode(itemId: string): string {
    // Generate EAN-13 format barcode
    const prefix = '480'; // Philippines country code
    const random = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
    const base = prefix + random;
    const checkDigit = this.calculateCheckDigit(base);
    return base + checkDigit;
  }

  private calculateCheckDigit(base: string): string {
    let sum = 0;
    for (let i = 0; i < base.length; i++) {
      const digit = parseInt(base[i]);
      sum += i % 2 === 0 ? digit : digit * 3;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit.toString();
  }

  // Validate barcode
  validateBarcode(barcode: string): boolean {
    if (barcode.length !== 13) return false;
    if (!/^\d+$/.test(barcode)) return false;
    
    const base = barcode.slice(0, 12);
    const checkDigit = barcode.slice(12);
    const calculatedCheckDigit = this.calculateCheckDigit(base);
    
    return checkDigit === calculatedCheckDigit;
  }

  // Start camera scanning
  async startCameraScanning(videoElement: HTMLVideoElement): Promise<boolean> {
    try {
      this.videoElement = videoElement;
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      videoElement.srcObject = this.stream;
      await videoElement.play();
      
      this.isScanning = true;
      this.scanLoop();
      
      return true;
    } catch (error) {
      console.error('Error accessing camera:', error);
      return false;
    }
  }

  // Stop camera scanning
  stopCameraScanning() {
    this.isScanning = false;
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
  }

  private scanLoop() {
    if (!this.isScanning) return;
    
    // In a real implementation, this would use a barcode detection library
    // like Dynamsoft, QuaggaJS, or ZXing
    // For now, we'll simulate scanning
    
    // Simulate frame processing
    requestAnimationFrame(() => this.scanLoop());
  }

  // Process scanned barcode image
  async processBarcodeImage(imageData: ImageData): Promise<string | null> {
    // In production, use a barcode detection library here
    // Example libraries:
    // - QuaggaJS (for JavaScript)
    // - Dynamsoft Barcode Reader
    // - ZXing (ported to JavaScript)
    
    // For now, return a simulated result
    return null;
  }

  // Simulate scan (for testing)
  simulateScan(barcode: string): BarcodeProduct | null {
    return this.lookupProduct(barcode);
  }

  // Physical barcode scanner support (USB/Bluetooth)
  setupHardwareScanner(inputElement: HTMLInputElement, onScan: (product: BarcodeProduct) => void) {
    // Most barcode scanners act as keyboard input
    let scannedCode = '';
    let lastInputTime = Date.now();
    
    inputElement.addEventListener('keydown', (e) => {
      const currentTime = Date.now();
      
      // Reset if too much time passed (new scan)
      if (currentTime - lastInputTime > 100) {
        scannedCode = '';
      }
      
      lastInputTime = currentTime;
      
      if (e.key === 'Enter') {
        // Scan complete
        const product = this.lookupProduct(scannedCode);
        if (product) {
          onScan(product);
        }
        scannedCode = '';
      } else if (e.key.length === 1) {
        // Accumulate digits
        scannedCode += e.key;
      }
    });
  }

  // Get all registered barcodes
  getAllBarcodes(): BarcodeProduct[] {
    return Array.from(this.barcodeMap.values());
  }

  // Delete barcode
  deleteBarcode(barcode: string): boolean {
    return this.barcodeMap.delete(barcode);
  }

  // Export barcodes
  exportBarcodes(): string {
    const data = this.getAllBarcodes();
    return JSON.stringify(data, null, 2);
  }

  // Import barcodes
  importBarcodes(jsonData: string): boolean {
    try {
      const data: BarcodeProduct[] = JSON.parse(jsonData);
      data.forEach(product => this.addBarcode(product));
      return true;
    } catch (error) {
      console.error('Error importing barcodes:', error);
      return false;
    }
  }
}

export const barcodeScanning = new BarcodeScanningService();
