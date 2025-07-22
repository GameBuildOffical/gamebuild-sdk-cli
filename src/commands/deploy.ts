import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { BaseCommand } from './base';
import { DeployService } from '../services/deploy';
import { AuthService } from '../services/auth';
import { GameService } from '../services/game';

export class DeployCommand extends BaseCommand {
  private deployService = new DeployService();
  private authService = new AuthService();
  private gameService = new GameService();

  register(program: Command): void {
    const deployCmd = program
      .command('deploy')
      .description('Deploy game to various platforms');

    deployCmd
      .command('start')
      .description('Start a new deployment')
      .option('-b, --build-id <buildId>', 'Build ID to deploy')
      .option('-e, --env <environment>', 'Target environment (staging, prod)', 'staging')
      .option('-p, --platform <platform>', 'Deployment platform')
      .action(async (options) => {
        try {
          await this.start(options);
        } catch (error) {
          this.handleError(error);
        }
      });

    deployCmd
      .command('status')
      .description('Check deployment status')
      .argument('[deploymentId]', 'Specific deployment ID to check')
      .action(async (deploymentId) => {
        try {
          await this.status(deploymentId);
        } catch (error) {
          this.handleError(error);
        }
      });

    deployCmd
      .command('list')
      .description('List recent deployments')
      .option('-l, --limit <number>', 'Number of deployments to show', '10')
      .option('-f, --format <format>', 'Output format (table, json)', 'table')
      .action(async (options) => {
        try {
          await this.list(options);
        } catch (error) {
          this.handleError(error);
        }
      });

    deployCmd
      .command('rollback')
      .description('Rollback to a previous deployment')
      .argument('<deploymentId>', 'Deployment ID to rollback to')
      .option('-f, --force', 'Force rollback without confirmation')
      .action(async (deploymentId, options) => {
        try {
          await this.rollback(deploymentId, options);
        } catch (error) {
          this.handleError(error);
        }
      });

    deployCmd
      .command('logs')
      .description('Show deployment logs')
      .argument('<deploymentId>', 'Deployment ID')
      .option('-f, --follow', 'Follow logs in real-time')
      .action(async (deploymentId, options) => {
        try {
          await this.logs(deploymentId, options);
        } catch (error) {
          this.handleError(error);
        }
      });

    // Default deploy command (shorthand for 'deploy start')
    program
      .command('deploy')
      .description('Deploy game (alias for deploy start)')
      .option('-b, --build-id <buildId>', 'Build ID to deploy')
      .option('-e, --env <environment>', 'Target environment (staging, prod)', 'staging')
      .option('-p, --platform <platform>', 'Deployment platform')
      .action(async (options) => {
        try {
          await this.start(options);
        } catch (error) {
          this.handleError(error);
        }
      });
  }

