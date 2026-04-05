import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// Force dynamic to prevent static generation issues with firebase-admin
export const dynamic = 'force-dynamic';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export async function POST(request: Request) {
  try {
    console.log('=== BACKUP REQUEST START ===');
    
    const body = await request.text();
    console.log('Raw request body:', body);
    
    let parsedBody;
    try {
      parsedBody = JSON.parse(body);
      console.log('Parsed request body:', parsedBody);
    } catch (parseError: any) {
      console.error('JSON parse error:', parseError);
      console.error('Raw body that failed to parse:', body);
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid JSON in request body',
        details: parseError?.message || 'Unknown parsing error',
        rawBody: body
      }, { status: 400 });
    }

    const { type, startDate, endDate } = parsedBody;

    if (!type || !startDate || !endDate) {
      console.error('Missing fields:', { type, startDate, endDate });
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    console.log('Starting backup:', { type, startDate, endDate });

    // Get all orders in date range
    const ordersSnapshot = await adminDb
      .collection('orders')
      .where('createdAt', '>=', new Date(startDate))
      .where('createdAt', '<=', new Date(endDate))
      .orderBy('createdAt', 'desc')
      .get();

    console.log('Orders snapshot size:', ordersSnapshot.docs.length);
    const orders = ordersSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get all menu items for inventory backup
    const menuSnapshot = await adminDb.collection('menu').get();
    console.log('Menu snapshot size:', menuSnapshot.docs.length);
    const menuItems = menuSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get all users for user backup
    const usersSnapshot = await adminDb.collection('users').get();
    console.log('Users snapshot size:', usersSnapshot.docs.length);
    const users = usersSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    // Generate backup data
    const backupData = {
      backupType: type,
      generatedAt: new Date().toISOString(),
      dateRange: { startDate, endDate },
      summary: {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum: number, order: any) => sum + ((order as any).total || 0), 0),
        totalProfit: orders.reduce((sum: number, order: any) => sum + ((order as any).profit || 0), 0)
      },
      data: {
        orders,
        menuItems,
        users
      }
    };

    // Save backup to Firestore
    const backupRef = await adminDb.collection('backups').add({
      ...backupData,
      createdBy: 'system',
      status: 'completed'
    });

    // Generate PDF report
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text(`POS BACKUP REPORT - ${type.toUpperCase()}`, 105, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 35);
    doc.text(`Period: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`, 20, 40);
    
    // Orders Summary
    autoTable(doc, {
      startY: 60,
      head: [['Metric', 'Value']],
      body: [
        ['Total Orders', backupData.summary.totalOrders.toString()],
        ['Total Revenue', `₱${backupData.summary.totalRevenue.toLocaleString()}`],
        ['Total Profit', `₱${backupData.summary.totalProfit.toLocaleString()}`]
      ],
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }
    });

    // Save PDF
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    
    // Save PDF to storage (you might want to use Cloud Storage here)
    const pdfBase64 = doc.output('datauristring');
    
    return NextResponse.json({
      success: true,
      backupId: backupRef.id,
      backupData,
      pdfData: pdfBase64,
      message: `Backup completed successfully for ${type}`
    });

  } catch (error: any) {
    console.error('Backup error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create backup',
      details: error.stack
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'daily';
    
    let startDate: Date;
    const endDate = new Date();
    
    switch (type) {
      case 'daily':
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
      default:
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
    }

    const backupData = {
      type,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };

    return NextResponse.json({
      success: true,
      backupData
    });

  } catch (error: any) {
    console.error('Get backup data error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to get backup data'
    }, { status: 500 });
  }
}
