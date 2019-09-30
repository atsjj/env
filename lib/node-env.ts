import { Env, EnvOptions, DefaultTarget } from './env';

export class NodeEnv extends Env {
  constructor(options: EnvOptions) {
    const { NODE_ENV: target = DefaultTarget } = process.env;

    super({ ...options, environment: process.env, target });
  }
}
