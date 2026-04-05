import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { notification, targetUserId, type } = await request.json();

    if (!notification || !targetUserId) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Get user's notification tokens
    const userDoc = await adminDb.collection('users').doc(targetUserId).get();
    const userData = userDoc.data();
    
    if (!userData || !userData.notificationTokens) {
      return NextResponse.json({ success: false, error: 'User has no notification tokens' }, { status: 404 });
    }

    // Send notification to all tokens for the user
    const tokens = userData.notificationTokens.map((t: any) => t.token);
    
    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
        icon: notification.icon || '/favicon.ico'
      },
      data: {
        type: type || 'custom',
        ...notification.data
      },
      tokens: tokens
    };

    // Send via Firebase Cloud Messaging
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${process.env.FIREBASE_SERVER_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    });

    const result = await response.json();
    
    if (result.success === 1) {
      return NextResponse.json({ 
        success: true, 
        message: 'Notification sent successfully',
        successCount: result.success
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.results?.[0]?.error || 'Failed to send notification' 
      });
    }

  } catch (error: any) {
    console.error('Send notification error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to send notification' 
    }, { status: 500 });
  }
}
