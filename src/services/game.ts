import { AuthService } from './auth';
import { ConfigService } from './config';
import * as fs from 'fs';
import * as path from 'path';

export interface Game {
  id: string;
  name: string;
  platform: string;
  template: string;
  status: string;
  createdAt: string;
  lastBuild?: string;
  dashboardUrl: string;
}

export interface CreateGameOptions {
  name: string;
  platform: string;
  template: string;
}

export class GameService {
  private authService = new AuthService();
  private configService = new ConfigService();

  async createGame(options: CreateGameOptions): Promise<Game> {
    const client = this.authService.getAuthenticatedClient();
    
    try {
      const response = await client.post('/v1/games', {
        name: options.name,
        platform: options.platform,
        template: options.template
      });
      
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to create game: ${error.response?.data?.message || error.message}`);
    }
  }

  async listGames(): Promise<Game[]> {
    const client = this.authService.getAuthenticatedClient();
    
    try {
      const response = await client.get('/v1/games');
      return response.data.games || [];
    } catch (error: any) {
      throw new Error(`Failed to list games: ${error.response?.data?.message || error.message}`);
    }
  }

  async getGame(gameId: string): Promise<Game> {
    const client = this.authService.getAuthenticatedClient();
    
    try {
      const response = await client.get(`/v1/games/${gameId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get game: ${error.response?.data?.message || error.message}`);
    }
  }

  async deleteGame(gameId: string): Promise<void> {
    const client = this.authService.getAuthenticatedClient();
    
    try {
      await client.delete(`/v1/games/${gameId}`);
    } catch (error: any) {
      throw new Error(`Failed to delete game: ${error.response?.data?.message || error.message}`);
    }
  }

  async initProject(gameId: string): Promise<void> {
    // Create local project configuration
    const projectConfig = {
      gameId,
      createdAt: new Date().toISOString(),
      buildPath: './dist',
      platform: 'web' // Will be updated from server
    };

    // Save to local project config
    const configPath = path.join(process.cwd(), '.gamebuild.json');
    fs.writeFileSync(configPath, JSON.stringify(projectConfig, null, 2));

    // Update global config
    this.configService.set('project.gameId', gameId);
    this.configService.set('project.name', gameId);
    this.configService.save();

    // Create basic project structure if it doesn't exist
    const directories = ['src', 'assets', 'dist'];
    for (const dir of directories) {
      const dirPath = path.join(process.cwd(), dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    }

    // Create basic files
    this.createBasicProjectFiles();
  }

  private createBasicProjectFiles(): void {
    const files = [
      {
        path: 'src/index.js',
        content: `// GameBuild Project Entry Point
console.log('Welcome to GameBuild!');

// Your game code goes here
function startGame() {
    console.log('Game started!');
}

startGame();
`
      },
      {
        path: 'assets/README.md',
        content: `# Assets Directory

Place your game assets here:
- Images (PNG, JPG, SVG)
- Audio files (MP3, WAV, OGG)
- Fonts (TTF, OTF, WOFF)
- Other resources

## Organization
- \`images/\` - Sprites, backgrounds, UI elements
- \`audio/\` - Sound effects and music
- \`fonts/\` - Custom fonts
- \`data/\` - JSON files, configs, levels
`
      },
      {
        path: '.gitignore',
        content: `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build outputs
dist/
build/
*.tgz

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# GameBuild
.gamebuild.json
.gamebuild/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
`
      }
    ];

    for (const file of files) {
      const filePath = path.join(process.cwd(), file.path);
      const dir = path.dirname(filePath);
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, file.content);
      }
    }
  }

  getLocalProject(): any {
    const configPath = path.join(process.cwd(), '.gamebuild.json');
    
    if (fs.existsSync(configPath)) {
      try {
        const content = fs.readFileSync(configPath, 'utf8');
        return JSON.parse(content);
      } catch (error) {
        return null;
      }
    }
    
    return null;
  }
}
