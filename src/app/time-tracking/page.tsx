"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Clock, Play, Pause, Coffee, LogOut, Calendar, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { employeeTimeTracking, TimeRecord } from "@/lib/employee-time-tracking";

export default function TimeTrackingPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [currentRecord, setCurrentRecord] = useState<TimeRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadCurrentStatus();
    }
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [user]);

  const loadCurrentStatus = async () => {
    try {
      setLoading(true);
      const status = await employeeTimeTracking.getUserStatus(user!.uid);
      setCurrentRecord(status);
    } catch (error: any) {
      console.error("Error loading status:", error);
      toast.error(error.message || "Failed to load status");
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    try {
      if (!user?.uid) {
        toast.error("Please login first");
        return;
      }
      await employeeTimeTracking.clockIn(user.uid, profile?.displayName || user.email || "User");
      await loadCurrentStatus();
    } catch (error: any) {
      console.error("Clock in error:", error);
      toast.error(error.message || "Failed to clock in");
    }
  };

  const handleClockOut = async () => {
    try {
      if (!user?.uid) return;
      await employeeTimeTracking.clockOut(user.uid);
      await loadCurrentStatus();
    } catch (error: any) {
      console.error("Clock out error:", error);
      toast.error(error.message || "Failed to clock out");
    }
  };

  const handleStartBreak = async () => {
    try {
      if (!user?.uid) return;
      await employeeTimeTracking.startBreak(user.uid);
      await loadCurrentStatus();
    } catch (error: any) {
      console.error("Start break error:", error);
      toast.error(error.message || "Failed to start break");
    }
  };

  const handleEndBreak = async () => {
    try {
      if (!user?.uid) return;
      await employeeTimeTracking.endBreak(user.uid);
      await loadCurrentStatus();
    } catch (error: any) {
      console.error("End break error:", error);
      toast.error(error.message || "Failed to end break");
    }
  };

  const getElapsedTime = () => {
    if (!currentRecord?.clockIn) return "00:00:00";
    const start = currentRecord.clockIn.toDate().getTime();
    const now = Date.now();
    const diff = now - start;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show login message if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Please login to access time tracking</p>
          <Button onClick={() => router.push("/login")}>Go to Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal Header */}
      <header className="h-16 border-b px-6 flex items-center justify-between sticky top-0 bg-white z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="font-semibold">Time Tracking</span>
        </div>
        <div className="text-right">
          <p className="text-xl font-mono font-light">
            {currentTime.toLocaleTimeString()}
          </p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Status Card */}
        <Card className="border-0 shadow-none bg-gray-50 mb-8">
          <CardContent className="p-8">
            <div className="text-center">
              <span className={`inline-block px-3 py-1 rounded-full text-xs mb-6 ${
                currentRecord?.status === 'working' ? 'bg-black text-white' :
                currentRecord?.status === 'on_break' ? 'bg-gray-400 text-white' :
                'bg-gray-200 text-gray-600'
              }`}>
                {currentRecord?.status === 'working' ? 'Working' :
                 currentRecord?.status === 'on_break' ? 'On Break' :
                 currentRecord?.status === 'clocked_out' ? 'Clocked Out' :
                 'Not Clocked In'}
              </span>
              
              {currentRecord?.clockIn && (
                <div className="mb-8">
                  <p className="text-sm text-gray-400 mb-2">Elapsed Time</p>
                  <p className="text-6xl font-mono font-light text-black">
                    {getElapsedTime()}
                  </p>
                  {currentRecord.clockIn && (
                    <p className="text-sm text-gray-400 mt-4">
                      Started {currentRecord.clockIn.toDate().toLocaleTimeString()}
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-center gap-3">
                {!currentRecord?.clockIn ? (
                  <Button size="lg" onClick={handleClockIn} className="bg-black hover:bg-gray-800 h-14 px-8">
                    <Play className="h-5 w-5 mr-2" />
                    Clock In
                  </Button>
                ) : currentRecord.status === 'on_break' ? (
                  <Button size="lg" onClick={handleEndBreak} className="bg-black hover:bg-gray-800 h-14 px-8">
                    <Coffee className="h-5 w-5 mr-2" />
                    End Break
                  </Button>
                ) : (
                  <>
                    <Button size="lg" onClick={handleStartBreak} variant="outline" className="h-14 px-8">
                      <Coffee className="h-5 w-5 mr-2" />
                      Break
                    </Button>
                    <Button size="lg" onClick={handleClockOut} variant="outline" className="h-14 px-8">
                      <LogOut className="h-5 w-5 mr-2" />
                      Clock Out
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="border-0 shadow-none bg-gray-50">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-light">
                {Math.floor((currentRecord?.totalWorkMinutes || 0) / 60)}h
              </p>
              <p className="text-sm text-gray-400 mt-1">Worked</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-none bg-gray-50">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-light">
                {Math.floor((currentRecord?.totalBreakMinutes || 0) / 60)}h
              </p>
              <p className="text-sm text-gray-400 mt-1">Break</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-none bg-gray-50">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-light">{new Date().toLocaleDateString(undefined, {month:'short', day:'numeric'})}</p>
              <p className="text-sm text-gray-400 mt-1">Today</p>
            </CardContent>
          </Card>
        </div>

        {/* History */}
        <Card className="border-0 shadow-none bg-gray-50">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Recent Activity</h3>
            {currentRecord ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <Play className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">Clocked In</span>
                  </div>
                  <span className="text-sm text-gray-400">
                    {currentRecord.clockIn?.toDate().toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-400 py-4">No activity today</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
