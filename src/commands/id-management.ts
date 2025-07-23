import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { BaseCommand } from './base';
import { IdManagementService } from '../services/id-management';
import { AuthService } from '../services/auth';

export class IdManagementCommand extends BaseCommand {
  private idService = new IdManagementService();
  private authService = new AuthService();

  register(program: Command): void {
    const idCmd = program
      .command('identity')
      .alias('id')
      .description('Web3 identity and wallet management commands');

    idCmd
      .command('create')
      .description('Create a new Web3 identity')
      .option('-t, --type <type>', 'Identity type (player, developer, guild)', 'player')
      .option('-w, --wallet <address>', 'Wallet address')
      .action(async (options) => {
        try {
          await this.createIdentity(options);
        } catch (error) {
          this.handleError(error);
        }
      });

    idCmd
      .command('link')
      .description('Link wallet to existing identity')
      .argument('<identityId>', 'Identity ID')
      .argument('<walletAddress>', 'Wallet address to link')
      .option('-n, --network <network>', 'Blockchain network', 'ethereum')
      .action(async (identityId, walletAddress, options) => {
        try {
          await this.linkWallet(identityId, walletAddress, options);
        } catch (error) {
          this.handleError(error);
        }
      });

    idCmd
      .command('verify')
      .description('Verify identity ownership')
      .argument('<identityId>', 'Identity ID')
      .option('-s, --signature <signature>', 'Verification signature')
      .action(async (identityId, options) => {
        try {
          await this.verifyIdentity(identityId, options);
        } catch (error) {
          this.handleError(error);
        }
      });

    idCmd
      .command('profile')
      .description('Manage identity profile')
      .argument('[identityId]', 'Identity ID (defaults to current user)')
      .option('-u, --update', 'Update profile')
      .action(async (identityId, options) => {
        try {
          await this.manageProfile(identityId, options);
        } catch (error) {
          this.handleError(error);
        }
      });

    idCmd
      .command('list')
      .description('List identities')
      .option('-t, --type <type>', 'Filter by identity type')
      .option('-f, --format <format>', 'Output format (table, json)', 'table')
      .action(async (options) => {
        try {
          await this.listIdentities(options);
        } catch (error) {
          this.handleError(error);
        }
      });

    idCmd
      .command('reputation')
      .description('View identity reputation and achievements')
      .argument('<identityId>', 'Identity ID')
      .action(async (identityId) => {
        try {
          await this.viewReputation(identityId);
        } catch (error) {
          this.handleError(error);
        }
      });

    idCmd
      .command('permissions')
      .description('Manage identity permissions')
      .argument('<identityId>', 'Identity ID')
      .option('-a, --add <permission>', 'Add permission')
      .option('-r, --remove <permission>', 'Remove permission')
      .option('-l, --list', 'List permissions')
      .action(async (identityId, options) => {
        try {
          await this.managePermissions(identityId, options);
        } catch (error) {
          this.handleError(error);
        }
      });
  }

