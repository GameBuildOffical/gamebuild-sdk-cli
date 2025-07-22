import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { BaseCommand } from './base';
import { BuildService } from '../services/build';
import { AuthService } from '../services/auth';
import { GameService } from '../services/game';

export class BuildCommand extends BaseCommand {
  private buildService = new BuildService();
  private authService = new AuthService();
  private gameService = new GameService();

  register(program: Command): void {
    const buildCmd = program
      .command('build')
      .description('Build game project');

    buildCmd
      .command('start')
      .description('Start a new build')
      .option('-e, --env <environment>', 'Target environment (dev, staging, prod)', 'dev')
      .option('-p, --platform <platform>', 'Target platform override')
      .option('-w, --watch', 'Watch for changes and rebuild')
      .action(async (options) => {
        try {
          await this.start(options);
        } catch (error) {
          this.handleError(error);
        }
      });

    buildCmd
      .command('status')
      .description('Check build status')
      .argument('[buildId]', 'Specific build ID to check')
      .action(async (buildId) => {
        try {
          await this.status(buildId);
        } catch (error) {
          this.handleError(error);
        }
      });

    buildCmd
      .command('list')
      .description('List recent builds')
      .option('-l, --limit <number>', 'Number of builds to show', '10')
      .option('-f, --format <format>', 'Output format (table, json)', 'table')
      .action(async (options) => {
        try {
          await this.list(options);
        } catch (error) {
          this.handleError(error);
        }
      });

    buildCmd
      .command('logs')
      .description('Show build logs')
      .argument('<buildId>', 'Build ID')
      .option('-f, --follow', 'Follow logs in real-time')
      .action(async (buildId, options) => {
        try {
          await this.logs(buildId, options);
        } catch (error) {
          this.handleError(error);
        }
      });

    buildCmd
      .command('download')
      .description('Download build artifacts')
      .argument('<buildId>', 'Build ID')
      .option('-o, --output <path>', 'Output directory', './downloads')
      .action(async (buildId, options) => {
        try {
          await this.download(buildId, options);
        } catch (error) {
          this.handleError(error);
        }
      });

    // Default build command (shorthand for 'build start')
    program
      .command('build')
      .description('Build game project (alias for build start)')
      .option('-e, --env <environment>', 'Target environment (dev, staging, prod)', 'dev')
      .option('-p, --platform <platform>', 'Target platform override')
      .option('-w, --watch', 'Watch for changes and rebuild')
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

    console.log(chalk.blue('🔨 Starting build...'));

    const buildOptions = {
      gameId: project.gameId,
      environment: options.env,
      platform: options.platform,
      watch: options.watch
    };

    if (options.watch) {
      await this.buildService.startWatchBuild(buildOptions);
    } else {
      const build = await this.buildService.startBuild(buildOptions);
      
      console.log(chalk.green('✅ Build started!'));
      console.log(chalk.gray(`   Build ID: ${build.id}`));
      console.log(chalk.gray(`   Status: ${build.status}`));
      console.log(chalk.gray(`   Environment: ${build.environment}`));
      
      if (build.status === 'building') {
        console.log(chalk.yellow('⏳ Build in progress... Use "gamebuild build status" to check progress.'));
      }
    }
  }

  private async status(buildId?: string): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      console.log(chalk.red('❌ Please login first: gamebuild auth login'));
      return;
    }

    const project = this.gameService.getLocalProject();
    if (!project && !buildId) {
      console.log(chalk.red('❌ No GameBuild project found. Run "gamebuild game init" first.'));
      return;
    }

    let build;
    if (buildId) {
      build = await this.buildService.getBuild(buildId);
    } else {
      build = await this.buildService.getLatestBuild(project.gameId);
    }

    if (!build) {
      console.log(chalk.yellow('📝 No builds found. Start your first build with "gamebuild build start"'));
      return;
    }

    console.log(chalk.blue('🔨 Build Status'));
    console.log();
    console.log(chalk.cyan(`Build ID: ${build.id}`));
    console.log(chalk.gray(`Status: ${this.getStatusIcon(build.status)} ${build.status}`));
    console.log(chalk.gray(`Environment: ${build.environment}`));
    console.log(chalk.gray(`Platform: ${build.platform}`));
    console.log(chalk.gray(`Started: ${new Date(build.startedAt).toLocaleString()}`));
    
    if (build.completedAt) {
      console.log(chalk.gray(`Completed: ${new Date(build.completedAt).toLocaleString()}`));
      console.log(chalk.gray(`Duration: ${build.duration}s`));
    }
    
    if (build.downloadUrl) {
      console.log(chalk.gray(`Download: ${build.downloadUrl}`));
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

    const builds = await this.buildService.listBuilds(project.gameId, parseInt(options.limit));

    if (options.format === 'json') {
      console.log(JSON.stringify(builds, null, 2));
      return;
    }

    if (builds.length === 0) {
      console.log(chalk.yellow('📝 No builds found. Start your first build with "gamebuild build start"'));
      return;
    }

    console.log(chalk.blue('🔨 Recent Builds:'));
    console.log();

    builds.forEach((build: any, index: number) => {
      console.log(chalk.cyan(`${index + 1}. Build ${build.id}`));
      console.log(chalk.gray(`   Status: ${this.getStatusIcon(build.status)} ${build.status}`));
      console.log(chalk.gray(`   Environment: ${build.environment}`));
      console.log(chalk.gray(`   Started: ${new Date(build.startedAt).toLocaleString()}`));
      console.log();
    });
  }

  private async logs(buildId: string, options: any): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      console.log(chalk.red('❌ Please login first: gamebuild auth login'));
      return;
    }

    console.log(chalk.blue(`📋 Build Logs (${buildId})`));
    console.log();

    if (options.follow) {
      await this.buildService.followLogs(buildId);
    } else {
      const logs = await this.buildService.getLogs(buildId);
      console.log(logs);
    }
  }

  private async download(buildId: string, options: any): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      console.log(chalk.red('❌ Please login first: gamebuild auth login'));
      return;
    }

    console.log(chalk.blue(`📥 Downloading build ${buildId}...`));

    await this.buildService.downloadBuild(buildId, options.output);
    
    console.log(chalk.green('✅ Build downloaded successfully!'));
    console.log(chalk.gray(`   Location: ${options.output}`));
  }

  private getStatusIcon(status: string): string {
    switch (status) {
      case 'success':
        return '✅';
      case 'failed':
        return '❌';
      case 'building':
        return '⏳';
      case 'queued':
        return '📋';
      default:
        return '❓';
    }
  }
}
