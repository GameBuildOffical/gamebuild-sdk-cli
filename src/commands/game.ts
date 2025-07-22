import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { BaseCommand } from './base';
import { GameService } from '../services/game';
import { AuthService } from '../services/auth';

export class GameCommand extends BaseCommand {
  private gameService = new GameService();
  private authService = new AuthService();

  register(program: Command): void {
    const gameCmd = program
      .command('game')
      .description('Game management commands');

    gameCmd
      .command('create')
      .description('Create a new game project')
      .option('-n, --name <name>', 'Game name')
      .option('-p, --platform <platform>', 'Target platform (web, mobile, desktop)')
      .option('-t, --template <template>', 'Project template')
      .action(async (options) => {
        try {
          await this.create(options);
        } catch (error) {
          this.handleError(error);
        }
      });

    gameCmd
      .command('list')
      .description('List all your games')
      .option('-f, --format <format>', 'Output format (table, json)', 'table')
      .action(async (options) => {
        try {
          await this.list(options);
        } catch (error) {
          this.handleError(error);
        }
      });

    gameCmd
      .command('info')
      .description('Get information about a game')
      .argument('<gameId>', 'Game ID or name')
      .action(async (gameId) => {
        try {
          await this.info(gameId);
        } catch (error) {
          this.handleError(error);
        }
      });

    gameCmd
      .command('delete')
      .description('Delete a game')
      .argument('<gameId>', 'Game ID or name')
      .option('-f, --force', 'Force deletion without confirmation')
      .action(async (gameId, options) => {
        try {
          await this.delete(gameId, options);
        } catch (error) {
          this.handleError(error);
        }
      });

    gameCmd
      .command('init')
      .description('Initialize current directory as a GameBuild project')
      .option('-g, --game-id <gameId>', 'Existing game ID to link')
      .action(async (options) => {
        try {
          await this.init(options);
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

    console.log(chalk.blue('🎮 Creating new game project...'));

    let name = options.name;
    let platform = options.platform;
    let template = options.template;

    if (!name || !platform) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Game name:',
          when: !name,
          validate: (input) => input.length > 0 || 'Game name is required'
        },
        {
          type: 'list',
          name: 'platform',
          message: 'Target platform:',
          when: !platform,
          choices: [
            { name: '🌐 Web (HTML5)', value: 'web' },
            { name: '📱 Mobile (iOS/Android)', value: 'mobile' },
            { name: '💻 Desktop (Windows/Mac/Linux)', value: 'desktop' },
            { name: '🎮 Console', value: 'console' }
          ]
        },
        {
          type: 'list',
          name: 'template',
          message: 'Project template:',
          when: !template,
          choices: [
            { name: '🎯 Basic Game Template', value: 'basic' },
            { name: '🏃 Platformer Template', value: 'platformer' },
            { name: '🚗 Racing Game Template', value: 'racing' },
            { name: '🧩 Puzzle Game Template', value: 'puzzle' },
            { name: '⚔️ RPG Template', value: 'rpg' },
            { name: '📄 Empty Project', value: 'empty' }
          ]
        }
      ]);

      name = name || answers.name;
      platform = platform || answers.platform;
      template = template || answers.template;
    }

    const game = await this.gameService.createGame({
      name,
      platform,
      template
    });

    console.log(chalk.green('✅ Game created successfully!'));
    console.log(chalk.gray(`   Game ID: ${game.id}`));
    console.log(chalk.gray(`   Name: ${game.name}`));
    console.log(chalk.gray(`   Platform: ${game.platform}`));
    console.log(chalk.gray(`   Dashboard: ${game.dashboardUrl}`));
  }

  private async list(options: any): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      console.log(chalk.red('❌ Please login first: gamebuild auth login'));
      return;
    }

    const games = await this.gameService.listGames();

    if (options.format === 'json') {
      console.log(JSON.stringify(games, null, 2));
      return;
    }

    if (games.length === 0) {
      console.log(chalk.yellow('📝 No games found. Create your first game with "gamebuild game create"'));
      return;
    }

    console.log(chalk.blue('🎮 Your Games:'));
    console.log();

    games.forEach((game, index) => {
      console.log(chalk.cyan(`${index + 1}. ${game.name}`));
      console.log(chalk.gray(`   ID: ${game.id}`));
      console.log(chalk.gray(`   Platform: ${game.platform}`));
      console.log(chalk.gray(`   Status: ${game.status}`));
      console.log(chalk.gray(`   Created: ${new Date(game.createdAt).toLocaleDateString()}`));
      console.log();
    });
  }

  private async info(gameId: string): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      console.log(chalk.red('❌ Please login first: gamebuild auth login'));
      return;
    }

    const game = await this.gameService.getGame(gameId);

    console.log(chalk.blue(`🎮 Game Information`));
    console.log();
    console.log(chalk.cyan(`Name: ${game.name}`));
    console.log(chalk.gray(`ID: ${game.id}`));
    console.log(chalk.gray(`Platform: ${game.platform}`));
    console.log(chalk.gray(`Status: ${game.status}`));
    console.log(chalk.gray(`Template: ${game.template}`));
    console.log(chalk.gray(`Created: ${new Date(game.createdAt).toLocaleDateString()}`));
    console.log(chalk.gray(`Last Build: ${game.lastBuild ? new Date(game.lastBuild).toLocaleDateString() : 'Never'}`));
    console.log(chalk.gray(`Dashboard: ${game.dashboardUrl}`));
  }

  private async delete(gameId: string, options: any): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      console.log(chalk.red('❌ Please login first: gamebuild auth login'));
      return;
    }

    if (!options.force) {
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `Are you sure you want to delete game "${gameId}"? This action cannot be undone.`,
          default: false
        }
      ]);

      if (!confirm) {
        console.log(chalk.yellow('Operation cancelled.'));
        return;
      }
    }

    await this.gameService.deleteGame(gameId);
    console.log(chalk.green('✅ Game deleted successfully!'));
  }

  private async init(options: any): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      console.log(chalk.red('❌ Please login first: gamebuild auth login'));
      return;
    }

    console.log(chalk.blue('🚀 Initializing GameBuild project...'));

    let gameId = options.gameId;

    if (!gameId) {
      const games = await this.gameService.listGames();
      
      if (games.length === 0) {
        console.log(chalk.yellow('No games found. Create a game first with "gamebuild game create"'));
        return;
      }

      const { selectedGame } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedGame',
          message: 'Select a game to link:',
          choices: games.map(game => ({
            name: `${game.name} (${game.platform})`,
            value: game.id
          }))
        }
      ]);

      gameId = selectedGame;
    }

    await this.gameService.initProject(gameId);
    console.log(chalk.green('✅ Project initialized successfully!'));
    console.log(chalk.gray('   Run "gamebuild build" to start building your game.'));
  }
}
