// Test Firebase Admin connection
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    // Test basic Firestore connection
    const testDoc = await adminDb.collection('test').doc('connection').get();
    
    return Response.json({
      success: true,
      message: 'Firebase Admin connection successful',
      timestamp: new Date().toISOString(),
      projectId: process.env.FIREBASE_PROJECT_ID
    });
  } catch (error: any) {
    console.error('Firebase Admin connection test failed:', error);
    return Response.json({
      success: false,
      error: error.message,
      message: 'Firebase Admin connection failed'
    }, { status: 500 });
  }
}
