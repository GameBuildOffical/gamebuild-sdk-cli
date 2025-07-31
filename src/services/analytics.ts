import { AuthService } from './auth';

export interface AnalyticsOverview {
  players: {
    total: number;
    new: number;
    returning: number;
  };
  revenue: {
    total: number;
    iap: number;
    ads: number;
  };
  engagement: {
    avgSessionDuration: number;
    sessionsPerUser: number;
    retentionRate: number;
  };
  growth: {
    userGrowth: number;
    revenueGrowth: number;
  };
}

export interface PlayerAnalytics {
  acquisition: {
    newUsers: number;
    organic: number;
    paid: number;
  };
  demographics: {
    avgAge: number;
    topCountries: Array<{ name: string; percentage: number }>;
  };
  behavior: {
    dau: number;
    wau: number;
    mau: number;
    avgPlaytime: number;
  };
}

export interface RevenueAnalytics {
  total: number;
  sources: {
    iap: number;
    ads: number;
    subscriptions: number;
    iapPercentage: number;
    adsPercentage: number;
    subscriptionsPercentage: number;
  };
  metrics: {
    arpu: number;
    arppu: number;
    conversionRate: number;
  };
  topProducts: Array<{ name: string; revenue: number }>;
}

export interface EventAnalytics {
  specific?: {
    total: number;
    uniqueUsers: number;
    avgPerUser: number;
  };
  topEvents: Array<{ name: string; count: number }>;
  categories: Record<string, number>;
}

export interface RetentionAnalytics {
  day1: number;
  day7: number;
  day30: number;
  cohorts: Array<{ period: string; retention: number; users: number }>;
  churn: {
    rate: number;
    reasons: Array<{ name: string; percentage: number }>;
  };
}

export interface ExportResult {
  filename: string;
  recordCount: number;
  downloadUrl: string;
}

export interface RealTimeData {
  activeUsers: number;
  activeSessions: number;
  todayRevenue: number;
  recent: {
    newUsers: number;
    events: number;
    purchases: number;
  };
  topPages: Array<{ name: string; users: number }>;
}

export class AnalyticsService {
  private authService = new AuthService();

  async getOverview(period: string, gameId?: string): Promise<AnalyticsOverview> {
    const client = this.authService.getAuthenticatedClient();
    
    try {
      const response = await client.get('/v1/analytics/overview', {
        params: { period, gameId }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get analytics overview: ${error.response?.data?.message || error.message}`);
    }
  }

  async getPlayerAnalytics(period: string, gameId?: string): Promise<PlayerAnalytics> {
    const client = this.authService.getAuthenticatedClient();
    
    try {
      const response = await client.get('/v1/analytics/players', {
        params: { period, gameId }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get player analytics: ${error.response?.data?.message || error.message}`);
    }
  }

  async getRevenueAnalytics(period: string, gameId?: string): Promise<RevenueAnalytics> {
    const client = this.authService.getAuthenticatedClient();
    
    try {
      const response = await client.get('/v1/analytics/revenue', {
        params: { period, gameId }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get revenue analytics: ${error.response?.data?.message || error.message}`);
    }
  }

  async getEventAnalytics(period: string, gameId?: string, eventType?: string): Promise<EventAnalytics> {
    const client = this.authService.getAuthenticatedClient();
    
    try {
      const response = await client.get('/v1/analytics/events', {
        params: { period, gameId, eventType }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get event analytics: ${error.response?.data?.message || error.message}`);
    }
  }

  async getRetentionAnalytics(period: string, gameId?: string): Promise<RetentionAnalytics> {
    const client = this.authService.getAuthenticatedClient();
    
    try {
      const response = await client.get('/v1/analytics/retention', {
        params: { period, gameId }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get retention analytics: ${error.response?.data?.message || error.message}`);
    }
  }

  async exportData(type: string, format: string, period: string): Promise<ExportResult> {
    const client = this.authService.getAuthenticatedClient();
    
    try {
      const response = await client.post('/v1/analytics/export', {
        type,
        format,
        period
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to export data: ${error.response?.data?.message || error.message}`);
    }
  }

  async getRealTimeData(gameId?: string): Promise<RealTimeData> {
    const client = this.authService.getAuthenticatedClient();
    
    try {
      const response = await client.get('/v1/analytics/realtime', {
        params: { gameId }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get real-time data: ${error.response?.data?.message || error.message}`);
    }
  }

  async trackEvent(eventName: string, properties?: Record<string, any>): Promise<void> {
    const client = this.authService.getAuthenticatedClient();
    
    try {
      await client.post('/v1/analytics/track', {
        event: eventName,
        properties
      });
    } catch (error: any) {
      throw new Error(`Failed to track event: ${error.response?.data?.message || error.message}`);
    }
  }

  async createCustomDashboard(name: string, widgets: any[]): Promise<any> {
    const client = this.authService.getAuthenticatedClient();
    
    try {
      const response = await client.post('/v1/analytics/dashboards', {
        name,
        widgets
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to create dashboard: ${error.response?.data?.message || error.message}`);
    }
  }

  async getCustomDashboards(): Promise<any[]> {
    const client = this.authService.getAuthenticatedClient();
    
    try {
      const response = await client.get('/v1/analytics/dashboards');
      return response.data.dashboards || [];
    } catch (error: any) {
      throw new Error(`Failed to get dashboards: ${error.response?.data?.message || error.message}`);
    }
  }

  async getFunnelAnalysis(funnelId: string, period: string): Promise<any> {
    const client = this.authService.getAuthenticatedClient();
    
    try {
      const response = await client.get(`/v1/analytics/funnels/${funnelId}`, {
        params: { period }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get funnel analysis: ${error.response?.data?.message || error.message}`);
    }
  }

  async getSegmentation(segmentType: string, period: string): Promise<any> {
    const client = this.authService.getAuthenticatedClient();
    
    try {
      const response = await client.get('/v1/analytics/segmentation', {
        params: { segmentType, period }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get segmentation data: ${error.response?.data?.message || error.message}`);
    }
  }
}
