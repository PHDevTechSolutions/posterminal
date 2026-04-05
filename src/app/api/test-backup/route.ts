// Test backup system with proper error handling
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    console.log('=== BACKUP TEST START ===');
    
    // Test basic admin connection
    const testDoc = await adminDb.collection('test').doc('backup-test').get();
    console.log('✅ Admin DB connection: OK');
    
    // Test backup data creation
    const backupData = {
      testBackup: true,
      timestamp: new Date().toISOString(),
      message: 'Backup system test successful'
    };
    
    await adminDb.collection('test-backups').add(backupData);
    console.log('✅ Backup data creation: OK');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Backup test successful',
      data: backupData 
    });
    
  } catch (error: any) {
    console.error('❌ Backup test error:', error);
    console.error('Error details:', error.message);
    console.error('Error code:', error.code);
    
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      code: error.code,
      stack: error.stack 
    }, { status: 500 });
  }
}
