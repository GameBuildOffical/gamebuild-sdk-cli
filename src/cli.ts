#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { version } from '../package.json';
import { AuthCommand } from './commands/auth';
import { GameCommand } from './commands/game';
import { BuildCommand } from './commands/build';
import { DeployCommand } from './commands/deploy';
import { ConfigCommand } from './commands/config';
import { IdManagementCommand } from './commands/id-management';
import { GuildCommand } from './commands/guild';
import { AssetCommand } from './commands/asset';
import { AdCommand } from './commands/ad';
import { AnalyticsCommand } from './commands/analytics';

const program = new Command();

// Configure the main program
program
  .name('gamebuild')
  .description('GameBuild SDK Command Line Interface')
  .version(version)
  .option('-v, --verbose', 'Enable verbose output')
  .option('--config <path>', 'Specify config file path');

// Add ASCII art banner
const banner = `
${chalk.cyan('   ____                      ____        _ _     _ ')}
${chalk.cyan('  / ___| __ _ _ __ ___   ___  | __ ) _   _(_) | __| |')}
${chalk.cyan(' | |  _ / _` | \'_ ` _ \\ / _ \\ |  _ \\| | | | | |/ _` |')}
${chalk.cyan(' | |_| | (_| | | | | | |  __/ | |_) | |_| | | | (_| |')}
${chalk.cyan('  \\____|\\__,_|_| |_| |_|\\___| |____/ \\__,_|_|_|\\__,_|')}
${chalk.yellow('                                                   ')}
${chalk.yellow('  Command Line Interface for Game Development      ')}
`;

program.addHelpText('beforeAll', banner);

// Register commands
new AuthCommand().register(program);
new GameCommand().register(program);
new BuildCommand().register(program);
new DeployCommand().register(program);
new ConfigCommand().register(program);
new IdManagementCommand().register(program);
new GuildCommand().register(program);
new AssetCommand().register(program);
new AdCommand().register(program);
new AnalyticsCommand().register(program);

// Global error handler
program.exitOverride();

// Parse arguments
try {
  program.parse();
} catch (error: any) {
  if (error.code === 'commander.version') {
    console.log(banner);
    console.log(chalk.green(`GameBuild CLI v${version}`));
  } else if (error.code === 'commander.help') {
    // Help is already displayed
  } else {
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}
