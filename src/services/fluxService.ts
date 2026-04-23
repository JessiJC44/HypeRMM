import CobrowseIO from 'cobrowse-sdk-js';

export interface FluxSessionInfo {
  id: string;
  device: string;
  agent: string;
  state: 'active' | 'ended' | 'pending';
}

class FluxService {
  private initialized = false;

  async init() {
    if (this.initialized) return;
    
    const license = (import.meta as any).env.VITE_FLUX_LICENSE_ID || (import.meta as any).env.VITE_COBROWSE_LICENSE_ID;
    if (!license) {
      console.warn('FLUX License ID not configured');
      return;
    }

    CobrowseIO.license = license;
    this.initialized = true;
  }

  /**
   * Starts a FLUX session for a specific device (unattended)
   */
  async connectToDevice(deviceId: string, deviceName: string): Promise<string> {
    await this.init();

    // Rebrand the technician's metadata
    (CobrowseIO as any).customData = {
      device_id: deviceId,
      device_name: deviceName,
      agent_type: 'flux_technician',
      source: 'HypeRemote'
    };

    // In a real cobrowse-sdk-js technician implementation, 
    // you'd typically use their API to create a session for a device.
    // For this applet, since we can't easily perform cross-domain API calls to cobrowse.io 
    // without a proxy, we will use the standard SDK session start for simulation 
    // but structure it for the "Unattended" branding.
    
    await CobrowseIO.start();
    
    // Return a dummy session ID or get it from CobrowseIO if available
    return (CobrowseIO as any).currentSession?.id || 'flux_session_' + Date.now();
  }

  async stopSession() {
    await CobrowseIO.stop();
  }

  get isSupported() {
    return typeof window !== 'undefined';
  }
}

export const fluxService = new FluxService();
