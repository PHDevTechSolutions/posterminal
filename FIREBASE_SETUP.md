# Firebase Push Notifications & Backup Setup Guide

## 🚀 **Firebase Cloud Messaging (FCM) Setup**

### **Step 1: Firebase Console Configuration**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Project Settings** (⚙️ icon)
4. Click on **Cloud Messaging** tab
5. Under **Web configuration**, click **Generate key pair**

### **Step 2: Add Environment Variables**
Add these to your `.env.local` file:

```bash
# Firebase Configuration (update with your actual values)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (for server-side operations)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Private_Key_Here\n-----END PRIVATE KEY-----\n"
FIREBASE_SERVER_KEY=your_server_key_from_fcm
```

### **Step 3: Service Worker Setup**
Create `public/firebase-messaging-sw.js`:

```javascript
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "your_api_key",
  authDomain: "your_project.firebaseapp.com",
  projectId: "your_project_id",
  storageBucket: "your_project.appspot.com",
  messagingSenderId: "your_sender_id",
  appId: "your_app_id"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: payload.data?.type || 'default'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
```

### **Step 4: Update index.html**
Add to `app/layout.tsx` or create `public/index.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>X-POS Terminal</title>
  <link rel="manifest" href="/manifest.json">
</head>
<body>
  <div id="root"></div>
  <script>
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then((registration) => {
          console.log('Service Worker registered');
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  </script>
</body>
</html>
```

### **Step 5: Create Web App Manifest**
Create `public/manifest.json`:

```json
{
  "name": "X-POS Terminal",
  "short_name": "X-POS",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#4f46e5",
  "icons": [
    {
      "src": "/favicon.ico",
      "sizes": "192x192",
      "type": "image/png"
    }
  ],
  "gcm_sender_id": "your_sender_id"
}
```

## 📦 **Automatic Backup System**

### **Step 1: Enable Firestore Backups**
1. In Firebase Console → Firestore Database
2. Go to **Backups** tab
3. Click **Configure automated backups**
4. Set backup schedule (daily recommended)
5. Choose retention period (30-90 days)

### **Step 2: Manual Backup Features**
Your POS now includes:
- **Daily Backups**: Today's transactions and inventory
- **Weekly Backups**: Last 7 days of data
- **Monthly Backups**: Last 30 days of data

### **Step 3: Backup Data Included**
- All orders with full details
- Current inventory and stock levels
- User accounts and permissions
- Sales analytics and reports

## 🔔 **Push Notification Types**

### **Real-time Notifications**
- **New Orders**: When customers place orders
- **Low Stock Alerts**: When items run low
- **Order Completed**: When orders are finished
- **System Alerts**: Important system updates

### **Notification Triggers**
```typescript
// Low Stock Example
await notificationService.sendCustomNotification({
  title: "⚠️ Low Stock Alert",
  body: "Rice is running low (5 units left)",
  data: { type: "low_stock", productId: "rice_1kg" }
}, "admin_user_id");

// New Order Example
await notificationService.sendCustomNotification({
  title: "🛒 New Order Received",
  body: "Order #ABC123 is ready for preparation",
  data: { type: "new_order", orderId: "ABC123" }
}, "kitchen_user_id");
```

## 🛠️ **Troubleshooting**

### **Common Issues**
1. **Notifications not working**
   - Check browser permissions
   - Verify FCM configuration
   - Ensure service worker is registered

2. **Backup failing**
   - Check Firebase Admin SDK setup
   - Verify environment variables
   - Check Firestore permissions

3. **User creation issues**
   - Verify Firebase Auth settings
   - Check email/password requirements
   - Ensure proper API route permissions

### **Testing Notifications**
```javascript
// Test in browser console
notificationService.sendCustomNotification({
  title: "Test Notification",
  body: "This is a test message",
  data: { type: "test" }
}, "your_user_id");
```

## 📱 **Mobile App Integration**
For mobile apps, use:
- **React Native Firebase** for iOS/Android
- **Capacitor Firebase** for hybrid apps
- Same notification payload structure

## 🔐 **Security Notes**
- Keep private keys secure
- Use HTTPS for all API calls
- Validate notification permissions
- Monitor backup access logs

---

**✅ After setup:**
1. Restart your development server
2. Test notification permissions in browser
3. Create a test backup
4. Verify user creation works

Your POS will now have full push notifications and automatic backup capabilities! 🎉