  private async createIdentity(options: any): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      console.log(chalk.red('❌ Please login first: gamebuild auth login'));
      return;
    }

    console.log(chalk.blue('🆔 Creating Web3 Identity...'));

    let identityType = options.type;
    let walletAddress = options.wallet;
    let displayName, email;

    if (!walletAddress) {
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'identityType',
          message: 'Identity type:',
          when: !identityType,
          choices: [
            { name: '🎮 Player - Gaming identity for players', value: 'player' },
            { name: '👨‍💻 Developer - Developer identity', value: 'developer' },
            { name: '🏰 Guild - Guild/organization identity', value: 'guild' },
            { name: '🎯 Moderator - Community moderator', value: 'moderator' }
          ]
        },
        {
          type: 'input',
          name: 'walletAddress',
          message: 'Wallet address (or press Enter to generate):',
          validate: (input) => {
            if (!input) return true; // Allow empty for generation
            return /^0x[a-fA-F0-9]{40}$/.test(input) || 'Please enter a valid Ethereum address';
          }
        },
        {
          type: 'input',
          name: 'displayName',
          message: 'Display name:',
          validate: (input) => input.length > 0 || 'Display name is required'
        },
        {
          type: 'input',
          name: 'email',
          message: 'Email (optional):',
          validate: (input) => {
            if (!input) return true;
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input) || 'Please enter a valid email';
          }
        }
      ]);

      identityType = identityType || answers.identityType;
      walletAddress = answers.walletAddress;
      displayName = answers.displayName;
      email = answers.email;
    }

    const identity = await this.idService.createIdentity({
      type: identityType,
      walletAddress,
      displayName,
      email
    });

    console.log(chalk.green('✅ Identity created successfully!'));
    console.log(chalk.gray(`   Identity ID: ${identity.id}`));
    console.log(chalk.gray(`   Type: ${identity.type}`));
    console.log(chalk.gray(`   Wallet: ${identity.walletAddress}`));
    console.log(chalk.gray(`   Display Name: ${identity.displayName}`));
    
    if (!walletAddress) {
      console.log(chalk.yellow('🔐 New wallet generated! Please save your private key securely.'));
      console.log(chalk.red('⚠️  Private Key: ' + identity.privateKey));
    }
  }

  private async linkWallet(identityId: string, walletAddress: string, options: any): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      console.log(chalk.red('❌ Please login first: gamebuild auth login'));
      return;
    }

    console.log(chalk.blue('🔗 Linking wallet to identity...'));

    await this.idService.linkWallet(identityId, walletAddress, options.network);

    console.log(chalk.green('✅ Wallet linked successfully!'));
    console.log(chalk.gray(`   Identity: ${identityId}`));
    console.log(chalk.gray(`   Wallet: ${walletAddress}`));
    console.log(chalk.gray(`   Network: ${options.network}`));
  }

  private async verifyIdentity(identityId: string, options: any): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      console.log(chalk.red('❌ Please login first: gamebuild auth login'));
      return;
    }

    console.log(chalk.blue('✅ Verifying identity...'));

    let signature = options.signature;

    if (!signature) {
      const { providedSignature } = await inquirer.prompt([
        {
          type: 'input',
          name: 'providedSignature',
          message: 'Enter verification signature:',
          validate: (input) => input.length > 0 || 'Signature is required'
        }
      ]);
      signature = providedSignature;
    }

    const verification = await this.idService.verifyIdentity(identityId, signature);

    if (verification.verified) {
      console.log(chalk.green('✅ Identity verified successfully!'));
      console.log(chalk.gray(`   Verification Level: ${verification.level}`));
      console.log(chalk.gray(`   Trust Score: ${verification.trustScore}`));
    } else {
      console.log(chalk.red('❌ Identity verification failed'));
      console.log(chalk.gray(`   Reason: ${verification.reason}`));
    }
  }

  private async manageProfile(identityId: string, options: any): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      console.log(chalk.red('❌ Please login first: gamebuild auth login'));
      return;
    }

    if (options.update) {
      await this.updateProfile(identityId);
    } else {
      await this.viewProfile(identityId);
    }
  }

  private async viewProfile(identityId?: string): Promise<void> {
    const profile = await this.idService.getProfile(identityId);

    console.log(chalk.blue('👤 Identity Profile'));
    console.log();
    console.log(chalk.cyan(`Name: ${profile.displayName}`));
    console.log(chalk.gray(`ID: ${profile.id}`));
    console.log(chalk.gray(`Type: ${profile.type}`));
    console.log(chalk.gray(`Status: ${profile.status}`));
    console.log(chalk.gray(`Reputation: ${profile.reputation}/100`));
    console.log(chalk.gray(`Level: ${profile.level}`));
    console.log(chalk.gray(`Created: ${new Date(profile.createdAt).toLocaleDateString()}`));
    
    if (profile.achievements && profile.achievements.length > 0) {
      console.log(chalk.cyan('🏆 Achievements:'));
      profile.achievements.forEach((achievement: any) => {
        console.log(chalk.gray(`   • ${achievement.name} - ${achievement.description}`));
      });
    }

    if (profile.wallets && profile.wallets.length > 0) {
      console.log(chalk.cyan('💼 Linked Wallets:'));
      profile.wallets.forEach((wallet: any) => {
        console.log(chalk.gray(`   • ${wallet.address} (${wallet.network})`));
      });
    }
  }

  private async updateProfile(identityId?: string): Promise<void> {
    const currentProfile = await this.idService.getProfile(identityId);

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'displayName',
        message: 'Display name:',
        default: currentProfile.displayName
      },
      {
        type: 'input',
        name: 'bio',
        message: 'Bio:',
        default: currentProfile.bio
      },
      {
        type: 'input',
        name: 'avatar',
        message: 'Avatar URL:',
        default: currentProfile.avatar
      }
    ]);

    await this.idService.updateProfile(identityId, answers);

    console.log(chalk.green('✅ Profile updated successfully!'));
  }

  private async listIdentities(options: any): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      console.log(chalk.red('❌ Please login first: gamebuild auth login'));
      return;
    }

    const identities = await this.idService.listIdentities(options.type);

    if (options.format === 'json') {
      console.log(JSON.stringify(identities, null, 2));
      return;
    }

    if (identities.length === 0) {
      console.log(chalk.yellow('📝 No identities found.'));
      return;
    }

    console.log(chalk.blue('🆔 Identities:'));
    console.log();

    identities.forEach((identity: any, index: number) => {
      console.log(chalk.cyan(`${index + 1}. ${identity.displayName}`));
      console.log(chalk.gray(`   ID: ${identity.id}`));
      console.log(chalk.gray(`   Type: ${identity.type}`));
      console.log(chalk.gray(`   Status: ${identity.status}`));
      console.log(chalk.gray(`   Reputation: ${identity.reputation}/100`));
      console.log();
    });
  }

  private async viewReputation(identityId: string): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      console.log(chalk.red('❌ Please login first: gamebuild auth login'));
      return;
    }

    const reputation = await this.idService.getReputation(identityId);

    console.log(chalk.blue('🌟 Identity Reputation'));
    console.log();
    console.log(chalk.cyan(`Overall Score: ${reputation.score}/100`));
    console.log(chalk.gray(`Level: ${reputation.level}`));
    console.log(chalk.gray(`Rank: ${reputation.rank}`));
    console.log();

    if (reputation.metrics) {
      console.log(chalk.cyan('📊 Metrics:'));
      Object.entries(reputation.metrics).forEach(([key, value]) => {
        console.log(chalk.gray(`   ${key}: ${value}`));
      });
      console.log();
    }

    if (reputation.achievements && reputation.achievements.length > 0) {
      console.log(chalk.cyan('🏆 Achievements:'));
      reputation.achievements.forEach((achievement: any) => {
        console.log(chalk.gray(`   • ${achievement.name} (+${achievement.points} points)`));
      });
    }
  }

  private async managePermissions(identityId: string, options: any): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      console.log(chalk.red('❌ Please login first: gamebuild auth login'));
      return;
    }

    if (options.add) {
      await this.idService.addPermission(identityId, options.add);
      console.log(chalk.green(`✅ Permission "${options.add}" added`));
    } else if (options.remove) {
      await this.idService.removePermission(identityId, options.remove);
      console.log(chalk.green(`✅ Permission "${options.remove}" removed`));
    } else {
      const permissions = await this.idService.getPermissions(identityId);
      
      console.log(chalk.blue('🔐 Identity Permissions:'));
      console.log();
      
      if (permissions.length === 0) {
        console.log(chalk.yellow('📝 No permissions assigned.'));
      } else {
        permissions.forEach((permission: string) => {
          console.log(chalk.gray(`   • ${permission}`));
        });
      }
    }
  }
}
