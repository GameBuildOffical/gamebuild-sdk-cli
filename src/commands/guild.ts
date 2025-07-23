import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { BaseCommand } from './base';
import { GuildService } from '../services/guild';
import { AuthService } from '../services/auth';

export class GuildCommand extends BaseCommand {
  private guildService = new GuildService();
  private authService = new AuthService();

  register(program: Command): void {
    const guildCmd = program
      .command('guild')
      .description('Guild management commands');

    guildCmd
      .command('create')
      .description('Create a new guild')
      .option('-n, --name <name>', 'Guild name')
      .option('-d, --description <desc>', 'Guild description')
      .action(async (options) => {
        try {
          await this.create(options);
        } catch (error) {
          this.handleError(error);
        }
      });

    guildCmd
      .command('list')
      .description('List all guilds')
      .option('-f, --format <format>', 'Output format (table, json)', 'table')
      .action(async (options) => {
        try {
          await this.list(options);
        } catch (error) {
          this.handleError(error);
        }
      });

    guildCmd
      .command('info')
      .description('Get information about a guild')
      .argument('<guildId>', 'Guild ID or name')
      .action(async (guildId) => {
        try {
          await this.info(guildId);
        } catch (error) {
          this.handleError(error);
        }
      });

    guildCmd
      .command('join')
      .description('Join a guild')
      .argument('<guildId>', 'Guild ID or name')
      .action(async (guildId) => {
        try {
          await this.join(guildId);
        } catch (error) {
          this.handleError(error);
        }
      });

    guildCmd
      .command('leave')
      .description('Leave a guild')
      .argument('<guildId>', 'Guild ID or name')
      .action(async (guildId) => {
        try {
          await this.leave(guildId);
        } catch (error) {
          this.handleError(error);
        }
      });
  }

  private async create(options: any): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      console.log(chalk.red('❌ Please login first: gamebuild auth login'));
      return;
    }
    let name = options.name;
    let description = options.description;
    if (!name) {
      const answers = await inquirer.prompt([
        { type: 'input', name: 'name', message: 'Guild name:', validate: (input) => input.length > 0 || 'Guild name is required' },
        { type: 'input', name: 'description', message: 'Guild description:' }
      ]);
      name = answers.name;
      description = answers.description;
    }
    const guild = await this.guildService.createGuild({ name, description });
    console.log(chalk.green('✅ Guild created successfully!'));
    console.log(chalk.gray(`   Guild ID: ${guild.id}`));
    console.log(chalk.gray(`   Name: ${guild.name}`));
    console.log(chalk.gray(`   Description: ${guild.description}`));
  }

  private async list(options: any): Promise<void> {
    const guilds = await this.guildService.listGuilds();
    if (options.format === 'json') {
      console.log(JSON.stringify(guilds, null, 2));
      return;
    }
    if (guilds.length === 0) {
      console.log(chalk.yellow('📝 No guilds found.'));
      return;
    }
    console.log(chalk.blue('🏰 Guilds:'));
    guilds.forEach((guild: any, index: number) => {
      console.log(chalk.cyan(`${index + 1}. ${guild.name}`));
      console.log(chalk.gray(`   ID: ${guild.id}`));
      console.log(chalk.gray(`   Description: ${guild.description}`));
      console.log();
    });
  }

  private async info(guildId: string): Promise<void> {
    const guild = await this.guildService.getGuild(guildId);
    console.log(chalk.blue('🏰 Guild Information'));
    console.log(chalk.cyan(`Name: ${guild.name}`));
    console.log(chalk.gray(`ID: ${guild.id}`));
    console.log(chalk.gray(`Description: ${guild.description}`));
    console.log(chalk.gray(`Members: ${guild.members.length}`));
    if (guild.members.length > 0) {
      console.log(chalk.cyan('Members:'));
      guild.members.forEach((member: any) => {
        console.log(chalk.gray(`   • ${member.displayName} (${member.id})`));
      });
    }
  }

  private async join(guildId: string): Promise<void> {
    await this.guildService.joinGuild(guildId);
    console.log(chalk.green('✅ Joined guild successfully!'));
  }

  private async leave(guildId: string): Promise<void> {
    await this.guildService.leaveGuild(guildId);
    console.log(chalk.green('✅ Left guild successfully!'));
  }
}
