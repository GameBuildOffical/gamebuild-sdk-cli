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

export interface Erc20Token {
  contractAddress: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  transactionHash: string;
}

export interface Erc20Options {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
}

export interface Erc721Collection {
  contractAddress: string;
  name: string;
  symbol: string;
  baseUri?: string;
  transactionHash: string;
}

export interface Erc721Options {
  name: string;
  symbol: string;
  baseUri?: string;
}

export interface Erc721Nft {
  tokenId: string;
  contractAddress: string;
  owner: string;
  metadataUri?: string;
  transactionHash: string;
}

export interface MintErc721Options {
  contractAddress: string;
  toAddress: string;
  metadataUri?: string;
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

  async issueErc20(options: Erc20Options): Promise<Erc20Token> {
    const client = this.authService.getAuthenticatedClient();
    try {
      const response = await client.post('/v1/tokens/erc20/issue', {
        name: options.name,
        symbol: options.symbol,
        decimals: options.decimals,
        totalSupply: options.totalSupply
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to issue ERC20 token: ${error.response?.data?.message || error.message}`);
    }
  }

  async issueErc721(options: Erc721Options): Promise<Erc721Collection> {
    const client = this.authService.getAuthenticatedClient();
    try {
      const response = await client.post('/v1/tokens/erc721/issue', {
        name: options.name,
        symbol: options.symbol,
        baseUri: options.baseUri
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to issue ERC721 collection: ${error.response?.data?.message || error.message}`);
    }
  }

  async mintErc721(options: MintErc721Options): Promise<Erc721Nft> {
    const client = this.authService.getAuthenticatedClient();
    try {
      const response = await client.post('/v1/tokens/erc721/mint', {
        contractAddress: options.contractAddress,
        toAddress: options.toAddress,
        metadataUri: options.metadataUri
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to mint ERC721 NFT: ${error.response?.data?.message || error.message}`);
    }
  }

  async getErc20Token(contractAddress: string): Promise<Erc20Token> {
    const client = this.authService.getAuthenticatedClient();
    try {
      const response = await client.get(`/v1/tokens/erc20/${contractAddress}`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get ERC20 token: ${error.response?.data?.message || error.message}`);
    }
  }

  async getErc721Collection(contractAddress: string): Promise<Erc721Collection> {
    const client = this.authService.getAuthenticatedClient();
    try {
      const response = await client.get(`/v1/tokens/erc721/${contractAddress}`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get ERC721 collection: ${error.response?.data?.message || error.message}`);
    }
  }

  async getErc721Token(contractAddress: string, tokenId: string): Promise<Erc721Nft> {
    const client = this.authService.getAuthenticatedClient();
    try {
      const response = await client.get(`/v1/tokens/erc721/${contractAddress}/${tokenId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get ERC721 token: ${error.response?.data?.message || error.message}`);
    }
  }

  async listErc20Tokens(): Promise<Erc20Token[]> {
    const client = this.authService.getAuthenticatedClient();
    try {
      const response = await client.get('/v1/tokens/erc20');
      return response.data.tokens || [];
    } catch (error: any) {
      throw new Error(`Failed to list ERC20 tokens: ${error.response?.data?.message || error.message}`);
    }
  }

  async listErc721Collections(): Promise<Erc721Collection[]> {
    const client = this.authService.getAuthenticatedClient();
    try {
      const response = await client.get('/v1/tokens/erc721');
      return response.data.collections || [];
    } catch (error: any) {
      throw new Error(`Failed to list ERC721 collections: ${error.response?.data?.message || error.message}`);
    }
  }
}
