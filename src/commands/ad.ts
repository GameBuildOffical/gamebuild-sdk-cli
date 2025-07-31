import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { BaseCommand } from './base';
import { AdService } from '../services/ad';
import { AuthService } from '../services/auth';

export class AdCommand extends BaseCommand {
  private adService = new AdService();
  private authService = new AuthService();

  register(program: Command): void {
    const adCmd = program
      .command('ad')
      .description('Advertisement management commands');

    adCmd
      .command('create')
      .description('Create a new advertisement campaign')
      .option('-n, --name <name>', 'Campaign name')
      .option('-t, --type <type>', 'Ad type (banner, video, interstitial, rewarded)')
      .option('-b, --budget <budget>', 'Campaign budget')
      .action(async (options) => {
        try {
          await this.create(options);
        } catch (error) {
          this.handleError(error);
        }
      });

    adCmd
      .command('list')
      .description('List all advertisement campaigns')
      .option('-f, --format <format>', 'Output format (table, json)', 'table')
      .option('-s, --status <status>', 'Filter by status (active, paused, completed)')
      .action(async (options) => {
        try {
          await this.list(options);
        } catch (error) {
          this.handleError(error);
        }
      });

    adCmd
      .command('info')
      .description('Get information about an advertisement campaign')
      .argument('<campaignId>', 'Campaign ID')
      .action(async (campaignId) => {
        try {
          await this.info(campaignId);
        } catch (error) {
          this.handleError(error);
        }
      });

    adCmd
      .command('start')
      .description('Start an advertisement campaign')
      .argument('<campaignId>', 'Campaign ID')
      .action(async (campaignId) => {
        try {
          await this.start(campaignId);
        } catch (error) {
          this.handleError(error);
        }
      });

    adCmd
      .command('pause')
      .description('Pause an advertisement campaign')
      .argument('<campaignId>', 'Campaign ID')
      .action(async (campaignId) => {
        try {
          await this.pause(campaignId);
        } catch (error) {
          this.handleError(error);
        }
      });

    adCmd
      .command('stats')
      .description('View campaign statistics')
      .argument('<campaignId>', 'Campaign ID')
      .option('-p, --period <period>', 'Time period (day, week, month)', 'week')
      .action(async (campaignId, options) => {
        try {
          await this.stats(campaignId, options);
        } catch (error) {
          this.handleError(error);
        }
      });

    adCmd
      .command('placements')
      .description('Manage ad placements')
      .option('-l, --list', 'List available placements')
      .option('-c, --create', 'Create new placement')
      .action(async (options) => {
        try {
          await this.managePlacements(options);
        } catch (error) {
          this.handleError(error);
        }
      });

    adCmd
      .command('revenue')
      .description('View advertisement revenue')
      .option('-p, --period <period>', 'Time period (day, week, month)', 'month')
      .option('-g, --game <gameId>', 'Filter by game ID')
      .action(async (options) => {
        try {
          await this.revenue(options);
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

    console.log(chalk.blue('📢 Creating Advertisement Campaign...'));

    let name = options.name;
    let type = options.type;
    let budget = options.budget;
    let targetAudience, duration;

    if (!name || !type || !budget) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Campaign name:',
          when: !name,
          validate: (input) => input.length > 0 || 'Campaign name is required'
        },
        {
          type: 'list',
          name: 'type',
          message: 'Advertisement type:',
          when: !type,
          choices: [
            { name: '🖼️  Banner - Display banner ads', value: 'banner' },
            { name: '🎬 Video - Video advertisements', value: 'video' },
            { name: '📱 Interstitial - Full-screen ads', value: 'interstitial' },
            { name: '🎁 Rewarded - Reward-based ads', value: 'rewarded' }
          ]
        },
        {
          type: 'number',
          name: 'budget',
          message: 'Campaign budget (USD):',
          when: !budget,
          validate: (input) => (input && input > 0) || 'Budget must be greater than 0'
        },
        {
          type: 'input',
          name: 'targetAudience',
          message: 'Target audience (optional):'
        },
        {
          type: 'list',
          name: 'duration',
          message: 'Campaign duration:',
          choices: [
            { name: '1 week', value: 7 },
            { name: '2 weeks', value: 14 },
            { name: '1 month', value: 30 },
            { name: '3 months', value: 90 },
            { name: 'Custom', value: 'custom' }
          ]
        }
      ]);

      name = name || answers.name;
      type = type || answers.type;
      budget = budget || answers.budget;
      targetAudience = answers.targetAudience;
      duration = answers.duration;
    }

    const campaign = await this.adService.createCampaign({
      name,
      type,
      budget,
      targetAudience,
      duration
    });

