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
  subscribeToTickets: (callback: (tickets: Ticket[]) => void) => {
    const q = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const tickets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Ticket[];
      callback(tickets);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'tickets'));
  },

  addTicket: async (ticket: Omit<Ticket, 'id' | 'createdAt'>) => {
    try {
      await addDoc(collection(db, 'tickets'), {
        ...ticket,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'tickets');
    }
  },

  // Devices
  subscribeToDevices: (callback: (devices: Device[]) => void) => {
    const q = query(collection(db, 'devices'), orderBy('name', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const devices = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Device[];
      callback(devices);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'devices'));
  },

  addDevice: async (device: Omit<Device, 'id' | 'lastSeen'>) => {
    try {
      await addDoc(collection(db, 'devices'), {
        ...device,
        lastSeen: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'devices');
    }
  },

  // Alerts
  subscribeToAlerts: (callback: (alerts: Alert[]) => void) => {
    const q = query(collection(db, 'alerts'), orderBy('timestamp', 'desc'), limit(50));
    return onSnapshot(q, (snapshot) => {
      const alerts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Alert[];
      callback(alerts);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'alerts'));
  },

  addAlert: async (alert: Omit<Alert, 'id' | 'timestamp'>) => {
    try {
      await addDoc(collection(db, 'alerts'), {
        ...alert,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'alerts');
    }
  },

  // Sites
  subscribeToSites: (callback: (sites: any[]) => void) => {
    const q = query(collection(db, 'sites'), orderBy('name', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const sites = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(sites);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'sites'));
  },

  addSite: async (site: any) => {
    try {
      await addDoc(collection(db, 'sites'), {
        ...site,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'sites');
    }
  },

  // Software
  subscribeToSoftware: (callback: (software: any[]) => void) => {
    const q = query(collection(db, 'software'), orderBy('name', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const software = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(software);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'software'));
  },

  // Patches
  subscribeToPatches: (callback: (patches: any[]) => void) => {
    const q = query(collection(db, 'patches'), orderBy('title', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const patches = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(patches);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'patches'));
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
  getDashboardStats: async () => {
    try {
      const [ticketsSnap, devicesSnap, alertsSnap] = await Promise.all([
        getDocs(query(collection(db, 'tickets'), where('status', '==', 'open'))),
        getDocs(collection(db, 'devices')),
        getDocs(collection(db, 'alerts'))
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
