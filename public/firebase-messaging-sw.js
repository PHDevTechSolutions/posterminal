importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js');

// Replace these with your actual Firebase config values
firebase.initializeApp({
  apiKey: "AIzaSyDOeB22rECAiItmRMu7HrJnkz4MP-TF72w",
  authDomain: "posterminal-5bb4c.firebaseapp.com",
  projectId: "posterminal-5bb4c",
  storageBucket: "posterminal-5bb4c.appspot.com",
  messagingSenderId: "1038123456789",
  appId: "1:1038123456789:web:abcdef1234567890"
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