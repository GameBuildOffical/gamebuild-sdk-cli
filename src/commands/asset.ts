import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { BaseCommand } from './base';
import { AssetService } from '../services/asset';
import { AuthService } from '../services/auth';

export class AssetCommand extends BaseCommand {
  private assetService = new AssetService();
  private authService = new AuthService();

  register(program: Command): void {
    const assetCmd = program
      .command('asset')
      .description('Asset management commands (NFTs, in-game items, metadata, IPFS)');

    assetCmd
      .command('mint')
      .description('Mint a new asset (NFT)')
      .option('-n, --name <name>', 'Asset name')
      .option('-d, --description <desc>', 'Asset description')
      .option('-f, --file <file>', 'Asset file (image, model, etc.)')
      .action(async (options) => {
        try {
          await this.mint(options);
        } catch (error) {
          this.handleError(error);
        }
      });

    assetCmd
      .command('list')
      .description('List all assets')
      .option('-f, --format <format>', 'Output format (table, json)', 'table')
      .action(async (options) => {
        try {
          await this.list(options);
        } catch (error) {
          this.handleError(error);
        }
      });

    assetCmd
      .command('info')
      .description('Get information about an asset')
      .argument('<assetId>', 'Asset ID or name')
      .action(async (assetId) => {
        try {
          await this.info(assetId);
        } catch (error) {
          this.handleError(error);
        }
      });

    assetCmd
      .command('transfer')
      .description('Transfer asset to another wallet')
      .argument('<assetId>', 'Asset ID')
      .argument('<toAddress>', 'Recipient wallet address')
      .action(async (assetId, toAddress) => {
        try {
          await this.transfer(assetId, toAddress);
        } catch (error) {
          this.handleError(error);
        }
      });

    assetCmd
      .command('burn')
      .description('Burn (destroy) an asset')
      .argument('<assetId>', 'Asset ID')
      .action(async (assetId) => {
        try {
          await this.burn(assetId);
        } catch (error) {
          this.handleError(error);
        }
      });
  }

  private async mint(options: any): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      console.log(chalk.red('❌ Please login first: gamebuild auth login'));
      return;
    }
    let name = options.name;
    let description = options.description;
    let file = options.file;
    if (!name || !file) {
      const answers = await inquirer.prompt([
        { type: 'input', name: 'name', message: 'Asset name:', validate: (input) => input.length > 0 || 'Asset name is required' },
        { type: 'input', name: 'description', message: 'Asset description:' },
        { type: 'input', name: 'file', message: 'Asset file path:', validate: (input) => input.length > 0 || 'File path is required' }
      ]);
      name = name || answers.name;
      description = description || answers.description;
      file = file || answers.file;
    }
    const asset = await this.assetService.mintAsset({ name, description, file });
    console.log(chalk.green('✅ Asset minted successfully!'));
    console.log(chalk.gray(`   Asset ID: ${asset.id}`));
    console.log(chalk.gray(`   Name: ${asset.name}`));
    console.log(chalk.gray(`   Description: ${asset.description}`));
    console.log(chalk.gray(`   Token: ${asset.tokenId}`));
    console.log(chalk.gray(`   Owner: ${asset.owner}`));
    console.log(chalk.gray(`   IPFS: ${asset.ipfsUrl}`));
  }

  private async list(options: any): Promise<void> {
    const assets = await this.assetService.listAssets();
    if (options.format === 'json') {
      console.log(JSON.stringify(assets, null, 2));
      return;
    }
    if (assets.length === 0) {
      console.log(chalk.yellow('📝 No assets found.'));
      return;
    }
    console.log(chalk.blue('🎨 Assets:'));
    assets.forEach((asset: any, index: number) => {
      console.log(chalk.cyan(`${index + 1}. ${asset.name}`));
      console.log(chalk.gray(`   ID: ${asset.id}`));
      console.log(chalk.gray(`   Token: ${asset.tokenId}`));
      console.log(chalk.gray(`   Owner: ${asset.owner}`));
      console.log(chalk.gray(`   IPFS: ${asset.ipfsUrl}`));
      console.log();
    });
  }

  private async info(assetId: string): Promise<void> {
    const asset = await this.assetService.getAsset(assetId);
    console.log(chalk.blue('🎨 Asset Information'));
    console.log(chalk.cyan(`Name: ${asset.name}`));
    console.log(chalk.gray(`ID: ${asset.id}`));
    console.log(chalk.gray(`Token: ${asset.tokenId}`));
    console.log(chalk.gray(`Owner: ${asset.owner}`));
    console.log(chalk.gray(`IPFS: ${asset.ipfsUrl}`));
    console.log(chalk.gray(`Description: ${asset.description}`));
  }

  private async transfer(assetId: string, toAddress: string): Promise<void> {
    await this.assetService.transferAsset(assetId, toAddress);
    console.log(chalk.green('✅ Asset transferred successfully!'));
  }

  private async burn(assetId: string): Promise<void> {
    await this.assetService.burnAsset(assetId);
    console.log(chalk.green('✅ Asset burned successfully!'));
  }
}
