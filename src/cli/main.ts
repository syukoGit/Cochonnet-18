import { run } from './replay';

process.exitCode = run(process.argv.slice(2));
