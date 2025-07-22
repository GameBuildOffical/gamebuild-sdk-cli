import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface Config {
  auth?: {
    token?: string;
    baseUrl?: string;
  };
  project?: {
    name?: string;
    id?: string;
    buildPath?: string;
    platform?: string;
  };
  [key: string]: any;
}

export class ConfigService {
  private configPath: string;
  private config: Config = {};

  constructor() {
    const homeDir = os.homedir();
    const configDir = path.join(homeDir, '.gamebuild');
    this.configPath = path.join(configDir, 'config.json');
    
    // Ensure config directory exists
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const content = fs.readFileSync(this.configPath, 'utf8');
        this.config = JSON.parse(content);
      }
    } catch (error) {
      // If config is corrupted, start fresh
      this.config = {};
    }
  }

  save(): void {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error: any) {
      throw new Error(`Failed to save config: ${error.message}`);
    }
  }

  get(key: string): any {
    const keys = key.split('.');
    let value = this.config;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  set(key: string, value: any): void {
    const keys = key.split('.');
    let current = this.config;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!current[k] || typeof current[k] !== 'object') {
        current[k] = {};
      }
      current = current[k];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  delete(key: string): void {
    const keys = key.split('.');
    let current = this.config;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!current[k] || typeof current[k] !== 'object') {
        return; // Key doesn't exist
      }
      current = current[k];
    }
    
    delete current[keys[keys.length - 1]];
  }

  getAll(): Config {
    return { ...this.config };
  }

  clear(): void {
    this.config = {};
  }
}
