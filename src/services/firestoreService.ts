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
  limit
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Ticket, Device, Alert } from '../types';

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

  addDevice: async (userId: string, device: Omit<Device, 'id' | 'lastSeen' | 'userId'>) => {
    try {
      await addDoc(collection(db, 'devices'), {
        ...device,
        userId,
        lastSeen: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'devices');
    }
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
      const [ticketsSnap, devicesSnap, alertsSnap] = await Promise.all([
        getDocs(query(
          collection(db, 'tickets'), 
          where('userId', '==', userId),
          where('status', '==', 'open')
        )),
        getDocs(query(
          collection(db, 'devices'),
          where('userId', '==', userId)
        )),
        getDocs(query(
          collection(db, 'alerts'),
          where('userId', '==', userId)
        ))
      ]);

      return {
        openTickets: ticketsSnap.size,
        managedDevices: devicesSnap.size,
        activeAlerts: alertsSnap.size,
        slaCompliance: "98.2%" // Mocked for now or calculated
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'stats');
    }
  }
};
