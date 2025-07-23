import { AuthService } from './auth';
import { create as ipfsHttpClient } from 'ipfs-http-client';
import * as fs from 'fs';

export interface Asset {
  id: string;
  name: string;
  description: string;
  tokenId: string;
  owner: string;
  ipfsUrl: string;
}

export interface MintAssetOptions {
  name: string;
  description?: string;
  file: string;
}

export class AssetService {
  private authService = new AuthService();
  private ipfs = ipfsHttpClient({ url: 'https://ipfs.io' });

  async mintAsset(options: MintAssetOptions): Promise<Asset> {
    // Upload file to IPFS
    const fileContent = fs.readFileSync(options.file);
    const ipfsResult = await this.ipfs.add(fileContent);
    const ipfsUrl = `https://ipfs.io/ipfs/${ipfsResult.path}`;

    // Call backend to mint NFT
    const client = this.authService.getAuthenticatedClient();
    try {
      const response = await client.post('/v1/assets/mint', {
        name: options.name,
        description: options.description,
        ipfsUrl
      });
      return { ...response.data, ipfsUrl };
    } catch (error: any) {
      throw new Error(`Failed to mint asset: ${error.response?.data?.message || error.message}`);
    }
  }

  async listAssets(): Promise<Asset[]> {
    const client = this.authService.getAuthenticatedClient();
    try {
      const response = await client.get('/v1/assets');
      return response.data.assets || [];
    } catch (error: any) {
      throw new Error(`Failed to list assets: ${error.response?.data?.message || error.message}`);
    }
  }

  async getAsset(assetId: string): Promise<Asset> {
    const client = this.authService.getAuthenticatedClient();
    try {
      const response = await client.get(`/v1/assets/${assetId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get asset: ${error.response?.data?.message || error.message}`);
    }
  }

  async transferAsset(assetId: string, toAddress: string): Promise<void> {
    const client = this.authService.getAuthenticatedClient();
    try {
      await client.post(`/v1/assets/${assetId}/transfer`, { toAddress });
    } catch (error: any) {
      throw new Error(`Failed to transfer asset: ${error.response?.data?.message || error.message}`);
    }
  }

  async burnAsset(assetId: string): Promise<void> {
    const client = this.authService.getAuthenticatedClient();
    try {
      await client.post(`/v1/assets/${assetId}/burn`);
    } catch (error: any) {
      throw new Error(`Failed to burn asset: ${error.response?.data?.message || error.message}`);
    }
  }
}
