// Employee Time Tracking - Clock in/out system and payroll calculation
import { db } from "./firebase";
import { collection, addDoc, getDocs, query, where, doc, updateDoc, Timestamp, orderBy, onSnapshot } from "firebase/firestore";
import { toast } from "sonner";

export interface TimeRecord {
  id?: string;
  userId: string;
  userName: string;
  date: string; // YYYY-MM-DD format
  clockIn?: Timestamp;
  clockOut?: Timestamp;
  breakStart?: Timestamp;
  breakEnd?: Timestamp;
  totalBreakMinutes: number;
  totalWorkMinutes: number;
  status: 'working' | 'on_break' | 'clocked_out' | 'absent';
  notes?: string;
  approvedBy?: string;
  isApproved: boolean;
}

export interface Shift {
  id?: string;
  userId: string;
  userName: string;
  date: string;
  scheduledStart: string; // HH:MM format
  scheduledEnd: string;
  actualStart?: Timestamp;
  actualEnd?: Timestamp;
  shiftType: 'morning' | 'afternoon' | 'night' | 'custom';
  department: string;
  isCompleted: boolean;
}

export interface PayrollPeriod {
  id?: string;
  startDate: string;
  endDate: string;
  userId: string;
  userName: string;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  hourlyRate: number;
  regularPay: number;
  overtimePay: number;
  grossPay: number;
  deductions: number;
  netPay: number;
  status: 'draft' | 'approved' | 'paid';
  paidAt?: Timestamp;
}

class EmployeeTimeTracking {
  private currentUserTimeRecord: TimeRecord | null = null;
  private listeners: ((record: TimeRecord | null) => void)[] = [];

