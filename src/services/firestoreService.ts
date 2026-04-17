import { 
  collection, 
  onSnapshot, 
  query, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  orderBy,
  where,
  getDocs,
  limit,
  getCountFromServer
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { Ticket, Device, Alert, Command, DeviceLog } from '../types';

export const firestoreService = {
  // Tickets
  subscribeToTickets: (userId: string, callback: (tickets: Ticket[]) => void) => {
    const q = query(
      collection(db, 'tickets'), 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const tickets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Ticket[];
      callback(tickets);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'tickets'));
  },

  addTicket: async (userId: string, ticket: Omit<Ticket, 'id' | 'createdAt' | 'userId'>) => {
    try {
      await addDoc(collection(db, 'tickets'), {
        ...ticket,
        userId,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'tickets');
    }
  },

  updateTicket: async (ticketId: string, data: Partial<Ticket>) => {
    try {
      await updateDoc(doc(db, 'tickets', ticketId), {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'tickets');
      throw error;
    }
  },

  deleteTicket: async (ticketId: string) => {
    try {
      await deleteDoc(doc(db, 'tickets', ticketId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'tickets');
      throw error;
    }
  },

  // Devices
  subscribeToDevices: (userId: string, callback: (devices: Device[]) => void) => {
    const q = query(
      collection(db, 'devices'), 
      where('userId', '==', userId),
      orderBy('name', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
      const devices = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Device[];
      callback(devices);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'devices'));
  },

  subscribeToDeviceById: (userId: string, deviceId: string, callback: (device: Device | null) => void) => {
    return onSnapshot(doc(db, 'devices', deviceId), (snapshot) => {
      if (snapshot.exists() && snapshot.data().userId === userId) {
        callback({ id: snapshot.id, ...snapshot.data() } as Device);
      } else {
        callback(null);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'devices'));
  },

  // Commands
  subscribeToCommands: (userId: string, callback: (commands: Command[]) => void) => {
    const q = query(
      collection(db, 'commands'), 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    return onSnapshot(q, (snapshot) => {
      const commands = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Command[];
      callback(commands);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'commands'));
  },

  subscribeToCommandsByDevice: (userId: string, deviceId: string, callback: (commands: Command[]) => void) => {
    const q = query(
      collection(db, 'commands'), 
      where('deviceId', '==', deviceId),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    return onSnapshot(q, (snapshot) => {
      const commands = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Command[];
      callback(commands);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'commands'));
  },

  // Logs
  subscribeToDeviceLogs: (userId: string, callback: (logs: DeviceLog[]) => void, logLimit: number = 100) => {
    const q = query(
      collection(db, 'device_logs'), 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(logLimit)
    );
    return onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DeviceLog[];
      callback(logs);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'device_logs'));
  },

  subscribeToDeviceLogsByDevice: (userId: string, deviceId: string, callback: (logs: DeviceLog[]) => void, logLimit: number = 50) => {
    const q = query(
      collection(db, 'device_logs'), 
      where('deviceId', '==', deviceId),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(logLimit)
    );
    return onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DeviceLog[];
      callback(logs);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'device_logs'));
  },

  // Alerts
  subscribeToAlerts: (userId: string, callback: (alerts: Alert[]) => void) => {
    const q = query(
      collection(db, 'alerts'), 
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'), 
      limit(50)
    );
    return onSnapshot(q, (snapshot) => {
      const alerts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Alert[];
      callback(alerts);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'alerts'));
  },

  addAlert: async (userId: string, alert: Omit<Alert, 'id' | 'timestamp' | 'userId'>) => {
    try {
      await addDoc(collection(db, 'alerts'), {
        ...alert,
        userId,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'alerts');
    }
  },

  // Delete Alert
  deleteAlert: async (alertId: string) => {
    try {
      await deleteDoc(doc(db, 'alerts', alertId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'alerts');
      throw error;
    }
  },

  // Delete multiple alerts
  deleteAllAlerts: async (userId: string) => {
    try {
      const q = query(collection(db, 'alerts'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      const deletions = snapshot.docs.map(d => deleteDoc(doc(db, 'alerts', d.id)));
      await Promise.all(deletions);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'alerts');
      throw error;
    }
  },

  // Sites
  subscribeToSites: (userId: string, callback: (sites: any[]) => void) => {
    const q = query(
      collection(db, 'sites'), 
      where('userId', '==', userId),
      orderBy('name', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
      const sites = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(sites);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'sites'));
  },

  addSite: async (userId: string, site: any) => {
    try {
      await addDoc(collection(db, 'sites'), {
        ...site,
        userId,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'sites');
    }
  },

  updateSite: async (siteId: string, data: any) => {
    try {
      await updateDoc(doc(db, 'sites', siteId), {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'sites');
      throw error;
    }
  },

  deleteSite: async (siteId: string) => {
    try {
      await deleteDoc(doc(db, 'sites', siteId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'sites');
      throw error;
    }
  },

  // Software
  subscribeToSoftware: (userId: string, callback: (software: any[]) => void) => {
    const q = query(
      collection(db, 'software'), 
      where('userId', '==', userId),
      orderBy('name', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
      const software = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(software);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'software'));
  },

  // Patches
  subscribeToPatches: (userId: string, callback: (patches: any[]) => void) => {
    const q = query(
      collection(db, 'patches'), 
      where('userId', '==', userId),
      orderBy('title', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
      const patches = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(patches);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'patches'));
  },

  updatePatch: async (patchId: string, data: any) => {
    try {
      await updateDoc(doc(db, 'patches', patchId), {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'patches');
      throw error;
    }
  },

  // Users
  subscribeToUsers: (callback: (users: any[]) => void) => {
    const q = query(collection(db, 'users'), orderBy('email', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(users);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));
  },

  // Stats for Dashboard
  getDashboardStats: async (userId: string) => {
    try {
      const ticketsQ = query(collection(db, 'tickets'), where('userId', '==', userId), where('status', '==', 'open'));
      const devicesQ = query(collection(db, 'devices'), where('userId', '==', userId));
      const alertsQ = query(collection(db, 'alerts'), where('userId', '==', userId));
      const pendingCommandsQ = query(collection(db, 'commands'), where('userId', '==', userId), where('status', '==', 'pending'));

      const [ticketsSnap, devicesSnap, alertsSnap, commandsSnap] = await Promise.all([
        getCountFromServer(ticketsQ),
        getCountFromServer(devicesQ),
        getCountFromServer(alertsQ),
        getCountFromServer(pendingCommandsQ)
      ]);

      return {
        openTickets: ticketsSnap.data().count,
        managedDevices: devicesSnap.data().count,
        activeAlerts: alertsSnap.data().count,
        pendingCommands: commandsSnap.data().count,
        slaCompliance: "98.2%" // Mocked for now
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'stats');
    }
  },

  // API Bridge Methods
  sendCommand: async (deviceId: string, action: string, payload?: any) => {
    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) throw new Error('Not authenticated');

    const res = await fetch(`/api/agent/devices/${deviceId}/command`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({ action, payload })
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to send command');
    }
    return res.json();
  },

  deleteDevice: async (deviceId: string) => {
    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) throw new Error('Not authenticated');

    const res = await fetch(`/api/agent/devices/${deviceId}/delete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to delete device');
    }
    return res.json();
  },

  getEnrollmentToken: async () => {
    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) throw new Error('Not authenticated');

    const res = await fetch('/api/agent/enrollment-token', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to generate enrollment token');
    }
    const data = await res.json();
    return data.enrollment_token;
  }
};
