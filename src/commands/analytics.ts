import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { BaseCommand } from './base';
import { AnalyticsService } from '../services/analytics';
import { AuthService } from '../services/auth';

export class AnalyticsCommand extends BaseCommand {
  private analyticsService = new AnalyticsService();
  private authService = new AuthService();

  register(program: Command): void {
    const analyticsCmd = program
      .command('analytics')
      .alias('stats')
      .description('Data analysis and analytics commands');

    analyticsCmd
      .command('overview')
      .description('Get analytics overview')
      .option('-p, --period <period>', 'Time period (day, week, month)', 'week')
      .option('-g, --game <gameId>', 'Filter by game ID')
      .action(async (options) => {
        try {
          await this.overview(options);
        } catch (error) {
          this.handleError(error);
        }
      });

    analyticsCmd
      .command('players')
      .description('Player analytics and metrics')
      .option('-p, --period <period>', 'Time period (day, week, month)', 'week')
      .option('-g, --game <gameId>', 'Filter by game ID')
      .action(async (options) => {
        try {
          await this.players(options);
        } catch (error) {
          this.handleError(error);
        }
      });

    analyticsCmd
      .command('revenue')
      .description('Revenue analytics')
      .option('-p, --period <period>', 'Time period (day, week, month)', 'month')
      .option('-g, --game <gameId>', 'Filter by game ID')
      .action(async (options) => {
        try {
          await this.revenue(options);
        } catch (error) {
          this.handleError(error);
        }
      });

    analyticsCmd
      .command('events')
      .description('Game events analytics')
      .option('-e, --event <event>', 'Specific event type')
      .option('-p, --period <period>', 'Time period (day, week, month)', 'week')
      .option('-g, --game <gameId>', 'Filter by game ID')
      .action(async (options) => {
        try {
          await this.events(options);
        } catch (error) {
          this.handleError(error);
        }
      });

    analyticsCmd
      .command('retention')
      .description('Player retention analysis')
      .option('-p, --period <period>', 'Time period (day, week, month)', 'week')
      .option('-g, --game <gameId>', 'Filter by game ID')
      .action(async (options) => {
        try {
          await this.retention(options);
        } catch (error) {
          this.handleError(error);
        }
      });

    analyticsCmd
      .command('export')
      .description('Export analytics data')
      .option('-t, --type <type>', 'Data type (players, revenue, events)', 'players')
      .option('-f, --format <format>', 'Export format (csv, json)', 'csv')
      .option('-p, --period <period>', 'Time period (day, week, month)', 'month')
      .action(async (options) => {
        try {
          await this.export(options);
        } catch (error) {
          this.handleError(error);
        }
      });

    analyticsCmd
      .command('realtime')
      .description('Real-time analytics dashboard')
      .option('-g, --game <gameId>', 'Filter by game ID')
      .action(async (options) => {
        try {
          await this.realtime(options);
        } catch (error) {
          this.handleError(error);
        }
      });
  }

