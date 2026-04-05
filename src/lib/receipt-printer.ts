import { Order } from "@/types";

export interface ReceiptData {
  orderId: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  cashierName: string;
  date: string;
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
  customerName?: string;
  customerPoints?: number;
}

class ReceiptPrinter {
  private storeInfo = {
    name: "X-POS Store",
    address: "Your Store Address",
    phone: "+63 XXX XXX XXXX",
    vatNumber: "000-000-000-000"
  };

  setStoreInfo(info: Partial<typeof this.storeInfo>) {
    this.storeInfo = { ...this.storeInfo, ...info };
  }

  generateReceiptHTML(data: ReceiptData): string {
    const receiptWidth = "80mm"; // Standard thermal paper width
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt - ${data.orderId}</title>
  <style>
    @page {
      size: ${receiptWidth} auto;
      margin: 0;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      width: ${receiptWidth};
      font-family: 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.4;
      padding: 8px;
      background: white;
    }
    
    .center { text-align: center; }
    .right { text-align: right; }
    .bold { font-weight: bold; }
    .large { font-size: 14px; }
    .small { font-size: 10px; }
    
    .header {
      border-bottom: 1px dashed #000;
      padding-bottom: 8px;
      margin-bottom: 8px;
    }
    
    .store-name {
      font-size: 16px;
      font-weight: bold;
      text-transform: uppercase;
    }
    
    .divider {
      border-top: 1px dashed #000;
      margin: 8px 0;
    }
    
    .item-row {
      display: flex;
      justify-content: space-between;
      margin: 4px 0;
    }
    
    .item-name {
      flex: 1;
      text-align: left;
    }
    
    .item-qty {
      width: 30px;
      text-align: center;
    }
    
    .item-price {
      width: 60px;
      text-align: right;
    }
    
    .totals-row {
      display: flex;
      justify-content: space-between;
      margin: 4px 0;
    }
    
    .totals-label {
      flex: 1;
    }
    
    .totals-value {
      width: 80px;
      text-align: right;
    }
    
    .grand-total {
      font-size: 14px;
      font-weight: bold;
      border-top: 1px solid #000;
      border-bottom: 1px solid #000;
      padding: 4px 0;
      margin: 8px 0;
    }
    
    .footer {
      margin-top: 16px;
      text-align: center;
      font-size: 10px;
    }
    
    .barcode {
      text-align: center;
      font-family: 'Libre Barcode 39', monospace;
      font-size: 24px;
      margin: 8px 0;
    }
    
    @media print {
      body {
        width: ${receiptWidth};
        margin: 0;
        padding: 0;
      }
      
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header center">
    <div class="store-name">${this.storeInfo.name}</div>
    <div class="small">${this.storeInfo.address}</div>
    <div class="small">Tel: ${this.storeInfo.phone}</div>
    <div class="small">VAT Reg TIN: ${this.storeInfo.vatNumber}</div>
  </div>
  
  <div class="divider"></div>
  
  <div class="center small">
    <div>ORDER #: ${data.orderId}</div>
    <div>${data.date}</div>
    <div>Cashier: ${data.cashierName}</div>
    ${data.customerName ? `<div>Customer: ${data.customerName}</div>` : ''}
  </div>
  
  <div class="divider"></div>
  
  <div class="bold">ITEMS:</div>
  ${data.items.map(item => `
    <div class="item-row">
      <span class="item-name">${item.name}</span>
      <span class="item-qty">${item.quantity}x</span>
      <span class="item-price">₱${item.total.toFixed(2)}</span>
    </div>
    <div class="small" style="margin-left: 8px;">@ ₱${item.price.toFixed(2)} each</div>
  `).join('')}
  
  <div class="divider"></div>
  
  <div class="totals-row">
    <span class="totals-label">Subtotal:</span>
    <span class="totals-value">₱${data.subtotal.toFixed(2)}</span>
  </div>
  
  ${data.discount > 0 ? `
    <div class="totals-row">
      <span class="totals-label">Discount:</span>
      <span class="totals-value" style="color: red;">-₱${data.discount.toFixed(2)}</span>
    </div>
  ` : ''}
  
  <div class="totals-row">
    <span class="totals-label">VAT (12%):</span>
    <span class="totals-value">₱${data.tax.toFixed(2)}</span>
  </div>
  
  <div class="grand-total totals-row">
    <span class="totals-label">TOTAL:</span>
    <span class="totals-value">₱${data.total.toFixed(2)}</span>
  </div>
  
  <div class="totals-row" style="margin-top: 8px;">
    <span class="totals-label">Payment Method:</span>
    <span class="totals-value">${data.paymentMethod}</span>
  </div>
  
  <div class="divider"></div>
  
  <div class="footer">
    <div class="barcode">*${data.orderId}*</div>
    <div>Thank you for your purchase!</div>
    <div class="small">Please come again</div>
    ${data.customerPoints ? `<div style="margin-top: 8px;">Points earned: ${data.customerPoints}</div>` : ''}
    <div style="margin-top: 8px; font-size: 8px;">
      This serves as your official receipt.<br>
      Keep this receipt for returns/exchanges.
    </div>
  </div>
  
  <div class="no-print" style="margin-top: 20px; text-align: center;">
    <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px; cursor: pointer;">
      Print Receipt
    </button>
    <button onclick="window.close()" style="padding: 10px 20px; font-size: 14px; cursor: pointer; margin-left: 10px;">
      Close
    </button>
  </div>
</body>
</html>`;
  }

  printReceipt(data: ReceiptData) {
    const receiptHTML = this.generateReceiptHTML(data);
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    
    if (printWindow) {
      printWindow.document.write(receiptHTML);
      printWindow.document.close();
      
      // Auto print after a short delay to ensure content is loaded
      setTimeout(() => {
        printWindow.print();
      }, 500);
    } else {
      // Fallback: Create a hidden iframe
      this.printViaIframe(receiptHTML);
    }
  }

  private printViaIframe(html: string) {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    
    document.body.appendChild(iframe);
    
    iframe.contentWindow?.document.open();
    iframe.contentWindow?.document.write(html);
    iframe.contentWindow?.document.close();
    
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 500);
    };
  }

  // For Bluetooth/WiFi thermal printers (advanced)
  async printToThermalPrinter(data: ReceiptData, printerAddress?: string) {
    // This would integrate with printer-specific SDKs
    // For now, we'll use the browser print which works with most thermal printers
    this.printReceipt(data);
  }

  generateEscPosCommands(data: ReceiptData): string {
    // Generate ESC/POS commands for direct thermal printer communication
    // This is useful for native apps or Electron-based POS systems
    
    let commands = '';
    
    // Initialize printer
    commands += '\x1B\x40'; // ESC @ - Initialize
    
    // Center alignment
    commands += '\x1B\x61\x01'; // ESC a 1 - Center
    
    // Store name (double height/width)
    commands += '\x1D\x21\x11'; // GS ! 17 - Double size
    commands += this.storeInfo.name + '\n';
    commands += '\x1D\x21\x00'; // GS ! 0 - Normal size
    
    // Store info
    commands += this.storeInfo.address + '\n';
    commands += 'Tel: ' + this.storeInfo.phone + '\n';
    commands += 'VAT: ' + this.storeInfo.vatNumber + '\n';
    commands += '\n';
    
    // Order info
    commands += '\x1B\x61\x00'; // ESC a 0 - Left
    commands += 'ORDER #: ' + data.orderId + '\n';
    commands += data.date + '\n';
    commands += 'Cashier: ' + data.cashierName + '\n';
    if (data.customerName) {
      commands += 'Customer: ' + data.customerName + '\n';
    }
    commands += '\n';
    
    // Items
    commands += 'ITEMS:\n';
    commands += '-'.repeat(32) + '\n';
    
    data.items.forEach(item => {
      const line = `${item.name.substring(0, 20).padEnd(20)} ${item.quantity.toString().padStart(3)}x ₱${item.total.toFixed(2).padStart(8)}`;
      commands += line + '\n';
    });
    
    commands += '-'.repeat(32) + '\n';
    
    // Totals
    commands += 'Subtotal:'.padEnd(24) + '₱' + data.subtotal.toFixed(2).padStart(8) + '\n';
    if (data.discount > 0) {
      commands += ('Discount:'.padEnd(24) + '-₱' + data.discount.toFixed(2).padStart(7)) + '\n';
    }
    commands += 'VAT (12%):'.padEnd(24) + '₱' + data.tax.toFixed(2).padStart(8) + '\n';
    commands += '-'.repeat(32) + '\n';
    
    // Bold for total
    commands += '\x1B\x45\x01'; // ESC E 1 - Bold on
    commands += 'TOTAL:'.padEnd(24) + '₱' + data.total.toFixed(2).padStart(8) + '\n';
    commands += '\x1B\x45\x00'; // ESC E 0 - Bold off
    
    commands += '\n';
    commands += 'Payment: ' + data.paymentMethod + '\n';
    commands += '\n';
    
    // Footer
    commands += '\x1B\x61\x01'; // ESC a 1 - Center
    commands += 'Thank you for your purchase!\n';
    commands += 'Please come again\n';
    if (data.customerPoints) {
      commands += 'Points earned: ' + data.customerPoints + '\n';
    }
    commands += '\n\n\n';
    
    // Cut paper
    commands += '\x1D\x56\x00'; // GS V 0 - Full cut
    
    return commands;
  }
}

export const receiptPrinter = new ReceiptPrinter();
