import { AuthService } from './auth';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

export interface Build {
  id: string;
  gameId: string;
  status: string;
  environment: string;
  platform: string;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  downloadUrl?: string;
  logs?: string;
}

export interface BuildOptions {
  gameId: string;
  environment: string;
  platform?: string;
  watch?: boolean;
}

export class BuildService {
  private authService = new AuthService();

  async startBuild(options: BuildOptions): Promise<Build> {
    const client = this.authService.getAuthenticatedClient();
    
    try {
      // Upload project files first
      await this.uploadProject(options.gameId);
      
      // Start build
      const response = await client.post('/v1/builds', {
        gameId: options.gameId,
        environment: options.environment,
        platform: options.platform
      });
      
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to start build: ${error.response?.data?.message || error.message}`);
    }
  }

  async startWatchBuild(options: BuildOptions): Promise<void> {
    console.log(chalk.blue('👀 Starting watch mode...'));
    console.log(chalk.gray('Press Ctrl+C to stop watching'));
    
    // Initial build
    await this.startBuild(options);
    
    // Watch for file changes
    const watchPaths = ['src', 'assets'].filter(dir => 
      fs.existsSync(path.join(process.cwd(), dir))
    );
    
    if (watchPaths.length === 0) {
      console.log(chalk.yellow('⚠️  No source directories found to watch.'));
      return;
    }
    
    console.log(chalk.gray(`Watching: ${watchPaths.join(', ')}`));
    
    // Simple file watcher implementation
    let buildTimeout: NodeJS.Timeout;
    
    const watchCallback = async () => {
      clearTimeout(buildTimeout);
      buildTimeout = setTimeout(async () => {
        console.log(chalk.blue('🔄 File changes detected, rebuilding...'));
        try {
          await this.startBuild(options);
          console.log(chalk.green('✅ Rebuild completed!'));
        } catch (error: any) {
          console.log(chalk.red(`❌ Rebuild failed: ${error.message}`));
        }
      }, 1000); // Debounce rebuilds by 1 second
    };

    watchPaths.forEach(watchPath => {
      const fullPath = path.join(process.cwd(), watchPath);
      fs.watch(fullPath, { recursive: true }, watchCallback);
    });

    // Keep the process alive
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\n👋 Stopping watch mode...'));
      process.exit(0);
    });
  }

  async getBuild(buildId: string): Promise<Build> {
    const client = this.authService.getAuthenticatedClient();
    
    try {
      const response = await client.get(`/v1/builds/${buildId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get build: ${error.response?.data?.message || error.message}`);
    }
  }

  async getLatestBuild(gameId: string): Promise<Build | null> {
    const builds = await this.listBuilds(gameId, 1);
    return builds.length > 0 ? builds[0] : null;
  }

  async listBuilds(gameId: string, limit: number = 10): Promise<Build[]> {
    const client = this.authService.getAuthenticatedClient();
    
    try {
      const response = await client.get(`/v1/games/${gameId}/builds`, {
        params: { limit }
      });
      return response.data.builds || [];
    } catch (error: any) {
      throw new Error(`Failed to list builds: ${error.response?.data?.message || error.message}`);
    }
  }

  async getLogs(buildId: string): Promise<string> {
    const client = this.authService.getAuthenticatedClient();
    
    try {
      const response = await client.get(`/v1/builds/${buildId}/logs`);
      return response.data.logs || '';
    } catch (error: any) {
      throw new Error(`Failed to get logs: ${error.response?.data?.message || error.message}`);
    }
  }

  async followLogs(buildId: string): Promise<void> {
    console.log(chalk.gray('Following logs... Press Ctrl+C to stop'));
    
    // Simple polling implementation for log following
    let lastLogLength = 0;
    
    const pollLogs = async () => {
      try {
        const logs = await this.getLogs(buildId);
        const newLogs = logs.slice(lastLogLength);
        
        if (newLogs) {
          process.stdout.write(newLogs);
          lastLogLength = logs.length;
        }
        
        // Check if build is still running
        const build = await this.getBuild(buildId);
        if (build.status === 'building') {
          setTimeout(pollLogs, 2000); // Poll every 2 seconds
        } else {
          console.log(chalk.gray(`\nBuild finished with status: ${build.status}`));
        }
      } catch (error: any) {
        console.log(chalk.red(`Error following logs: ${error.message}`));
      }
    };

    pollLogs();
    
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\n👋 Stopped following logs.'));
      process.exit(0);
    });
  }

  async downloadBuild(buildId: string, outputPath: string): Promise<void> {
    const client = this.authService.getAuthenticatedClient();
    
    try {
      const response = await client.get(`/v1/builds/${buildId}/download`, {
        responseType: 'stream'
      });
      
      // Ensure output directory exists
      if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
      }
      
      const filename = `build-${buildId}.zip`;
      const filePath = path.join(outputPath, filename);
      const writer = fs.createWriteStream(filePath);
      
      response.data.pipe(writer);
      
      return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
    } catch (error: any) {
      throw new Error(`Failed to download build: ${error.response?.data?.message || error.message}`);
    }
  }

  private async uploadProject(gameId: string): Promise<void> {
    // In a real implementation, this would:
    // 1. Create a zip of the project files
    // 2. Upload to the GameBuild platform
    // 3. Return upload confirmation
    
    const projectFiles = this.getProjectFiles();
    
    if (projectFiles.length === 0) {
      throw new Error('No project files found to upload');
    }
    
    // Simulate upload process
    console.log(chalk.gray(`📤 Uploading ${projectFiles.length} files...`));
    
    // This would be replaced with actual upload logic
    return Promise.resolve();
  }

  private getProjectFiles(): string[] {
    const files: string[] = [];
    const includeDirs = ['src', 'assets'];
    const excludePatterns = [
      /node_modules/,
      /\.git/,
      /dist/,
      /build/,
      /\.DS_Store/,
      /Thumbs\.db/,
      /\.gamebuild\.json/
    ];
    
    const scanDirectory = (dir: string, basePath: string = ''): void => {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const relativePath = path.join(basePath, item);
        
        // Skip excluded patterns
        if (excludePatterns.some(pattern => pattern.test(relativePath))) {
          continue;
        }
        
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDirectory(fullPath, relativePath);
        } else {
          files.push(relativePath);
        }
      }
    };
    
    // Scan include directories
    for (const dir of includeDirs) {
      const fullDir = path.join(process.cwd(), dir);
      scanDirectory(fullDir, dir);
    }
    
    // Also include specific root files
    const rootFiles = ['package.json', 'index.html', 'README.md'];
    for (const file of rootFiles) {
      const fullPath = path.join(process.cwd(), file);
      if (fs.existsSync(fullPath)) {
        files.push(file);
      }
    }
    
    return files;
  }
}
