import { AuthService } from './auth';

export interface Campaign {
  id: string;
  name: string;
  type: 'banner' | 'video' | 'interstitial' | 'rewarded';
  budget: number;
  spent?: number;
  status: 'draft' | 'active' | 'paused' | 'completed';
  targetAudience?: string;
  duration?: number;
  createdAt: string;
  impressions?: number;
  clicks?: number;
  ctr?: number;
  conversions?: number;
}

export interface CreateCampaignOptions {
  name: string;
  type: string;
  budget: number;
  targetAudience?: string;
  duration?: number;
}

export interface CampaignStats {
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  revenue: number;
  roi: number;
}

export interface AdPlacement {
  id: string;
  name: string;
  type: string;
  gameName: string;
  revenueShare: number;
}

export interface RevenueData {
  total: number;
  impressions: number;
  clicks: number;
  conversions: number;
  byGame?: Array<{ name: string; revenue: number }>;
}

export class AdService {
  private authService = new AuthService();

  async createCampaign(options: CreateCampaignOptions): Promise<Campaign> {
    const client = this.authService.getAuthenticatedClient();
    
    try {
      const response = await client.post('/v1/ads/campaigns', {
        name: options.name,
        type: options.type,
        budget: options.budget,
        targetAudience: options.targetAudience,
        duration: options.duration
      });
      
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to create campaign: ${error.response?.data?.message || error.message}`);
    }
  }

  async listCampaigns(status?: string): Promise<Campaign[]> {
    const client = this.authService.getAuthenticatedClient();
    
    try {
      const response = await client.get('/v1/ads/campaigns', {
        params: status ? { status } : {}
      });
      return response.data.campaigns || [];
    } catch (error: any) {
      throw new Error(`Failed to list campaigns: ${error.response?.data?.message || error.message}`);
    }
  }

  async getCampaign(campaignId: string): Promise<Campaign> {
    const client = this.authService.getAuthenticatedClient();
    
    try {
      const response = await client.get(`/v1/ads/campaigns/${campaignId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get campaign: ${error.response?.data?.message || error.message}`);
    }
  }

  async startCampaign(campaignId: string): Promise<void> {
    const client = this.authService.getAuthenticatedClient();
    
    try {
      await client.post(`/v1/ads/campaigns/${campaignId}/start`);
    } catch (error: any) {
      throw new Error(`Failed to start campaign: ${error.response?.data?.message || error.message}`);
    }
  }

  async pauseCampaign(campaignId: string): Promise<void> {
    const client = this.authService.getAuthenticatedClient();
    
    try {
      await client.post(`/v1/ads/campaigns/${campaignId}/pause`);
    } catch (error: any) {
      throw new Error(`Failed to pause campaign: ${error.response?.data?.message || error.message}`);
    }
  }

  async getCampaignStats(campaignId: string, period: string): Promise<CampaignStats> {
    const client = this.authService.getAuthenticatedClient();
    
    try {
      const response = await client.get(`/v1/ads/campaigns/${campaignId}/stats`, {
        params: { period }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get campaign stats: ${error.response?.data?.message || error.message}`);
    }
  }

  async listPlacements(): Promise<AdPlacement[]> {
    const client = this.authService.getAuthenticatedClient();
    
    try {
      const response = await client.get('/v1/ads/placements');
      return response.data.placements || [];
    } catch (error: any) {
      throw new Error(`Failed to list placements: ${error.response?.data?.message || error.message}`);
    }
  }

  async getRevenue(period: string, gameId?: string): Promise<RevenueData> {
    const client = this.authService.getAuthenticatedClient();
    
    try {
      const response = await client.get('/v1/ads/revenue', {
        params: { period, gameId }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get revenue data: ${error.response?.data?.message || error.message}`);
    }
  }

  async createPlacement(options: any): Promise<AdPlacement> {
    const client = this.authService.getAuthenticatedClient();
    
    try {
      const response = await client.post('/v1/ads/placements', options);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to create placement: ${error.response?.data?.message || error.message}`);
    }
  }

  async updateCampaign(campaignId: string, updates: Partial<Campaign>): Promise<Campaign> {
    const client = this.authService.getAuthenticatedClient();
    
    try {
      const response = await client.patch(`/v1/ads/campaigns/${campaignId}`, updates);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to update campaign: ${error.response?.data?.message || error.message}`);
    }
  }

  async deleteCampaign(campaignId: string): Promise<void> {
    const client = this.authService.getAuthenticatedClient();
    
    try {
      await client.delete(`/v1/ads/campaigns/${campaignId}`);
    } catch (error: any) {
      throw new Error(`Failed to delete campaign: ${error.response?.data?.message || error.message}`);
    }
  }
}
