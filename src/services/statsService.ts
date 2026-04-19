import { db } from '../lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

export interface DailyStat {
  name: string;
  tickets: number;
  alerts: number;
}

export async function computeWeeklyStats(userId: string): Promise<DailyStat[]> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Fetch tickets and alerts from the last 7 days
  const [ticketsSnap, alertsSnap] = await Promise.all([
    getDocs(query(
      collection(db, 'tickets'),
      where('userId', '==', userId),
      where('createdAt', '>=', Timestamp.fromDate(sevenDaysAgo))
    )),
    getDocs(query(
      collection(db, 'alerts'),
      where('userId', '==', userId),
      where('createdAt', '>=', Timestamp.fromDate(sevenDaysAgo))
    )),
  ]);

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const buckets: Record<string, { tickets: number; alerts: number }> = {};

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    buckets[key] = { tickets: 0, alerts: 0 };
  }

  ticketsSnap.forEach(doc => {
    const data = doc.data();
    const createdAt = data.createdAt?.toDate?.() || (data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null);
    if (!createdAt) return;
    const key = createdAt.toISOString().slice(0, 10);
    if (buckets[key]) buckets[key].tickets++;
  });

  alertsSnap.forEach(doc => {
    const data = doc.data();
    const createdAt = data.createdAt?.toDate?.() || (data.createdAt instanceof Timestamp ? data.createdAt.toDate() : (data.timestamp ? new Date(data.timestamp) : null));
    if (!createdAt) return;
    const key = createdAt.toISOString().slice(0, 10);
    if (buckets[key]) buckets[key].alerts++;
  });

  return Object.entries(buckets).map(([key, stats]) => {
    const date = new Date(key);
    return {
      name: dayLabels[date.getDay()],
      tickets: stats.tickets,
      alerts: stats.alerts,
    };
  });
}

export interface MonthlyReport {
  name: string;
  tickets: number;
  devices: number;
}

export async function computeMonthlyReport(userId: string): Promise<MonthlyReport[]> {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [ticketsSnap, devicesSnap] = await Promise.all([
    getDocs(query(
      collection(db, 'tickets'),
      where('userId', '==', userId),
      where('createdAt', '>=', Timestamp.fromDate(sixMonthsAgo))
    )),
    getDocs(query(
      collection(db, 'devices'),
      where('userId', '==', userId)
    )),
  ]);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const months: Record<string, { tickets: number; devices: number }> = {};

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = monthNames[d.getMonth()];
    months[key] = { tickets: 0, devices: 0 };
  }

  ticketsSnap.forEach(doc => {
    const data = doc.data();
    const createdAt = data.createdAt?.toDate?.() || (data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null);
    if (!createdAt) return;
    const key = monthNames[createdAt.getMonth()];
    if (months[key]) months[key].tickets++;
  });

  // For devices, compute cumulative count per month based on createdAt
  const devicesByMonth: Array<{ month: number; count: number }> = [];
  devicesSnap.forEach(doc => {
    const data = doc.data();
    const createdAt = data.createdAt?.toDate?.() || (data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null);
    if (!createdAt) return;
    const monthsAgo = Math.floor((now.getTime() - createdAt.getTime()) / (30 * 24 * 60 * 60 * 1000));
    if (monthsAgo < 6) {
      devicesByMonth.push({ month: monthsAgo, count: 1 });
    }
  });

  // Cumulative device count per month
  let totalDevices = devicesSnap.size;
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = monthNames[d.getMonth()];
    if (months[key]) {
      months[key].devices = totalDevices;
    }
    totalDevices -= devicesByMonth.filter(x => x.month === i).length;
  }

  return Object.entries(months).map(([name, stats]) => ({
    name,
    tickets: stats.tickets,
    devices: stats.devices,
  }));
}
