"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Grid3X3, CheckCircle, Clock, Utensils, Plus, Minus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { tableManagement, Table } from "@/lib/table-management";

export default function TableManagementPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [tables, setTables] = useState<Table[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [guestCount, setGuestCount] = useState(1);
  const [reservationName, setReservationName] = useState("");

  useEffect(() => {
    if (user) {
      initializeTables();
    }
  }, [user]);

  const initializeTables = async () => {
    await tableManagement.initializeTables();
    setTables(tableManagement.getTables());
    setStats(tableManagement.getTableStats());
  };

  const handleOccupyTable = async (table: Table) => {
    if (guestCount < 1) {
      toast.error("Please enter guest count");
      return;
    }
    await tableManagement.occupyTable(table.id!, 'new-order', guestCount, profile?.displayName || 'Staff');
    toast.success(`Table ${table.number} occupied`);
    initializeTables();
  };

  const handleReserveTable = async (table: Table) => {
    if (!reservationName.trim()) {
      toast.error("Please enter reservation name");
      return;
    }
    await tableManagement.reserveTable(table.id!, reservationName, new Date(Date.now() + 3600000));
    toast.success(`Table ${table.number} reserved`);
    initializeTables();
    setReservationName("");
  };

  const handleReleaseTable = async (table: Table) => {
    await tableManagement.releaseTable(table.id!);
    toast.success(`Table ${table.number} released for cleaning`);
    initializeTables();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-gray-100 border-gray-300';
      case 'occupied': return 'bg-black text-white border-black';
      case 'reserved': return 'bg-gray-200 border-gray-400';
      case 'cleaning': return 'bg-gray-50 border-gray-200';
      default: return 'bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'occupied': return <Utensils className="h-5 w-5 text-red-600" />;
      case 'reserved': return <Clock className="h-5 w-5 text-amber-600" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal Header */}
      <header className="h-16 border-b px-6 flex items-center justify-between sticky top-0 bg-white z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="font-semibold">Tables</span>
        </div>
        <div className="flex gap-3 text-sm">
          <span className="text-gray-400">Available: {stats?.available || 0}</span>
          <span className="text-gray-400">Occupied: {stats?.occupied || 0}</span>
          <span className="text-gray-400">Reserved: {stats?.reserved || 0}</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-none bg-gray-50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-light">{stats?.total || 0}</p>
              <p className="text-sm text-gray-400">Total</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-none bg-gray-50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-light">{stats?.occupancyRate?.toFixed(0) || 0}%</p>
              <p className="text-sm text-gray-400">Occupancy</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-none bg-gray-50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-light">{stats?.available || 0}</p>
              <p className="text-sm text-gray-400">Available</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-none bg-gray-50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-light">{stats?.cleaning || 0}</p>
              <p className="text-sm text-gray-400">Cleaning</p>
            </CardContent>
          </Card>
        </div>

        {/* Tables Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {tables.map((table) => (
            <Card 
              key={table.id} 
              className={`cursor-pointer transition-all hover:shadow-md border-2 ${getStatusColor(table.status)}`}
              onClick={() => setSelectedTable(table)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold">{table.name}</h3>
                  {getStatusIcon(table.status)}
                </div>
                <div className="space-y-1 text-sm text-gray-500">
                  <p className="capitalize">{table.section}</p>
                  <p>{table.capacity} guests</p>
                  {table.currentGuests && <p>{table.currentGuests} seated</p>}
                  {table.reservationName && <p className="font-medium text-black">R: {table.reservationName}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table Actions Modal */}
        {selectedTable && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between font-normal">
                  <span>Table {selectedTable.name}</span>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedTable(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Section</p>
                    <p className="font-medium capitalize">{selectedTable.section}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Capacity</p>
                    <p className="font-medium">{selectedTable.capacity} guests</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Status</p>
                    <p className="font-medium capitalize">{selectedTable.status}</p>
                  </div>
                </div>

                {selectedTable.status === 'available' && (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-gray-400">Guests</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input 
                          type="number" 
                          value={guestCount}
                          onChange={(e) => setGuestCount(Number(e.target.value))}
                          className="text-center w-20"
                        />
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => setGuestCount(Math.min(selectedTable.capacity, guestCount + 1))}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <Button 
                      className="w-full bg-black hover:bg-gray-800"
                      onClick={() => handleOccupyTable(selectedTable)}
                    >
                      <Utensils className="h-4 w-4 mr-2" />
                      Occupy Table
                    </Button>

                    <div className="pt-4 border-t">
                      <Label className="text-gray-400">Reservation</Label>
                      <Input
                        value={reservationName}
                        onChange={(e) => setReservationName(e.target.value)}
                        placeholder="Name..."
                        className="mb-2 mt-1"
                      />
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => handleReserveTable(selectedTable)}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Reserve
                      </Button>
                    </div>
                  </div>
                )}

                {selectedTable.status === 'occupied' && (
                  <Button 
                    className="w-full bg-black hover:bg-gray-800"
                    onClick={() => handleReleaseTable(selectedTable)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Release Table
                  </Button>
                )}

                {selectedTable.status === 'reserved' && (
                  <>
                    <p className="text-sm text-gray-400">
                      Reserved: {selectedTable.reservationName}
                    </p>
                    <Button 
                      className="w-full bg-black hover:bg-gray-800"
                      onClick={() => handleOccupyTable(selectedTable)}
                    >
                      <Utensils className="h-4 w-4 mr-2" />
                      Seat Guests
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
