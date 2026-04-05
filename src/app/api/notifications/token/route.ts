import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

export async function POST(request: Request) {
  try {
    console.log('Received notification token request');
    
    const body = await request.text();
    console.log('Request body:', body);
    
    let parsedBody;
    try {
      parsedBody = JSON.parse(body);
      console.log('Parsed body:', parsedBody);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw body:', body);
      return NextResponse.json({ success: false, error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const { userId, token, platform } = parsedBody;

    if (!userId || !token) {
      console.error('Missing fields:', { userId, token, platform });
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    console.log('Saving token for user:', userId);

    // Save notification token to user profile
    await adminDb.collection('users').doc(userId).update({
      notificationTokens: admin.firestore.FieldValue.arrayUnion({
        token,
        platform: platform || 'web',
        createdAt: new Date(),
        lastUsed: new Date()
      })
    });

    console.log('Token saved successfully');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Save notification token error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ success: false, error: error.message || 'Failed to save notification token' }, { status: 500 });
  }
}