  private async overview(options: any): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      console.log(chalk.red('❌ Please login first: gamebuild auth login'));
      return;
    }

    const overview = await this.analyticsService.getOverview(options.period, options.game);

    console.log(chalk.blue(`📊 Analytics Overview (${options.period})`));
    console.log();
    
    console.log(chalk.cyan('👥 Players:'));
    console.log(chalk.gray(`   Total Active Users: ${overview.players.total.toLocaleString()}`));
    console.log(chalk.gray(`   New Users: ${overview.players.new.toLocaleString()}`));
    console.log(chalk.gray(`   Returning Users: ${overview.players.returning.toLocaleString()}`));
    console.log();

    console.log(chalk.cyan('💰 Revenue:'));
    console.log(chalk.gray(`   Total Revenue: $${overview.revenue.total.toLocaleString()}`));
    console.log(chalk.gray(`   In-App Purchases: $${overview.revenue.iap.toLocaleString()}`));
    console.log(chalk.gray(`   Ad Revenue: $${overview.revenue.ads.toLocaleString()}`));
    console.log();

    console.log(chalk.cyan('🎮 Engagement:'));
    console.log(chalk.gray(`   Average Session Duration: ${overview.engagement.avgSessionDuration} min`));
    console.log(chalk.gray(`   Sessions per User: ${overview.engagement.sessionsPerUser}`));
    console.log(chalk.gray(`   Retention Rate: ${overview.engagement.retentionRate}%`));
    console.log();

    console.log(chalk.cyan('📈 Growth:'));
    console.log(chalk.gray(`   User Growth: ${overview.growth.userGrowth > 0 ? '+' : ''}${overview.growth.userGrowth}%`));
    console.log(chalk.gray(`   Revenue Growth: ${overview.growth.revenueGrowth > 0 ? '+' : ''}${overview.growth.revenueGrowth}%`));
  }

  private async players(options: any): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      console.log(chalk.red('❌ Please login first: gamebuild auth login'));
      return;
    }

    const playerData = await this.analyticsService.getPlayerAnalytics(options.period, options.game);

    console.log(chalk.blue(`👥 Player Analytics (${options.period})`));
    console.log();

    console.log(chalk.cyan('User Acquisition:'));
    console.log(chalk.gray(`   New Users: ${playerData.acquisition.newUsers.toLocaleString()}`));
    console.log(chalk.gray(`   Organic: ${playerData.acquisition.organic.toLocaleString()}`));
    console.log(chalk.gray(`   Paid: ${playerData.acquisition.paid.toLocaleString()}`));
    console.log();

    console.log(chalk.cyan('Demographics:'));
    console.log(chalk.gray(`   Average Age: ${playerData.demographics.avgAge} years`));
    console.log(chalk.gray('   Top Countries:'));
    playerData.demographics.topCountries.forEach((country: any) => {
      console.log(chalk.gray(`     ${country.name}: ${country.percentage}%`));
    });
    console.log();

    console.log(chalk.cyan('Behavior:'));
    console.log(chalk.gray(`   Daily Active Users: ${playerData.behavior.dau.toLocaleString()}`));
    console.log(chalk.gray(`   Weekly Active Users: ${playerData.behavior.wau.toLocaleString()}`));
    console.log(chalk.gray(`   Monthly Active Users: ${playerData.behavior.mau.toLocaleString()}`));
    console.log(chalk.gray(`   Average Playtime: ${playerData.behavior.avgPlaytime} min/day`));
  }

  private async revenue(options: any): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      console.log(chalk.red('❌ Please login first: gamebuild auth login'));
      return;
    }

    const revenueData = await this.analyticsService.getRevenueAnalytics(options.period, options.game);

    console.log(chalk.blue(`💰 Revenue Analytics (${options.period})`));
    console.log();

    console.log(chalk.cyan('Total Revenue: ') + chalk.green(`$${revenueData.total.toLocaleString()}`));
    console.log();

    console.log(chalk.cyan('Revenue Sources:'));
    console.log(chalk.gray(`   In-App Purchases: $${revenueData.sources.iap.toLocaleString()} (${revenueData.sources.iapPercentage}%)`));
    console.log(chalk.gray(`   Advertisements: $${revenueData.sources.ads.toLocaleString()} (${revenueData.sources.adsPercentage}%)`));
    console.log(chalk.gray(`   Subscriptions: $${revenueData.sources.subscriptions.toLocaleString()} (${revenueData.sources.subscriptionsPercentage}%)`));
    console.log();

    console.log(chalk.cyan('Metrics:'));
    console.log(chalk.gray(`   ARPU (Average Revenue Per User): $${revenueData.metrics.arpu}`));
    console.log(chalk.gray(`   ARPPU (Average Revenue Per Paying User): $${revenueData.metrics.arppu}`));
    console.log(chalk.gray(`   Conversion Rate: ${revenueData.metrics.conversionRate}%`));
    console.log();

    if (revenueData.topProducts && revenueData.topProducts.length > 0) {
      console.log(chalk.cyan('Top Products:'));
      revenueData.topProducts.forEach((product: any, index: number) => {
        console.log(chalk.gray(`   ${index + 1}. ${product.name}: $${product.revenue.toLocaleString()}`));
      });
    }
  }

  private async events(options: any): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      console.log(chalk.red('❌ Please login first: gamebuild auth login'));
      return;
    }

    const eventData = await this.analyticsService.getEventAnalytics(options.period, options.game, options.event);

    console.log(chalk.blue(`🎯 Event Analytics (${options.period})`));
    console.log();

    if (options.event) {
      console.log(chalk.cyan(`Event: ${options.event}`));
      console.log(chalk.gray(`   Total Occurrences: ${eventData.specific.total.toLocaleString()}`));
      console.log(chalk.gray(`   Unique Users: ${eventData.specific.uniqueUsers.toLocaleString()}`));
      console.log(chalk.gray(`   Average per User: ${eventData.specific.avgPerUser}`));
    } else {
      console.log(chalk.cyan('Top Events:'));
      eventData.topEvents.forEach((event: any, index: number) => {
        console.log(chalk.gray(`   ${index + 1}. ${event.name}: ${event.count.toLocaleString()} occurrences`));
      });
      console.log();

      console.log(chalk.cyan('Event Categories:'));
      Object.entries(eventData.categories).forEach(([category, count]: [string, any]) => {
        console.log(chalk.gray(`   ${category}: ${count.toLocaleString()}`));
      });
    }
  }

  private async retention(options: any): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      console.log(chalk.red('❌ Please login first: gamebuild auth login'));
      return;
    }

    const retentionData = await this.analyticsService.getRetentionAnalytics(options.period, options.game);

    console.log(chalk.blue(`📈 Retention Analysis (${options.period})`));
    console.log();

    console.log(chalk.cyan('Retention Rates:'));
    console.log(chalk.gray(`   Day 1: ${retentionData.day1}%`));
    console.log(chalk.gray(`   Day 7: ${retentionData.day7}%`));
    console.log(chalk.gray(`   Day 30: ${retentionData.day30}%`));
    console.log();

    console.log(chalk.cyan('Cohort Analysis:'));
    retentionData.cohorts.forEach((cohort: any) => {
      console.log(chalk.gray(`   ${cohort.period}: ${cohort.retention}% (${cohort.users.toLocaleString()} users)`));
    });
    console.log();

    console.log(chalk.cyan('Churn Analysis:'));
    console.log(chalk.gray(`   Churn Rate: ${retentionData.churn.rate}%`));
    console.log(chalk.gray(`   Primary Churn Reasons:`));
    retentionData.churn.reasons.forEach((reason: any) => {
      console.log(chalk.gray(`     • ${reason.name}: ${reason.percentage}%`));
    });
  }

  private async export(options: any): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      console.log(chalk.red('❌ Please login first: gamebuild auth login'));
      return;
    }

    console.log(chalk.blue('📤 Exporting analytics data...'));

    const exportResult = await this.analyticsService.exportData(options.type, options.format, options.period);

    console.log(chalk.green('✅ Data exported successfully!'));
    console.log(chalk.gray(`   File: ${exportResult.filename}`));
    console.log(chalk.gray(`   Format: ${options.format.toUpperCase()}`));
    console.log(chalk.gray(`   Records: ${exportResult.recordCount.toLocaleString()}`));
    console.log(chalk.gray(`   Download URL: ${exportResult.downloadUrl}`));
  }

  private async realtime(options: any): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      console.log(chalk.red('❌ Please login first: gamebuild auth login'));
      return;
    }

    console.log(chalk.blue('📊 Real-time Analytics Dashboard'));
    console.log(chalk.gray('Press Ctrl+C to exit'));
    console.log();

    const updateInterval = 5000; // 5 seconds
    let isRunning = true;

    const updateDashboard = async () => {
      try {
        const realTimeData = await this.analyticsService.getRealTimeData(options.game);
        
        // Clear screen
        process.stdout.write('\x1Bc');
        
        console.log(chalk.blue('📊 Real-time Analytics Dashboard'));
        console.log(chalk.gray(`Last updated: ${new Date().toLocaleTimeString()}`));
        console.log();

        console.log(chalk.cyan('🔴 Live Metrics:'));
        console.log(chalk.gray(`   Active Users: ${realTimeData.activeUsers.toLocaleString()}`));
        console.log(chalk.gray(`   Sessions: ${realTimeData.activeSessions.toLocaleString()}`));
        console.log(chalk.gray(`   Revenue (Today): $${realTimeData.todayRevenue.toLocaleString()}`));
        console.log();

        console.log(chalk.cyan('📈 Recent Activity (Last 5 min):'));
        console.log(chalk.gray(`   New Users: ${realTimeData.recent.newUsers}`));
        console.log(chalk.gray(`   Events: ${realTimeData.recent.events.toLocaleString()}`));
        console.log(chalk.gray(`   Purchases: ${realTimeData.recent.purchases}`));
        console.log();

        if (realTimeData.topPages && realTimeData.topPages.length > 0) {
          console.log(chalk.cyan('🔥 Most Active Areas:'));
          realTimeData.topPages.forEach((page: any, index: number) => {
            console.log(chalk.gray(`   ${index + 1}. ${page.name}: ${page.users} users`));
          });
        }

        if (isRunning) {
          setTimeout(updateDashboard, updateInterval);
        }
      } catch (error) {
        console.log(chalk.red('❌ Error updating dashboard:'), error);
        if (isRunning) {
          setTimeout(updateDashboard, updateInterval);
        }
      }
    };

    // Handle Ctrl+C
    process.on('SIGINT', () => {
      isRunning = false;
      console.log(chalk.yellow('\n👋 Exiting real-time dashboard...'));
      process.exit(0);
    });

    // Start the dashboard
    updateDashboard();
  }
}
