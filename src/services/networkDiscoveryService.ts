import { auth } from '../lib/firebase';

const getHeaders = async () => {
  const token = await auth.currentUser?.getIdToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const getProxyCandidates = async () => {
  const headers = await getHeaders();
  const response = await fetch('/api/network/proxy-candidates', { headers });
  if (!response.ok) throw new Error('Failed to fetch proxy candidates');
  return response.json();
};

export const startNetworkScan = async (proxyAgentId: string, scanTypes: string[], customSubnet?: string) => {
  const headers = await getHeaders();
  const response = await fetch('/api/network/scan', {
    method: 'POST',
    headers,
    body: JSON.stringify({ proxyAgentId, scanTypes, customSubnet })
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to start scan');
  }
  return response.json();
};

export const getScans = async () => {
  const headers = await getHeaders();
  const response = await fetch('/api/network/scans', { headers });
  if (!response.ok) throw new Error('Failed to fetch scans');
  return response.json();
};

export const getScanDetails = async (scanId: string) => {
  const headers = await getHeaders();
  const response = await fetch(`/api/network/scans/${scanId}`, { headers });
  if (!response.ok) throw new Error('Failed to fetch scan details');
  return response.json();
};

export const cancelScan = async (scanId: string) => {
  const headers = await getHeaders();
  const response = await fetch(`/api/network/scans/${scanId}/cancel`, { method: 'POST', headers });
  if (!response.ok) throw new Error('Failed to cancel scan');
  return response.json();
};

export const sendInvitation = async (resultId: string, email: string, message?: string) => {
  const headers = await getHeaders();
  const response = await fetch(`/api/network/results/${resultId}/send-invitation`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, message })
  });
  if (!response.ok) throw new Error('Failed to send invitation');
  return response.json();
};
