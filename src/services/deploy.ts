import { AuthService } from './auth';

export interface Deployment {
  id: string;
  gameId: string;
  buildId: string;
  status: string;
  environment: string;
  platform: string;
  startedAt: string;
  completedAt?: string;
  url?: string;
  logs?: string;
}

export interface DeploymentOptions {
  buildId: string;
  environment: string;
  platform: string;
}

export interface PlatformOption {
  name: string;
  value: string;
  description: string;
}

export class DeployService {
  private authService = new AuthService();

  async startDeployment(options: DeploymentOptions): Promise<Deployment> {
    const client = this.authService.getAuthenticatedClient();
    
    try {
      const response = await client.post('/v1/deployments', {
        buildId: options.buildId,
        environment: options.environment,
        platform: options.platform
      });
      
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to start deployment: ${error.response?.data?.message || error.message}`);
    }
  }

  async getDeployment(deploymentId: string): Promise<Deployment> {
    const client = this.authService.getAuthenticatedClient();
    
    try {
      const response = await client.get(`/v1/deployments/${deploymentId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get deployment: ${error.response?.data?.message || error.message}`);
    }
  }

  async getLatestDeployment(gameId: string): Promise<Deployment | null> {
    const deployments = await this.listDeployments(gameId, 1);
    return deployments.length > 0 ? deployments[0] : null;
  }

  async listDeployments(gameId: string, limit: number = 10): Promise<Deployment[]> {
    const client = this.authService.getAuthenticatedClient();
    
    try {
      const response = await client.get(`/v1/games/${gameId}/deployments`, {
        params: { limit }
      });
      return response.data.deployments || [];
    } catch (error: any) {
      throw new Error(`Failed to list deployments: ${error.response?.data?.message || error.message}`);
    }
  }

  async rollbackDeployment(deploymentId: string): Promise<Deployment> {
    const client = this.authService.getAuthenticatedClient();
    
    try {
      const response = await client.post(`/v1/deployments/${deploymentId}/rollback`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to rollback deployment: ${error.response?.data?.message || error.message}`);
    }
  }

  async getLogs(deploymentId: string): Promise<string> {
    const client = this.authService.getAuthenticatedClient();
    
    try {
      const response = await client.get(`/v1/deployments/${deploymentId}/logs`);
      return response.data.logs || '';
    } catch (error: any) {
      throw new Error(`Failed to get logs: ${error.response?.data?.message || error.message}`);
    }
  }

  async followLogs(deploymentId: string): Promise<void> {
    console.log('Following logs... Press Ctrl+C to stop');
    
    let lastLogLength = 0;
    
    const pollLogs = async () => {
      try {
        const logs = await this.getLogs(deploymentId);
        const newLogs = logs.slice(lastLogLength);
        
        if (newLogs) {
          process.stdout.write(newLogs);
          lastLogLength = logs.length;
        }
        
        const deployment = await this.getDeployment(deploymentId);
        if (deployment.status === 'deploying') {
          setTimeout(pollLogs, 3000); // Poll every 3 seconds
        } else {
          console.log(`\nDeployment finished with status: ${deployment.status}`);
        }
      } catch (error: any) {
        console.log(`Error following logs: ${error.message}`);
      }
    };

    pollLogs();
    
    process.on('SIGINT', () => {
      console.log('\n👋 Stopped following logs.');
      process.exit(0);
    });
  }

  async getLatestSuccessfulBuild(gameId: string): Promise<any> {
    const client = this.authService.getAuthenticatedClient();
    
    try {
      const response = await client.get(`/v1/games/${gameId}/builds`, {
        params: { 
          status: 'success',
          limit: 1 
        }
      });
      const builds = response.data.builds || [];
      return builds.length > 0 ? builds[0] : null;
    } catch (error: any) {
      throw new Error(`Failed to get latest build: ${error.response?.data?.message || error.message}`);
    }
  }

  getAvailablePlatforms(gameType: string): PlatformOption[] {
    const platformMap: Record<string, PlatformOption[]> = {
      web: [
        { name: '🌐 GameBuild Hosting', value: 'gamebuild', description: 'Built-in hosting platform' },
        { name: '☁️ Netlify', value: 'netlify', description: 'Deploy to Netlify' },
        { name: '⚡ Vercel', value: 'vercel', description: 'Deploy to Vercel' },
        { name: '🔥 Firebase', value: 'firebase', description: 'Deploy to Firebase Hosting' },
        { name: '📦 GitHub Pages', value: 'github-pages', description: 'Deploy to GitHub Pages' }
      ],
      mobile: [
        { name: '🍎 App Store', value: 'app-store', description: 'Deploy to Apple App Store' },
        { name: '🤖 Google Play', value: 'google-play', description: 'Deploy to Google Play Store' },
        { name: '📱 TestFlight', value: 'testflight', description: 'Deploy to TestFlight (iOS)' },
        { name: '🧪 Internal Testing', value: 'internal-testing', description: 'Internal testing track' }
      ],
      desktop: [
        { name: '💻 Steam', value: 'steam', description: 'Deploy to Steam' },
        { name: '🎮 Itch.io', value: 'itch', description: 'Deploy to Itch.io' },
        { name: '🪟 Microsoft Store', value: 'microsoft-store', description: 'Deploy to Microsoft Store' },
        { name: '📦 Direct Download', value: 'direct', description: 'Generate downloadable packages' }
      ],
      console: [
        { name: '🎮 Nintendo eShop', value: 'nintendo-eshop', description: 'Deploy to Nintendo eShop' },
        { name: '🎯 PlayStation Store', value: 'playstation-store', description: 'Deploy to PlayStation Store' },
        { name: '🟢 Xbox Store', value: 'xbox-store', description: 'Deploy to Xbox Store' }
      ]
    };

    return platformMap[gameType] || [
      { name: '🌐 GameBuild Hosting', value: 'gamebuild', description: 'Built-in hosting platform' }
    ];
  }
}
