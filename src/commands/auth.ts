import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { BaseCommand } from './base';
import { AuthService } from '../services/auth';
import { ConfigService } from '../services/config';

export class AuthCommand extends BaseCommand {
  private authService = new AuthService();
  private configService = new ConfigService();

  register(program: Command): void {
    const authCmd = program
      .command('auth')
      .description('Authentication commands');

    authCmd
      .command('login')
      .description('Login to GameBuild platform')
      .option('-t, --token <token>', 'API token')
      .option('-u, --url <url>', 'API base URL')
      .action(async (options) => {
        try {
          await this.login(options);
        } catch (error) {
          this.handleError(error);
        }
      });

    authCmd
      .command('logout')
      .description('Logout from GameBuild platform')
      .action(async () => {
        try {
          await this.logout();
        } catch (error) {
          this.handleError(error);
        }
      });

    authCmd
      .command('status')
      .description('Check authentication status')
      .action(async () => {
        try {
          await this.status();
        } catch (error) {
          this.handleError(error);
        }
      });
  }

  private async login(options: any): Promise<void> {
    console.log(chalk.blue('🔐 GameBuild Authentication'));
    
    let token = options.token;
    let baseUrl = options.url || 'https://api.gamebuild.com';

    if (!token) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'token',
          message: 'Enter your GameBuild API token:',
          validate: (input) => input.length > 0 || 'Token is required'
        },
        {
          type: 'input',
          name: 'baseUrl',
          message: 'API Base URL:',
          default: 'https://api.gamebuild.com'
        }
      ]);
      
      token = answers.token;
      baseUrl = answers.baseUrl;
    }

    // Validate token
    const isValid = await this.authService.validateToken(token, baseUrl);
    
    if (isValid) {
      // Save credentials
      this.configService.set('auth.token', token);
      this.configService.set('auth.baseUrl', baseUrl);
      this.configService.save();
      
      console.log(chalk.green('✅ Successfully authenticated!'));
    } else {
      console.log(chalk.red('❌ Authentication failed. Please check your token.'));
      process.exit(1);
    }
  }

  private async logout(): Promise<void> {
    this.configService.delete('auth.token');
    this.configService.delete('auth.baseUrl');
    this.configService.save();
    
    console.log(chalk.green('✅ Successfully logged out!'));
  }

  private async status(): Promise<void> {
    const token = this.configService.get('auth.token');
    const baseUrl = this.configService.get('auth.baseUrl');
    
    if (!token) {
      console.log(chalk.yellow('⚠️  Not authenticated. Run "gamebuild auth login" to get started.'));
      return;
    }

    const isValid = await this.authService.validateToken(token, baseUrl);
    
    if (isValid) {
      const userInfo = await this.authService.getUserInfo();
      console.log(chalk.green('✅ Authenticated'));
      console.log(chalk.gray(`   User: ${userInfo.username || 'Unknown'}`));
      console.log(chalk.gray(`   API URL: ${baseUrl}`));
    } else {
      console.log(chalk.red('❌ Token is invalid or expired. Please login again.'));
    }
  }
}