  async clockIn(userId: string, userName: string, notes?: string): Promise<TimeRecord> {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      const today = new Date().toISOString().split('T')[0];
      
      // Check if already clocked in
      const existingRecord = await this.getTodayRecord(userId);
      if (existingRecord && existingRecord.clockIn && !existingRecord.clockOut) {
        throw new Error('Already clocked in today');
      }

      const timeRecord: Omit<TimeRecord, 'id'> = {
        userId,
        userName: userName || 'Unknown User',
        date: today,
        clockIn: Timestamp.now(),
        totalBreakMinutes: 0,
        totalWorkMinutes: 0,
        status: 'working',
        notes: notes || '',
        isApproved: false
      };

      const docRef = await addDoc(collection(db, "time_records"), timeRecord);
      
      this.currentUserTimeRecord = { id: docRef.id, ...timeRecord };
      this.notifyListeners();
      
      toast.success(`Clocked in at ${new Date().toLocaleTimeString()}`, {
        icon: '👋'
      });

      return this.currentUserTimeRecord;
    } catch (error: any) {
      console.error('Clock in error:', error);
      if (error.message?.includes('permission')) {
        throw new Error('Permission denied. Please check your login status.');
      }
      throw error;
    }
  }

  async clockOut(userId: string, notes?: string): Promise<TimeRecord> {
    const record = await this.getTodayRecord(userId);
    if (!record || !record.clockIn) {
      throw new Error('Not clocked in');
    }

    if (record.clockOut) {
      throw new Error('Already clocked out');
    }

    const clockOutTime = Timestamp.now();
    const clockInTime = record.clockIn;
    
    // Calculate total work time
    const totalMinutes = Math.floor(
      (clockOutTime.toMillis() - clockInTime.toMillis()) / 60000
    );
    const workMinutes = totalMinutes - record.totalBreakMinutes;

    const updates: Partial<TimeRecord> = {
      clockOut: clockOutTime,
      totalWorkMinutes: workMinutes,
      status: 'clocked_out',
      notes: notes ? `${record.notes || ''} | Out: ${notes}` : record.notes
    };

    await updateDoc(doc(db, "time_records", record.id!), updates);

    this.currentUserTimeRecord = null;
    this.notifyListeners();

    const hours = Math.floor(workMinutes / 60);
    const mins = workMinutes % 60;

    toast.success(`Clocked out. Total: ${hours}h ${mins}m`, {
      icon: '👋'
    });

    return { ...record, ...updates };
  }

  async startBreak(userId: string): Promise<TimeRecord> {
    const record = await this.getTodayRecord(userId);
    if (!record || record.status !== 'working') {
      throw new Error('Must be working to start break');
    }

    await updateDoc(doc(db, "time_records", record.id!), {
      breakStart: Timestamp.now(),
      status: 'on_break'
    });

    toast.info('Break started', { icon: '☕' });
    return { ...record, breakStart: Timestamp.now(), status: 'on_break' };
  }

  async endBreak(userId: string): Promise<TimeRecord> {
    const record = await this.getTodayRecord(userId);
    if (!record || record.status !== 'on_break') {
      throw new Error('Not on break');
    }

    const breakEnd = Timestamp.now();
    const breakMinutes = Math.floor(
      (breakEnd.toMillis() - record.breakStart!.toMillis()) / 60000
    );

    await updateDoc(doc(db, "time_records", record.id!), {
      breakEnd,
      totalBreakMinutes: record.totalBreakMinutes + breakMinutes,
      status: 'working'
    });

    toast.info(`Break ended (${breakMinutes} minutes)`, { icon: '☕' });
    return { ...record, breakEnd, status: 'working' };
  }

  private async getTodayRecord(userId: string): Promise<TimeRecord | null> {
    const today = new Date().toISOString().split('T')[0];
    
    const q = query(
      collection(db, "time_records"),
      where("userId", "==", userId),
      where("date", "==", today)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as TimeRecord;
  }

  async getUserStatus(userId: string): Promise<TimeRecord | null> {
    return this.getTodayRecord(userId);
  }

  async getTimeRecords(userId: string, startDate: string, endDate: string): Promise<TimeRecord[]> {
    const q = query(
      collection(db, "time_records"),
      where("userId", "==", userId),
      where("date", ">=", startDate),
      where("date", "<=", endDate),
      orderBy("date", "desc")
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TimeRecord));
  }

  // Shift scheduling
  async createShift(shift: Omit<Shift, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, "shifts"), shift);
    toast.success('Shift scheduled successfully');
    return docRef.id;
  }

  async getUserShifts(userId: string, startDate: string, endDate: string): Promise<Shift[]> {
    const q = query(
      collection(db, "shifts"),
      where("userId", "==", userId),
      where("date", ">=", startDate),
      where("date", "<=", endDate)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shift));
  }

  // Payroll calculation
  async calculatePayroll(
    userId: string, 
    userName: string,
    startDate: string, 
    endDate: string,
    hourlyRate: number
  ): Promise<PayrollPeriod> {
    const records = await this.getTimeRecords(userId, startDate, endDate);
    
    const totalMinutes = records.reduce((sum, r) => sum + r.totalWorkMinutes, 0);
    const totalHours = totalMinutes / 60;
    
    // Standard: 8 hours regular, rest is overtime
    const regularHours = Math.min(totalHours, 8 * records.length);
    const overtimeHours = Math.max(0, totalHours - regularHours);
    
    const regularPay = regularHours * hourlyRate;
    const overtimePay = overtimeHours * hourlyRate * 1.5; // 1.5x overtime
    const grossPay = regularPay + overtimePay;
    
    // Deductions (simplified)
    const deductions = grossPay * 0.1; // 10% deductions
    const netPay = grossPay - deductions;

    const payroll: PayrollPeriod = {
      startDate,
      endDate,
      userId,
      userName,
      totalHours,
      regularHours,
      overtimeHours,
      hourlyRate,
      regularPay,
      overtimePay,
      grossPay,
      deductions,
      netPay,
      status: 'draft'
    };

    return payroll;
  }

  // Admin functions
  async approveTimeRecord(recordId: string, approvedBy: string) {
    await updateDoc(doc(db, "time_records", recordId), {
      isApproved: true,
      approvedBy
    });
    toast.success('Time record approved');
  }

  async approvePayroll(payrollId: string) {
    await updateDoc(doc(db, "payroll", payrollId), {
      status: 'approved'
    });
    toast.success('Payroll approved');
  }

  async markPayrollPaid(payrollId: string) {
    await updateDoc(doc(db, "payroll", payrollId), {
      status: 'paid',
      paidAt: Timestamp.now()
    });
    toast.success('Payroll marked as paid');
  }

  // Real-time listeners
  onTimeRecordChange(userId: string, callback: (record: TimeRecord | null) => void) {
    const today = new Date().toISOString().split('T')[0];
    
    const q = query(
      collection(db, "time_records"),
      where("userId", "==", userId),
      where("date", "==", today)
    );

    return onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        callback(null);
      } else {
        callback({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as TimeRecord);
      }
    });
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentUserTimeRecord));
  }

  onStatusChange(listener: (record: TimeRecord | null) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Get department summary
  async getDepartmentSummary(date: string): Promise<{
    totalStaff: number;
    clockedIn: number;
    onBreak: number;
    clockedOut: number;
    totalHours: number;
  }> {
    const q = query(
      collection(db, "time_records"),
      where("date", "==", date)
    );
    
    const snapshot = await getDocs(q);
    const records = snapshot.docs.map(doc => doc.data() as TimeRecord);

    return {
      totalStaff: records.length,
      clockedIn: records.filter(r => r.status === 'working').length,
      onBreak: records.filter(r => r.status === 'on_break').length,
      clockedOut: records.filter(r => r.status === 'clocked_out').length,
      totalHours: records.reduce((sum, r) => sum + r.totalWorkMinutes, 0) / 60
    };
  }
}

export const employeeTimeTracking = new EmployeeTimeTracking();
