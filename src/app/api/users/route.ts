import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

export async function POST(request: Request) {
  try {
    const { email, password, displayName, role } = await request.json();

    if (!email || !password || !displayName || !role) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
    });

    // 2. Create profile in Firestore
    const userProfile = {
      uid: userRecord.uid,
      email,
      displayName,
      role,
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await adminDb.collection('users').doc(userRecord.uid).set(userProfile);

    return NextResponse.json({ success: true, uid: userRecord.uid });
  } catch (error: any) {
    console.error('API Error (Create User):', error);
    let errorMessage = error.message || 'Failed to create user';
    
    // Handle specific Firebase Auth errors
    if (error.code === 'auth/email-already-exists') {
      errorMessage = 'Email address is already in use by another account.';
    } else if (error.code === 'auth/invalid-password') {
      errorMessage = 'The password must be at least 6 characters long.';
    }

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
