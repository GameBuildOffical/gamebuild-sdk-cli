import { Command } from 'commander';

export interface ICommand {
  register(program: Command): void;
}

export abstract class BaseCommand implements ICommand {
  abstract register(program: Command): void;
  
  protected handleError(error: any): void {
    console.error('Error:', error.message);
    process.exit(1);
  }
}
