import { AuthService } from './auth';

export interface Guild {
  id: string;
  name: string;
  description: string;
  members: any[];
}

export interface CreateGuildOptions {
  name: string;
  description?: string;
}

export class GuildService {
  private authService = new AuthService();

  async createGuild(options: CreateGuildOptions): Promise<Guild> {
    const client = this.authService.getAuthenticatedClient();
    try {
      const response = await client.post('/v1/guilds', options);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to create guild: ${error.response?.data?.message || error.message}`);
    }
  }

  async listGuilds(): Promise<Guild[]> {
    const client = this.authService.getAuthenticatedClient();
    try {
      const response = await client.get('/v1/guilds');
      return response.data.guilds || [];
    } catch (error: any) {
      throw new Error(`Failed to list guilds: ${error.response?.data?.message || error.message}`);
    }
  }

  async getGuild(guildId: string): Promise<Guild> {
    const client = this.authService.getAuthenticatedClient();
    try {
      const response = await client.get(`/v1/guilds/${guildId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get guild: ${error.response?.data?.message || error.message}`);
    }
  }

  async joinGuild(guildId: string): Promise<void> {
    const client = this.authService.getAuthenticatedClient();
    try {
      await client.post(`/v1/guilds/${guildId}/join`);
    } catch (error: any) {
      throw new Error(`Failed to join guild: ${error.response?.data?.message || error.message}`);
    }
  }

  async leaveGuild(guildId: string): Promise<void> {
    const client = this.authService.getAuthenticatedClient();
    try {
      await client.post(`/v1/guilds/${guildId}/leave`);
    } catch (error: any) {
      throw new Error(`Failed to leave guild: ${error.response?.data?.message || error.message}`);
    }
  }
}
