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

    assetCmd
      .command('issue-erc20')
      .description('Issue a new ERC20 token')
      .option('-n, --name <name>', 'Token name')
      .option('-s, --symbol <symbol>', 'Token symbol')
      .option('-d, --decimals <decimals>', 'Token decimals', '18')
      .option('-t, --total-supply <supply>', 'Total supply')
      .action(async (options) => {
        try {
          await this.issueErc20(options);
        } catch (error) {
          this.handleError(error);
        }
      });

    assetCmd
      .command('issue-erc721')
      .description('Issue a new ERC721 NFT collection')
      .option('-n, --name <name>', 'Collection name')
      .option('-s, --symbol <symbol>', 'Collection symbol')
      .option('-u, --base-uri <uri>', 'Base URI for metadata')
      .action(async (options) => {
        try {
          await this.issueErc721(options);
        } catch (error) {
          this.handleError(error);
        }
      });

    assetCmd
      .command('mint-erc721')
      .description('Mint an NFT from an ERC721 collection')
      .argument('<contractAddress>', 'ERC721 contract address')
      .option('-t, --to <address>', 'Recipient address')
      .option('-m, --metadata <uri>', 'Token metadata URI')
      .action(async (contractAddress, options) => {
        try {
          await this.mintErc721(contractAddress, options);
        } catch (error) {
          this.handleError(error);
        }
      });

    assetCmd
      .command('list-erc20')
      .description('List all ERC20 tokens')
      .option('-f, --format <format>', 'Output format (table, json)', 'table')
      .action(async (options) => {
        try {
          await this.listErc20(options);
        } catch (error) {
          this.handleError(error);
        }
      });

    assetCmd
      .command('list-erc721')
      .description('List all ERC721 collections')
      .option('-f, --format <format>', 'Output format (table, json)', 'table')
      .action(async (options) => {
        try {
          await this.listErc721(options);
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

  private async issueErc20(options: any): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      console.log(chalk.red('❌ Please login first: gamebuild auth login'));
      return;
    }

    console.log(chalk.blue('🪙 Issuing ERC20 Token...'));

    let name = options.name;
    let symbol = options.symbol;
    let decimals = parseInt(options.decimals);
    let totalSupply = options.totalSupply;

    if (!name || !symbol || !totalSupply) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Token name:',
          when: !name,
          validate: (input) => input.length > 0 || 'Token name is required'
        },
        {
          type: 'input',
          name: 'symbol',
          message: 'Token symbol:',
          when: !symbol,
          validate: (input) => input.length > 0 || 'Token symbol is required'
        },
        {
          type: 'input',
          name: 'decimals',
          message: 'Token decimals:',
          default: '18',
          validate: (input) => !isNaN(Number(input)) || 'Decimals must be a number'
        },
        {
          type: 'input',
          name: 'totalSupply',
          message: 'Total supply:',
          when: !totalSupply,
          validate: (input) => !isNaN(Number(input)) && Number(input) > 0 || 'Total supply must be a positive number'
        }
      ]);

      name = name || answers.name;
      symbol = symbol || answers.symbol;
      decimals = decimals || parseInt(answers.decimals);
      totalSupply = totalSupply || answers.totalSupply;
    }

    const token = await this.assetService.issueErc20({
      name,
      symbol,
      decimals,
      totalSupply
    });

    console.log(chalk.green('✅ ERC20 token issued successfully!'));
    console.log(chalk.gray(`   Contract Address: ${token.contractAddress}`));
    console.log(chalk.gray(`   Name: ${token.name}`));
    console.log(chalk.gray(`   Symbol: ${token.symbol}`));
    console.log(chalk.gray(`   Decimals: ${token.decimals}`));
    console.log(chalk.gray(`   Total Supply: ${token.totalSupply}`));
    console.log(chalk.gray(`   Transaction Hash: ${token.transactionHash}`));
  }

  private async issueErc721(options: any): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      console.log(chalk.red('❌ Please login first: gamebuild auth login'));
      return;
    }

    console.log(chalk.blue('🎨 Issuing ERC721 NFT Collection...'));

    let name = options.name;
    let symbol = options.symbol;
    let baseUri = options.baseUri;

    if (!name || !symbol) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Collection name:',
          when: !name,
          validate: (input) => input.length > 0 || 'Collection name is required'
        },
        {
          type: 'input',
          name: 'symbol',
          message: 'Collection symbol:',
          when: !symbol,
          validate: (input) => input.length > 0 || 'Collection symbol is required'
        },
        {
          type: 'input',
          name: 'baseUri',
          message: 'Base URI for metadata (optional):',
          when: !baseUri
        }
      ]);

      name = name || answers.name;
      symbol = symbol || answers.symbol;
      baseUri = baseUri || answers.baseUri;
    }

    const collection = await this.assetService.issueErc721({
      name,
      symbol,
      baseUri
    });

    console.log(chalk.green('✅ ERC721 collection issued successfully!'));
    console.log(chalk.gray(`   Contract Address: ${collection.contractAddress}`));
    console.log(chalk.gray(`   Name: ${collection.name}`));
    console.log(chalk.gray(`   Symbol: ${collection.symbol}`));
    console.log(chalk.gray(`   Base URI: ${collection.baseUri || 'Not set'}`));
    console.log(chalk.gray(`   Transaction Hash: ${collection.transactionHash}`));
  }

  private async mintErc721(contractAddress: string, options: any): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      console.log(chalk.red('❌ Please login first: gamebuild auth login'));
      return;
    }

    console.log(chalk.blue('🎨 Minting ERC721 NFT...'));

    let toAddress = options.to;
    let metadataUri = options.metadata;

    if (!toAddress) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'toAddress',
          message: 'Recipient address:',
          validate: (input) => /^0x[a-fA-F0-9]{40}$/.test(input) || 'Please enter a valid Ethereum address'
        },
        {
          type: 'input',
          name: 'metadataUri',
          message: 'Token metadata URI (optional):',
          when: !metadataUri
        }
      ]);

      toAddress = answers.toAddress;
      metadataUri = metadataUri || answers.metadataUri;
    }

    const nft = await this.assetService.mintErc721({
      contractAddress,
      toAddress,
      metadataUri
    });

    console.log(chalk.green('✅ ERC721 NFT minted successfully!'));
    console.log(chalk.gray(`   Token ID: ${nft.tokenId}`));
    console.log(chalk.gray(`   Contract: ${nft.contractAddress}`));
    console.log(chalk.gray(`   Owner: ${nft.owner}`));
    console.log(chalk.gray(`   Metadata URI: ${nft.metadataUri || 'Not set'}`));
    console.log(chalk.gray(`   Transaction Hash: ${nft.transactionHash}`));
  }

  private async listErc20(options: any): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      console.log(chalk.red('❌ Please login first: gamebuild auth login'));
      return;
    }

    const tokens = await this.assetService.listErc20Tokens();

    if (options.format === 'json') {
      console.log(JSON.stringify(tokens, null, 2));
      return;
    }

    if (tokens.length === 0) {
      console.log(chalk.yellow('📝 No ERC20 tokens found.'));
      return;
    }

    console.log(chalk.blue('🪙 ERC20 Tokens:'));
    console.log();

    tokens.forEach((token: any, index: number) => {
      console.log(chalk.cyan(`${index + 1}. ${token.name} (${token.symbol})`));
      console.log(chalk.gray(`   Contract: ${token.contractAddress}`));
      console.log(chalk.gray(`   Decimals: ${token.decimals}`));
      console.log(chalk.gray(`   Total Supply: ${token.totalSupply}`));
      console.log();
    });
  }

  private async listErc721(options: any): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      console.log(chalk.red('❌ Please login first: gamebuild auth login'));
      return;
    }

    const collections = await this.assetService.listErc721Collections();

    if (options.format === 'json') {
      console.log(JSON.stringify(collections, null, 2));
      return;
    }

    if (collections.length === 0) {
      console.log(chalk.yellow('📝 No ERC721 collections found.'));
      return;
    }

    console.log(chalk.blue('🎨 ERC721 Collections:'));
    console.log();

    collections.forEach((collection: any, index: number) => {
      console.log(chalk.cyan(`${index + 1}. ${collection.name} (${collection.symbol})`));
      console.log(chalk.gray(`   Contract: ${collection.contractAddress}`));
      console.log(chalk.gray(`   Base URI: ${collection.baseUri || 'Not set'}`));
      console.log();
    });
  }
}