  private async start(options: any): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      console.log(chalk.red('❌ Please login first: gamebuild auth login'));
      return;
    }

    const project = this.gameService.getLocalProject();
    if (!project) {
      console.log(chalk.red('❌ No GameBuild project found. Run "gamebuild game init" first.'));
      return;
    }

    console.log(chalk.blue('🚀 Starting deployment...'));

    let buildId = options.buildId;
    let platform = options.platform;

    if (!buildId) {
      // Get latest successful build
      const latestBuild = await this.deployService.getLatestSuccessfulBuild(project.gameId);
      if (!latestBuild) {
        console.log(chalk.red('❌ No successful builds found. Run "gamebuild build start" first.'));
        return;
      }
      buildId = latestBuild.id;
      console.log(chalk.gray(`Using latest build: ${buildId}`));
    }

    if (!platform) {
      const game = await this.gameService.getGame(project.gameId);
      const platforms = this.deployService.getAvailablePlatforms(game.platform);
      
      if (platforms.length === 0) {
        console.log(chalk.red('❌ No deployment platforms available for this game type.'));
        return;
      }

      if (platforms.length === 1) {
        platform = platforms[0].value;
        console.log(chalk.gray(`Using platform: ${platform}`));
      } else {
        const { selectedPlatform } = await inquirer.prompt([
          {
            type: 'list',
            name: 'selectedPlatform',
            message: 'Select deployment platform:',
            choices: platforms
          }
        ]);
        platform = selectedPlatform;
      }
    }

    const deployment = await this.deployService.startDeployment({
      buildId,
      environment: options.env,
      platform
    });

    console.log(chalk.green('✅ Deployment started!'));
    console.log(chalk.gray(`   Deployment ID: ${deployment.id}`));
    console.log(chalk.gray(`   Environment: ${deployment.environment}`));
    console.log(chalk.gray(`   Platform: ${deployment.platform}`));
    console.log(chalk.gray(`   Status: ${deployment.status}`));

    if (deployment.url) {
      console.log(chalk.cyan(`   🌐 Live URL: ${deployment.url}`));
    }
  }

  private async status(deploymentId?: string): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      console.log(chalk.red('❌ Please login first: gamebuild auth login'));
      return;
    }

    const project = this.gameService.getLocalProject();
    if (!project && !deploymentId) {
      console.log(chalk.red('❌ No GameBuild project found. Run "gamebuild game init" first.'));
      return;
    }

    let deployment;
    if (deploymentId) {
      deployment = await this.deployService.getDeployment(deploymentId);
    } else {
      deployment = await this.deployService.getLatestDeployment(project.gameId);
    }

    if (!deployment) {
      console.log(chalk.yellow('📝 No deployments found. Start your first deployment with "gamebuild deploy start"'));
      return;
    }

    console.log(chalk.blue('🚀 Deployment Status'));
    console.log();
    console.log(chalk.cyan(`Deployment ID: ${deployment.id}`));
    console.log(chalk.gray(`Status: ${this.getStatusIcon(deployment.status)} ${deployment.status}`));
    console.log(chalk.gray(`Environment: ${deployment.environment}`));
    console.log(chalk.gray(`Platform: ${deployment.platform}`));
    console.log(chalk.gray(`Build ID: ${deployment.buildId}`));
    console.log(chalk.gray(`Started: ${new Date(deployment.startedAt).toLocaleString()}`));
    
    if (deployment.completedAt) {
      console.log(chalk.gray(`Completed: ${new Date(deployment.completedAt).toLocaleString()}`));
    }
    
    if (deployment.url) {
      console.log(chalk.cyan(`🌐 Live URL: ${deployment.url}`));
    }
  }

  private async list(options: any): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      console.log(chalk.red('❌ Please login first: gamebuild auth login'));
      return;
    }

    const project = this.gameService.getLocalProject();
    if (!project) {
      console.log(chalk.red('❌ No GameBuild project found. Run "gamebuild game init" first.'));
      return;
    }

    const deployments = await this.deployService.listDeployments(project.gameId, parseInt(options.limit));

    if (options.format === 'json') {
      console.log(JSON.stringify(deployments, null, 2));
      return;
    }

    if (deployments.length === 0) {
      console.log(chalk.yellow('📝 No deployments found. Start your first deployment with "gamebuild deploy start"'));
      return;
    }

    console.log(chalk.blue('🚀 Recent Deployments:'));
    console.log();

    deployments.forEach((deployment: any, index: number) => {
      console.log(chalk.cyan(`${index + 1}. Deployment ${deployment.id}`));
      console.log(chalk.gray(`   Status: ${this.getStatusIcon(deployment.status)} ${deployment.status}`));
      console.log(chalk.gray(`   Environment: ${deployment.environment}`));
      console.log(chalk.gray(`   Platform: ${deployment.platform}`));
      console.log(chalk.gray(`   Started: ${new Date(deployment.startedAt).toLocaleString()}`));
      if (deployment.url) {
        console.log(chalk.gray(`   URL: ${deployment.url}`));
      }
      console.log();
    });
  }

  private async rollback(deploymentId: string, options: any): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      console.log(chalk.red('❌ Please login first: gamebuild auth login'));
      return;
    }

    if (!options.force) {
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `Are you sure you want to rollback to deployment "${deploymentId}"?`,
          default: false
        }
      ]);

      if (!confirm) {
        console.log(chalk.yellow('Operation cancelled.'));
        return;
      }
    }

    console.log(chalk.blue('🔄 Rolling back deployment...'));

    const rollback = await this.deployService.rollbackDeployment(deploymentId);
    
    console.log(chalk.green('✅ Rollback initiated!'));
    console.log(chalk.gray(`   Rollback ID: ${rollback.id}`));
    console.log(chalk.gray(`   Status: ${rollback.status}`));
  }

  private async logs(deploymentId: string, options: any): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      console.log(chalk.red('❌ Please login first: gamebuild auth login'));
      return;
    }

    console.log(chalk.blue(`📋 Deployment Logs (${deploymentId})`));
    console.log();

    if (options.follow) {
      await this.deployService.followLogs(deploymentId);
    } else {
      const logs = await this.deployService.getLogs(deploymentId);
      console.log(logs);
    }
  }

  private getStatusIcon(status: string): string {
    switch (status) {
      case 'deployed':
      case 'success':
        return '✅';
      case 'failed':
        return '❌';
      case 'deploying':
        return '🚀';
      case 'rolling-back':
        return '🔄';
      case 'queued':
        return '📋';
      default:
        return '❓';
    }
  }
}
