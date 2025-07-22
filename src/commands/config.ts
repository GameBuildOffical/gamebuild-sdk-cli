import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { BaseCommand } from './base';
import { ConfigService } from '../services/config';

export class ConfigCommand extends BaseCommand {
  private configService = new ConfigService();

  register(program: Command): void {
    const configCmd = program
      .command('config')
      .description('Configuration management commands');

    configCmd
      .command('set')
      .description('Set a configuration value')
      .argument('<key>', 'Configuration key (e.g., auth.baseUrl)')
      .argument('<value>', 'Configuration value')
      .action(async (key, value) => {
        try {
          await this.set(key, value);
        } catch (error) {
          this.handleError(error);
        }
      });

    configCmd
      .command('get')
      .description('Get a configuration value')
      .argument('<key>', 'Configuration key')
      .action(async (key) => {
        try {
          await this.get(key);
        } catch (error) {
          this.handleError(error);
        }
      });

    configCmd
      .command('list')
      .description('List all configuration values')
      .option('-f, --format <format>', 'Output format (table, json)', 'table')
      .action(async (options) => {
        try {
          await this.list(options);
        } catch (error) {
          this.handleError(error);
        }
      });

    configCmd
      .command('delete')
      .description('Delete a configuration value')
      .argument('<key>', 'Configuration key')
      .option('-f, --force', 'Force deletion without confirmation')
      .action(async (key, options) => {
        try {
          await this.delete(key, options);
        } catch (error) {
          this.handleError(error);
        }
      });

    configCmd
      .command('reset')
      .description('Reset all configuration to defaults')
      .option('-f, --force', 'Force reset without confirmation')
      .action(async (options) => {
        try {
          await this.reset(options);
        } catch (error) {
          this.handleError(error);
        }
      });

    configCmd
      .command('edit')
      .description('Open configuration file in default editor')
      .action(async () => {
        try {
          await this.edit();
        } catch (error) {
          this.handleError(error);
        }
      });
  }

  private async set(key: string, value: string): Promise<void> {
    // Try to parse as JSON for complex values
    let parsedValue: any = value;
    
    if (value.toLowerCase() === 'true') {
      parsedValue = true;
    } else if (value.toLowerCase() === 'false') {
      parsedValue = false;
    } else if (!isNaN(Number(value))) {
      parsedValue = Number(value);
    } else if (value.startsWith('{') || value.startsWith('[')) {
      try {
        parsedValue = JSON.parse(value);
      } catch {
        // Keep as string if not valid JSON
      }
    }

    this.configService.set(key, parsedValue);
    this.configService.save();

    console.log(chalk.green('✅ Configuration updated!'));
    console.log(chalk.gray(`   ${key} = ${JSON.stringify(parsedValue)}`));
  }

  private async get(key: string): Promise<void> {
    const value = this.configService.get(key);

    if (value === undefined) {
      console.log(chalk.yellow(`⚠️  Configuration key "${key}" not found.`));
      return;
    }

    console.log(chalk.cyan(key));
    console.log(chalk.gray(JSON.stringify(value, null, 2)));
  }

  private async list(options: any): Promise<void> {
    const config = this.configService.getAll();

    if (options.format === 'json') {
      console.log(JSON.stringify(config, null, 2));
      return;
    }

    if (Object.keys(config).length === 0) {
      console.log(chalk.yellow('📝 No configuration found.'));
      return;
    }

    console.log(chalk.blue('⚙️  Configuration:'));
    console.log();

    this.printConfigObject(config);
  }

  private printConfigObject(obj: any, prefix = ''): void {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        console.log(chalk.cyan(`${fullKey}:`));
        this.printConfigObject(value, fullKey);
      } else {
        // Mask sensitive values
        const displayValue = this.maskSensitiveValue(fullKey, value);
        console.log(chalk.gray(`  ${fullKey} = ${JSON.stringify(displayValue)}`));
      }
    }
  }

  private maskSensitiveValue(key: string, value: any): any {
    const sensitiveKeys = ['token', 'password', 'secret', 'key', 'apiKey'];
    
    if (typeof value === 'string' && sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      return value.length > 8 ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}` : '***';
    }
    
    return value;
  }

  private async delete(key: string, options: any): Promise<void> {
    const currentValue = this.configService.get(key);
    
    if (currentValue === undefined) {
      console.log(chalk.yellow(`⚠️  Configuration key "${key}" not found.`));
      return;
    }

    if (!options.force) {
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `Are you sure you want to delete "${key}"?`,
          default: false
        }
      ]);

      if (!confirm) {
        console.log(chalk.yellow('Operation cancelled.'));
        return;
      }
    }

    this.configService.delete(key);
    this.configService.save();

    console.log(chalk.green('✅ Configuration key deleted!'));
  }

  private async reset(options: any): Promise<void> {
    if (!options.force) {
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Are you sure you want to reset all configuration? This will remove all saved settings including authentication.',
          default: false
        }
      ]);

      if (!confirm) {
        console.log(chalk.yellow('Operation cancelled.'));
        return;
      }
    }

    this.configService.clear();
    this.configService.save();

    console.log(chalk.green('✅ Configuration reset to defaults!'));
    console.log(chalk.gray('   You will need to login again: gamebuild auth login'));
  }

  private async edit(): Promise<void> {
    const { spawn } = require('child_process');
    const os = require('os');
    const path = require('path');

    const configPath = path.join(os.homedir(), '.gamebuild', 'config.json');
    
    // Determine editor
    const editor = process.env.EDITOR || process.env.VISUAL || (process.platform === 'win32' ? 'notepad' : 'nano');

    console.log(chalk.blue(`📝 Opening configuration file in ${editor}...`));
    console.log(chalk.gray(`   File: ${configPath}`));

    const child = spawn(editor, [configPath], {
      stdio: 'inherit'
    });

    child.on('exit', (code) => {
      if (code === 0) {
        console.log(chalk.green('✅ Configuration file saved!'));
        // Reload configuration
        this.configService = new ConfigService();
      } else {
        console.log(chalk.red('❌ Editor closed with error.'));
      }
    });

    child.on('error', (error) => {
      console.log(chalk.red(`❌ Failed to open editor: ${error.message}`));
      console.log(chalk.gray(`   Try setting the EDITOR environment variable to your preferred editor.`));
      console.log(chalk.gray(`   Example: export EDITOR=code  # for VS Code`));
    });
  }
}
