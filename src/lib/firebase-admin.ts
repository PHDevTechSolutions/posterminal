import * as admin from 'firebase-admin';

// Robust private key parsing for various formats
function getPrivateKey(): string | undefined {
  const rawKey = process.env.FIREBASE_PRIVATE_KEY;
  
  if (!rawKey) {
    console.error('FIREBASE_PRIVATE_KEY is not set');
    return undefined;
  }
  
  // Try multiple formats:
  // 1. Key with literal \n characters (from Netlify env var)
  // 2. Key with actual newlines
  // 3. Key wrapped in quotes
  // 4. Base64 encoded key
  
  let processedKey = rawKey;
  
  // Remove surrounding quotes if present
  processedKey = processedKey.replace(/^["']|["']$/g, '');
  
  // Replace escaped newlines with actual newlines
  processedKey = processedKey.replace(/\\n/g, '\n');
  
  // If key looks like it might be base64 encoded (no newlines and specific length), try decoding
  if (!processedKey.includes('\n') && processedKey.length > 100) {
    try {
      const decoded = Buffer.from(processedKey, 'base64').toString('utf8');
      if (decoded.includes('BEGIN PRIVATE KEY')) {
        console.log('Successfully decoded base64 private key');
        return decoded;
      }
    } catch {
      // Not base64, continue with processed key
    }
  }
  
  // Ensure proper PEM format
  if (!processedKey.includes('-----BEGIN PRIVATE KEY-----')) {
    console.error('Private key does not appear to be in valid PEM format');
    return undefined;
  }
  
  return processedKey;
}

if (!admin.apps.length) {
  const privateKey = getPrivateKey();
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  
  if (!privateKey || !projectId || !clientEmail) {
    console.error('Missing Firebase Admin credentials:', {
      hasPrivateKey: !!privateKey,
      hasProjectId: !!projectId,
      hasClientEmail: !!clientEmail,
    });
    // Don't throw error during build - let it fail at runtime when API is actually called
    console.warn('Firebase Admin will not be initialized - API routes will fail at runtime');
  } else {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log('Firebase Admin initialized successfully');
    } catch (error: any) {
      console.error('Failed to initialize Firebase Admin:', error.message);
      // Don't throw - let it fail at runtime
    }
  }
}

export const adminAuth = admin.apps.length ? admin.auth() : null as any;
export const adminDb = admin.apps.length ? admin.firestore() : null as any;
export { admin };
