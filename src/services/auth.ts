import axios, { AxiosInstance } from 'axios';
import { ConfigService } from './config';

export interface UserInfo {
  id: string;
  username: string;
  email: string;
  plan: string;
}

export class AuthService {
  private configService = new ConfigService();
  private client: AxiosInstance;

  constructor() {
    const baseUrl = this.configService.get('auth.baseUrl') || 'https://api.gamebuild.com';
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GameBuild-CLI/1.0.0'
      }
    });

    // Add auth interceptor
    this.client.interceptors.request.use((config) => {
      const token = this.configService.get('auth.token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async validateToken(token: string, baseUrl: string): Promise<boolean> {
    try {
      const response = await axios.get(`${baseUrl}/v1/user/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': 'GameBuild-CLI/1.0.0'
        }
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  async getUserInfo(): Promise<UserInfo> {
    try {
      const response = await this.client.get('/v1/user/me');
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get user info: ${error.message}`);
    }
  }

  getAuthenticatedClient(): AxiosInstance {
    return this.client;
  }

  isAuthenticated(): boolean {
    return !!this.configService.get('auth.token');
  }
}
