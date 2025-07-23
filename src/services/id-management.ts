import { AuthService } from './auth';
import { ethers } from 'ethers';

export interface Identity {
  id: string;
  type: 'player' | 'developer' | 'guild' | 'moderator';
  walletAddress: string;
  displayName: string;
  email?: string;
  bio?: string;
  avatar?: string;
  status: 'active' | 'suspended' | 'pending';
  reputation: number;
  level: number;
  createdAt: string;
  achievements?: Achievement[];
  wallets?: Wallet[];
  privateKey?: string;
}

export interface CreateIdentityOptions {
  type: string;
  walletAddress?: string;
  displayName?: string;
  email?: string;
}

export interface Wallet {
  address: string;
  network: string;
  verified: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  points: number;
  unlockedAt: string;
}

export interface Reputation {
  score: number;
  level: string;
  rank: string;
  metrics: Record<string, any>;
  achievements: Achievement[];
}

export interface VerificationResult {
  verified: boolean;
  level: string;
  trustScore: number;
  reason?: string;
}

export class IdManagementService {
  private authService = new AuthService();

  async createIdentity(options: CreateIdentityOptions): Promise<Identity> {
    const client = this.authService.getAuthenticatedClient();
    
    let walletData: any = {};
    
    // Generate wallet if not provided
    if (!options.walletAddress) {
      const wallet = ethers.Wallet.createRandom();
      walletData = {
        walletAddress: wallet.address,
        privateKey: wallet.privateKey
      };
    } else {
      walletData = {
        walletAddress: options.walletAddress
      };
    }

    try {
      const response = await client.post('/v1/identities', {
        type: options.type,
        displayName: options.displayName,
        email: options.email,
        ...walletData
      });
      
      return {
        ...response.data,
        privateKey: walletData.privateKey
      };
    } catch (error: any) {
      throw new Error(`Failed to create identity: ${error.response?.data?.message || error.message}`);
    }
  }

  async linkWallet(identityId: string, walletAddress: string, network: string): Promise<void> {
    const client = this.authService.getAuthenticatedClient();
    
    try {
      await client.post(`/v1/identities/${identityId}/wallets`, {
        walletAddress,
        network
      });
    } catch (error: any) {
      throw new Error(`Failed to link wallet: ${error.response?.data?.message || error.message}`);
    }
  }

  async verifyIdentity(identityId: string, signature: string): Promise<VerificationResult> {
    const client = this.authService.getAuthenticatedClient();
    
    try {
      const response = await client.post(`/v1/identities/${identityId}/verify`, {
        signature
      });
      
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to verify identity: ${error.response?.data?.message || error.message}`);
    }
  }

  async getProfile(identityId?: string): Promise<Identity> {
    const client = this.authService.getAuthenticatedClient();
    
    try {
      const endpoint = identityId ? `/v1/identities/${identityId}` : '/v1/identities/me';
      const response = await client.get(endpoint);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get profile: ${error.response?.data?.message || error.message}`);
    }
  }

  async updateProfile(identityId: string | undefined, updates: Partial<Identity>): Promise<void> {
    const client = this.authService.getAuthenticatedClient();
    
    try {
      const endpoint = identityId ? `/v1/identities/${identityId}` : '/v1/identities/me';
      await client.patch(endpoint, updates);
    } catch (error: any) {
      throw new Error(`Failed to update profile: ${error.response?.data?.message || error.message}`);
    }
  }

  async listIdentities(type?: string): Promise<Identity[]> {
    const client = this.authService.getAuthenticatedClient();
    
    try {
      const response = await client.get('/v1/identities', {
        params: type ? { type } : {}
      });
      return response.data.identities || [];
    } catch (error: any) {
      throw new Error(`Failed to list identities: ${error.response?.data?.message || error.message}`);
    }
  }

  async getReputation(identityId: string): Promise<Reputation> {
    const client = this.authService.getAuthenticatedClient();
    
    try {
      const response = await client.get(`/v1/identities/${identityId}/reputation`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get reputation: ${error.response?.data?.message || error.message}`);
    }
  }

  async addPermission(identityId: string, permission: string): Promise<void> {
    const client = this.authService.getAuthenticatedClient();
    
    try {
      await client.post(`/v1/identities/${identityId}/permissions`, {
        permission
      });
    } catch (error: any) {
      throw new Error(`Failed to add permission: ${error.response?.data?.message || error.message}`);
    }
  }

  async removePermission(identityId: string, permission: string): Promise<void> {
    const client = this.authService.getAuthenticatedClient();
    
    try {
      await client.delete(`/v1/identities/${identityId}/permissions/${permission}`);
    } catch (error: any) {
      throw new Error(`Failed to remove permission: ${error.response?.data?.message || error.message}`);
    }
  }

  async getPermissions(identityId: string): Promise<string[]> {
    const client = this.authService.getAuthenticatedClient();
    
    try {
      const response = await client.get(`/v1/identities/${identityId}/permissions`);
      return response.data.permissions || [];
    } catch (error: any) {
      throw new Error(`Failed to get permissions: ${error.response?.data?.message || error.message}`);
    }
  }

  // Utility methods for Web3 operations
  generateWallet(): { address: string; privateKey: string } {
    const wallet = ethers.Wallet.createRandom();
    return {
      address: wallet.address,
      privateKey: wallet.privateKey
    };
  }

  async signMessage(privateKey: string, message: string): Promise<string> {
    const wallet = new ethers.Wallet(privateKey);
    return await wallet.signMessage(message);
  }

  verifySignature(message: string, signature: string, address: string): boolean {
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {
      return false;
    }
  }
}
