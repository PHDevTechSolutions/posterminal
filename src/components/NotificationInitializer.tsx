"use client";

import { notificationService } from "@/lib/notifications";
import { useEffect } from "react";

export function NotificationInitializer() {
  useEffect(() => {
    // Initialize notifications when component mounts
    if (typeof window !== 'undefined') {
      notificationService.initializeNotifications().catch(console.error);
    }
  }, []);

  return null; // This component doesn't render anything
}