    console.log(chalk.green('✅ Advertisement campaign created successfully!'));
    console.log(chalk.gray(`   Campaign ID: ${campaign.id}`));
    console.log(chalk.gray(`   Name: ${campaign.name}`));
    console.log(chalk.gray(`   Type: ${campaign.type}`));
    console.log(chalk.gray(`   Budget: $${campaign.budget}`));
    console.log(chalk.gray(`   Status: ${campaign.status}`));
  }

  private async list(options: any): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      console.log(chalk.red('❌ Please login first: gamebuild auth login'));
      return;
    }

    const campaigns = await this.adService.listCampaigns(options.status);

    if (options.format === 'json') {
      console.log(JSON.stringify(campaigns, null, 2));
      return;
    }

    if (campaigns.length === 0) {
      console.log(chalk.yellow('📝 No advertisement campaigns found.'));
      return;
    }

    console.log(chalk.blue('📢 Advertisement Campaigns:'));
    console.log();

    campaigns.forEach((campaign: any, index: number) => {
      const statusIcon = this.getStatusIcon(campaign.status);
      console.log(chalk.cyan(`${index + 1}. ${campaign.name}`));
      console.log(chalk.gray(`   ID: ${campaign.id}`));
      console.log(chalk.gray(`   Type: ${campaign.type}`));
      console.log(chalk.gray(`   Budget: $${campaign.budget}`));
      console.log(chalk.gray(`   Status: ${statusIcon} ${campaign.status}`));
      console.log(chalk.gray(`   Impressions: ${campaign.impressions || 0}`));
      console.log(chalk.gray(`   Clicks: ${campaign.clicks || 0}`));
      console.log();
    });
  }

  private async info(campaignId: string): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      console.log(chalk.red('❌ Please login first: gamebuild auth login'));
      return;
    }

    const campaign = await this.adService.getCampaign(campaignId);

    console.log(chalk.blue('📢 Campaign Information'));
    console.log();
    console.log(chalk.cyan(`Name: ${campaign.name}`));
    console.log(chalk.gray(`ID: ${campaign.id}`));
    console.log(chalk.gray(`Type: ${campaign.type}`));
    console.log(chalk.gray(`Budget: $${campaign.budget}`));
    console.log(chalk.gray(`Spent: $${campaign.spent || 0}`));
    console.log(chalk.gray(`Status: ${this.getStatusIcon(campaign.status)} ${campaign.status}`));
    console.log(chalk.gray(`Created: ${new Date(campaign.createdAt).toLocaleDateString()}`));
    
    if (campaign.targetAudience) {
      console.log(chalk.gray(`Target Audience: ${campaign.targetAudience}`));
    }

    console.log();
    console.log(chalk.cyan('📊 Performance:'));
    console.log(chalk.gray(`   Impressions: ${campaign.impressions || 0}`));
    console.log(chalk.gray(`   Clicks: ${campaign.clicks || 0}`));
    console.log(chalk.gray(`   CTR: ${campaign.ctr || 0}%`));
    console.log(chalk.gray(`   Conversions: ${campaign.conversions || 0}`));
  }

  private async start(campaignId: string): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      console.log(chalk.red('❌ Please login first: gamebuild auth login'));
      return;
    }

    await this.adService.startCampaign(campaignId);
    console.log(chalk.green('✅ Campaign started successfully!'));
  }

  private async pause(campaignId: string): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      console.log(chalk.red('❌ Please login first: gamebuild auth login'));
      return;
    }

    await this.adService.pauseCampaign(campaignId);
    console.log(chalk.green('✅ Campaign paused successfully!'));
  }

  private async stats(campaignId: string, options: any): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      console.log(chalk.red('❌ Please login first: gamebuild auth login'));
      return;
    }

    const stats = await this.adService.getCampaignStats(campaignId, options.period);

    console.log(chalk.blue(`📊 Campaign Statistics (${options.period})`));
    console.log();
    console.log(chalk.cyan('Performance Metrics:'));
    console.log(chalk.gray(`   Impressions: ${stats.impressions.toLocaleString()}`));
    console.log(chalk.gray(`   Clicks: ${stats.clicks.toLocaleString()}`));
    console.log(chalk.gray(`   CTR: ${stats.ctr}%`));
    console.log(chalk.gray(`   Conversions: ${stats.conversions.toLocaleString()}`));
    console.log(chalk.gray(`   Revenue: $${stats.revenue}`));
    console.log(chalk.gray(`   ROI: ${stats.roi}%`));
  }

  private async managePlacements(options: any): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      console.log(chalk.red('❌ Please login first: gamebuild auth login'));
      return;
    }

    if (options.list) {
      const placements = await this.adService.listPlacements();
      
      console.log(chalk.blue('📍 Available Ad Placements:'));
      console.log();
      
      placements.forEach((placement: any, index: number) => {
        console.log(chalk.cyan(`${index + 1}. ${placement.name}`));
        console.log(chalk.gray(`   ID: ${placement.id}`));
        console.log(chalk.gray(`   Type: ${placement.type}`));
        console.log(chalk.gray(`   Game: ${placement.gameName}`));
        console.log(chalk.gray(`   Revenue Share: ${placement.revenueShare}%`));
        console.log();
      });
    } else if (options.create) {
      // Create placement logic would go here
      console.log(chalk.blue('📍 Creating new ad placement...'));
      // Implementation for creating placements
    }
  }

  private async revenue(options: any): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      console.log(chalk.red('❌ Please login first: gamebuild auth login'));
      return;
    }

    const revenue = await this.adService.getRevenue(options.period, options.game);

    console.log(chalk.blue(`💰 Advertisement Revenue (${options.period})`));
    console.log();
    console.log(chalk.cyan(`Total Revenue: $${revenue.total}`));
    console.log(chalk.gray(`   Ad Impressions: $${revenue.impressions}`));
    console.log(chalk.gray(`   Ad Clicks: $${revenue.clicks}`));
    console.log(chalk.gray(`   Conversions: $${revenue.conversions}`));
    console.log();
    
    if (revenue.byGame && revenue.byGame.length > 0) {
      console.log(chalk.cyan('Revenue by Game:'));
      revenue.byGame.forEach((game: any) => {
        console.log(chalk.gray(`   ${game.name}: $${game.revenue}`));
      });
    }
  }

  private getStatusIcon(status: string): string {
    switch (status) {
      case 'active':
        return '🟢';
      case 'paused':
        return '🟡';
      case 'completed':
        return '✅';
      case 'draft':
        return '📝';
      default:
        return '❓';
    }
  }
}
