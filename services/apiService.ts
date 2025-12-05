import { EncryptionService } from '../lib/encryption';
import { IPasswordEntry, Folder, AuthorizedContact, User } from '../types';
import { auth } from '../lib/firebase'; // Import frontend firebase auth

// Helper for API requests
const request = async (endpoint: string, options: RequestInit = {}) => {
  // Get Firebase Token
  let token = null;
  if (auth.currentUser) {
    token = await auth.currentUser.getIdToken();
  }

  const headers: any = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });
  const data = await res.json();
  return data;
};

export const apiService = {
  async signup(email: string, masterPassword: string, publicKey?: string, encryptedPrivateKey?: string): Promise<{ success: boolean; message: string }> {
    // NOTE: Caller (Auth.tsx) must handle Firebase User Creation first to get the token!
    // This function now just syncs with backend.
    // Actually, let's keep the signature simple and let the component handle the heavy lifting OR
    // we assume the user is already logged in via Firebase when this is called?
    // Better pattern: Pass the token explicitly or assume global auth state.

    // For signup sync, we need the token. The user is logged in immediately after creation in Firebase.
    if (!auth.currentUser) return { success: false, message: "Firebase Auth failed" };
    const token = await auth.currentUser.getIdToken();

    const masterPasswordHash = EncryptionService.hashPassword(masterPassword);

    // Pass token in body for the signup endpoint as it might check it strictly against email
    return request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ token, email, masterPasswordHash, publicKey, encryptedPrivateKey }),
    });
  },

  async login(email: string, masterPassword: string): Promise<{ success: boolean; message: string; user?: User; keys?: { publicKey: string; encryptedPrivateKey: string } }> {
    // Similarly, user must be logged in via Firebase first.
    if (!auth.currentUser) return { success: false, message: "Use Firebase Login first" };
    const token = await auth.currentUser.getIdToken();

    const masterPasswordHash = EncryptionService.hashPassword(masterPassword);
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ token, email, masterPasswordHash }),
    });
  },

  async logout(): Promise<{ success: boolean; message: string }> {
    await auth.signOut();
    return request('/auth/logout', { method: 'POST' });
  },

  async checkSession(): Promise<{ success: boolean; user?: User }> {
    // If no firebase user, we aren't logged in
    if (!auth.currentUser) return { success: false };
    return request('/auth/me');
  },

  async getVault(email: string, masterPassword: string): Promise<{ success: boolean; data?: { passwords: IPasswordEntry[], folders: Folder[], authorizedContacts: AuthorizedContact[] }, message: string }> {
    const result = await request('/vault'); // Token attached automatically

    if (!result.success) {
      return result;
    }

    if (!result.data) {
      // New vault or empty
      return { success: true, data: { passwords: [], folders: [], authorizedContacts: [] }, message: 'New vault created.' };
    }

    try {
      EncryptionService.setMasterPassword(masterPassword);
      const decrypted = EncryptionService.decrypt(result.data);
      const data = JSON.parse(decrypted);
      // Ensure date fields are converted back to Date objects
      data.passwords = (data.passwords || []).map((p: any) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
        passwordHistory: (p.passwordHistory || []).map((h: any) => ({ ...h, date: new Date(h.date) }))
      }));
      data.authorizedContacts = (data.authorizedContacts || []).map((c: any) => ({ ...c, createdAt: new Date(c.createdAt) }));
      return { success: true, data, message: 'Vault fetched successfully.' };
    } catch (error) {
      return { success: false, message: 'Failed to decrypt vault. Master password may be incorrect.' };
    }
  },

  async saveVault(email: string, masterPassword: string, vaultData: { passwords: IPasswordEntry[], folders: Folder[], authorizedContacts: AuthorizedContact[] }): Promise<{ success: boolean; message: string }> {
    try {
      EncryptionService.setMasterPassword(masterPassword);
      const encryptedData = EncryptionService.encrypt(JSON.stringify(vaultData));
      return request('/vault', {
        method: 'PUT',
        body: JSON.stringify({ encryptedData }),
      });
    } catch (error) {
      return { success: false, message: 'Failed to encrypt and save vault.' };
    }
  },

  async getPublicKey(email: string): Promise<{ success: boolean; publicKey?: string; message?: string }> {
    return request(`/auth/keys/${email}`);
  },

  async shareItem(recipientEmail: string, encryptedData: string, encryptedKey: string): Promise<{ success: boolean; message: string }> {
    return request('/share', {
      method: 'POST',
      body: JSON.stringify({ recipientEmail, encryptedData, encryptedKey })
    });
  },

  async getSharedItems(): Promise<{ success: boolean; items?: any[]; message?: string }> {
    console.log("Fetching shared items...");
    return request('/share');
  },

  async deleteSharedItem(id: string): Promise<{ success: boolean; message: string }> {
    return request(`/share/${id}`, { method: 'DELETE' });
  },

  async resetPasswordWithPasskey(email: string): Promise<{ success: boolean; message: string }> {
    // TODO: Implement real backend reset logic
    // For now, we simulate the client-side experience but we can't actually delete the server data easily without an endpoint.
    // We will just return a success message and let the user know this is a demo feature for now, 
    // or we could implement a DELETE /vault endpoint.

    await new Promise(res => setTimeout(res, 1000));

    // Simulate passkey verification
    const passkeyVerified = await new Promise(res => {
      const verified = window.confirm(`(Simulation) Verify identity for ${email} with a passkey?`);
      res(verified);
    });

    if (!passkeyVerified) {
      return { success: false, message: "Passkey verification failed." };
    }

    // Simulate 2FA verification
    const twoFactorVerified = await new Promise(res => {
      const code = window.prompt(`(Simulation) 2-Factor Authentication: Please enter the 6-digit code sent to your device.`);
      const verified = code != null && /^\d{6}$/.test(code);
      if (!verified && code !== null) {
        alert('Invalid 2FA code. Please enter a 6-digit code.');
      }
      res(verified);
    });

    if (!twoFactorVerified) {
      return { success: false, message: "2FA verification failed." };
    }

    return { success: true, message: "Password reset successful. (Note: In this demo, server data is not actually deleted yet)." };
  },

  async getPlans(): Promise<{ success: boolean; plans?: any[]; message?: string }> {
    return request('/billing/plans');
  },

  async subscribe(planId: string, cycle: 'monthly' | 'yearly'): Promise<{ success: boolean; message: string }> {
    return request('/billing/subscribe', {
      method: 'POST',
      body: JSON.stringify({ planId, cycle })
    });
  },

  cancelSubscription(): Promise<{ success: boolean; message: string }> {
    return request('/billing/cancel', { method: 'POST' });
  },

  async verifyPayment(reference: string, planId: string, cycle: string) {
    return request('/billing/verify', {
      method: 'POST',
      body: JSON.stringify({ reference, planId, cycle }),
    });
  },
};