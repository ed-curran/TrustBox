#!/bin/env -S node --no-warnings=ExperimentalWarning

import { Command } from 'commander';
import { build, init } from './build';

const program = new Command();

program
  .name('trustbench')
  .description('CLI to some JavaScript string utilities')
  .version('0.0.1');

program
  .command('init')
  .description('initialise an environment from a template')
  .argument('[environmentName]', 'name of the environment to initialise')
  .option(
    '--template <templateName>',
    'environment file to use as a template, the contents will be copied with a new kmsSecretKey',
  )
  .action((environmentName, options) => {
    //const templateName = options.template ? 1 : undefined;
    init(environmentName, options.template).then((out) =>
      console.log('written to ' + out),
    );
  });

program
  .command('build')
  .description('build the model for an environment')
  .argument('[environmentName]', 'name of the environment to initialise')
  .option('--model <modelPath>', 'path of the model', './model')
  .option(
    '--secret <secretKey>',
    'secret key to secure the key management system with. It is very important you look after this key. If not provided here, will be retrieved from the environment file or the KMS_SECRET_KEY environment variable',
  )
  .action((environmentName, options) => {
    console.log(options.model);
    build(environmentName, options.model, options.secret).then(() => {
      //done
    });
  });

program.parse();
