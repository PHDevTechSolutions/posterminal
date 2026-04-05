import { useState } from "react";
import { 
  Download, 
  Calendar, 
  Clock, 
  Database,
  Settings,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface BackupData {
  type: string;
  startDate: string;
  endDate: string;
}

export default function BackupManager() {
  const [loading, setLoading] = useState(false);
  const [lastBackup, setLastBackup] = useState<any>(null);

  const createBackup = async (type: 'daily' | 'weekly' | 'monthly') => {
    try {
      setLoading(true);
      
      // Get date range for backup
      const endDate = new Date();
      let startDate = new Date();
      
      switch (type) {
        case 'daily':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'weekly':
          startDate.setDate(startDate.getDate() - 7);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'monthly':
          startDate.setMonth(startDate.getMonth() - 1);
          startDate.setDate(1);
          startDate.setHours(0, 0, 0, 0);
          break;
      }

      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Download PDF
        if (result.pdfData) {
          const link = document.createElement('a');
          link.href = result.pdfData;
          link.download = `backup-${type}-${new Date().toISOString().split('T')[0]}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        
        setLastBackup(result.backupData);
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} backup created successfully`);
      } else {
        toast.error(result.error || 'Failed to create backup');
      }
    } catch (error: any) {
      console.error('Backup error:', error);
      toast.error(error.message || 'Failed to create backup');
    } finally {
      setLoading(false);
    }
  };

  const scheduleBackup = async (type: 'daily' | 'weekly' | 'monthly') => {
    // This would integrate with a cron job or scheduled task
    toast.info(`${type} backup scheduled. Feature coming soon!`);
  };

  return (
    <Card className="border-none shadow-sm rounded-3xl bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-black tracking-tighter flex items-center gap-2">
          <Database className="h-5 w-5 text-indigo-600" />
          Backup Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="h-20 flex-col gap-2 border-2 border-dashed border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
            onClick={() => createBackup('daily')}
            disabled={loading}
          >
            <Calendar className="h-6 w-6 text-gray-400" />
            <span className="font-bold text-gray-600">Daily</span>
            <span className="text-xs text-gray-400">Today's data</span>
          </Button>

          <Button
            variant="outline"
            className="h-20 flex-col gap-2 border-2 border-dashed border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
            onClick={() => createBackup('weekly')}
            disabled={loading}
          >
            <Clock className="h-6 w-6 text-gray-400" />
            <span className="font-bold text-gray-600">Weekly</span>
            <span className="text-xs text-gray-400">Last 7 days</span>
          </Button>

          <Button
            variant="outline"
            className="h-20 flex-col gap-2 border-2 border-dashed border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
            onClick={() => createBackup('monthly')}
            disabled={loading}
          >
            <Download className="h-6 w-6 text-gray-400" />
            <span className="font-bold text-gray-600">Monthly</span>
            <span className="text-xs text-gray-400">Last 30 days</span>
          </Button>
        </div>

        {lastBackup && (
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-black text-sm">Last Backup</h4>
                <p className="text-xs text-gray-500">
                  {new Date(lastBackup.generatedAt).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  Type: <Badge variant="secondary" className="ml-2">{lastBackup.backupType}</Badge>
                </p>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700">
                ✓ Completed
              </Badge>
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
          <Settings className="h-5 w-5 text-gray-400" />
          <div className="flex-1">
            <h4 className="font-black text-sm">Automatic Backups</h4>
            <p className="text-xs text-gray-500">
              Configure scheduled backups for data protection
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => scheduleBackup('daily')}
            className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
          >
            Configure Schedule
          </Button>
        </div>

        {loading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <span className="font-black">Creating backup...</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
