export type EnvironmentKey = string | number | symbol;

export interface Environment {
  [key: string]: string | undefined;
};

export interface EnvOptions {
  /**
   * Setting the `namespace` to "project" and trying to resolve "url" will attempt to find
   * "PROJECT_URL" and "URL" in the given `environment` hash.
   */
  namespace?: string;

  /**
   * Setting the `prefix` to "some" with a `namespace` of "project" and trying to resolve "url" will
   * attempt to find "SOME_PROJECT_URL", "PROJECT_URL" and "URL" in the given `environment` hash.
   */
  prefix?: string;

  /**
   * An object like `process.env` for NodeJS or `Deno.env()` for Deno that matches the
   * interface `{ [key: string]: string | undefined }`.
   */
  environment?: Environment;

  /**
   * Setting the `target` to "test" with a `prefix` of "some" with and a `namespace` of "project"
   * and trying to resolve "url" will attempt to find "SOME_PROJECT_TEST_URL", "SOME_PROJECT_URL",
   * "PROJECT_URL" and "URL" in the given `environment` hash.
   */
  target?: string;
}

export const NamespacePattern = /[_\.]/;

export const DefaultEnvironment = Object.freeze({});

export const DefaultNamespace = '';

export const DefaultPrefix = '';

export const DefaultTarget = 'development';

export class MissingEnvironmentKeyError extends Error {
  constructor(...keys: EnvironmentKey[]) {
    super(`${keys.join(' or ')} must be provided.`);
  }
}

export class Env {
  constructor(options: EnvOptions) {
    const {
      environment = DefaultEnvironment,
      namespace = DefaultNamespace,
      prefix = DefaultPrefix,
      target = DefaultTarget,
    } = options;

    this.environment = environment;
    this.namespace = namespace;
    this.prefix = prefix;
    this.target = target;
  }

  /**
   * A hash that contains variables.
   */
  protected readonly environment: Environment;

  /**
   * A prefix that can help resolve environment variables and when set will further augment the
   * `namespace` setting.
   */
  protected readonly prefix: string = '';

  /**
   * A namespace that can help resolve environment variables.
   */
  protected readonly namespace: string = '';

  /**
   * A string for a given application's target runtime, typically "development", "production" or
   * "test" that can help differentiate similar environment variables based on target.
   */
  protected readonly target: string = '';


  /**
   * Returns prefixes split on the namespace pattern.
   */
  protected get prefixes(): string[] {
    return this.prefix.split(NamespacePattern);
  }

  /**
   * Returns namespaces split on the namespace pattern.
   */
  protected get namespaces(): string[] {
    return this.namespace.split(NamespacePattern);
  }

  /**
   * Returns targets split on the namespace pattern.
   */
  protected get targets(): string[] {
    return this.target.split(NamespacePattern);
  }

  /**
   * Returns keys split on the namespace pattern.
   *
   * @param {EnvironmentKey} key - An environment key
   * @returns {string[]} Keys split on the namespace pattern
   */
  protected keysFor(key: EnvironmentKey): string[] {
    return key.toString().split(NamespacePattern);
  }

  /**
   * Returns a key to be used in looking up an environment variable that contains the prefix,
   * namespace, target and provided keys.
   *
   * @param {string[]} keys - Keys that will be appended to the the end of the search path
   * @returns {string} A possible environment key
   */
  protected withPrefixesNamespacesTargetsKeyFor(keys: string[]): string {
    return [...this.prefixes, ...this.namespaces, ...this.targets, ...keys].join('_').toUpperCase();
  }

  /**
   * Returns a key to be used in looking up an environment variable that contains the namespace,
   * target and provided keys.
   *
   * @param {string[]} keys - Keys that will be appended to the the end of the search path
   * @returns {string} A possible environment key
   */
  protected withNamespacesTargetsKeyFor(keys: string[]): string {
    return [...this.namespaces, ...this.targets, ...keys].join('_').toUpperCase();
  }

  /**
   * Returns a key to be used in looking up an environment variable that contains the prefix,
   * namespace and provided keys.
   *
   * @param {string[]} keys - Keys that will be appended to the the end of the search path
   * @returns {string} A possible environment key
   */
  protected withPrefixesNamespacesKeyFor(keys: string[]): string {
    return [...this.prefixes, ...this.namespaces, ...keys].join('_').toUpperCase();
  }

  /**
   * Returns a key to be used in looking up an environment variable that contains the namespace and
   * provided keys.
   *
   * @param {string[]} keys - Keys that will be appended to the the end of the search path
   * @returns {string} A possible environment key
   */
  protected withNamespacesKeyFor(keys: string[]): string {
    return [...this.namespaces, ...keys].join('_').toUpperCase();
  }

  /**
   * Returns a key to be used in looking up an environment variable that contains the prefix and
   * provided keys.
   *
   * @param {string[]} keys - Keys that will be appended to the the end of the search path
   * @returns {string} A possible environment key
   */
   protected withPrefixesKeyFor(keys: string[]): string {
    return [...this.prefixes, ...keys].join('_').toUpperCase();
  }

  /**
   * Returns a key to be used in looking up an environment variable that contains the provided keys.
   *
   * @param {string[]} keys - Keys that will be appended to the the end of the search path
   * @returns {string} A possible environment key
   */
  protected withKeyFor(keys: string[]): string {
    return [...keys].join('_').toUpperCase();
  }

  /**
   * Returns a set of keys to be used in looking up an environment variable from the provided keys.
   *
   * @param {string[]} keys - Keys to be combined with combinations of prefix, namespace, and target
   * @returns {string[]} A set of keys to be used in looking up values from the Environment
   */
  protected fetchKeysFor(keys: string[]): string[] {
    return [
      this.withPrefixesNamespacesTargetsKeyFor(keys),
      this.withNamespacesTargetsKeyFor(keys),
      this.withPrefixesNamespacesKeyFor(keys),
      this.withNamespacesKeyFor(keys),
      this.withPrefixesKeyFor(keys),
      this.withKeyFor(keys)
    ];
  }

  /**
   * Checks to see if the given property exists in the Environment.
   *
   * @param {EnvironmentKey} key - Property that may exist in the Environment
   * @returns {boolean} Whether or not the property exists in the Environment
   */
  protected has(key: EnvironmentKey): boolean {
    return Reflect.has(this.environment, key);
  }

  protected some(keys: EnvironmentKey[]): boolean {
    return keys.some(this.has.bind(this));
  }

  protected find(keys: EnvironmentKey[]): EnvironmentKey {
    return keys.find(this.has.bind(this));
  }

  /**
   * Returns the raw value of a given property in the Environment without any gate.
   *
   * @param {EnvironmentKey} key - Property that may exist in the Environment
   * @returns {(string | undefined)} Value of the property in the Environment
   */
  protected get(key: EnvironmentKey): string | undefined {
    return Reflect.get(this.environment, key);
  }

  protected fetch(keys: EnvironmentKey[]): string | never {
    if (this.some(keys)) {
      return this.get(this.find(keys));
    } else {
      throw new MissingEnvironmentKeyError(...keys)
    }
  }

  with(target: string): this {
    return Reflect.construct(Reflect.get(Reflect.getPrototypeOf(this), 'constructor'),
      [this.environment, this.prefix, this.namespace, target]);
  }

  /**
   * Requires that a property exist in the Environment otherwise a MissingEnvironmentKey error will
   * be thrown.
   *
   * @param {EnvironmentKey} key - Property that is required to exist in the Environment
   * @throws {MissingEnvironmentKey} Error thrown if the property is missing from the Environment
   * @returns {string} Value of the property in the Environment
   */
  required(key: EnvironmentKey): string | never {
    return this.fetch(this.fetchKeysFor(this.keysFor(key.toString())));
  }

  /**
   * Similar to [required]{@link Base#required}, but optionally returns a default value. However, if
   * the default value is not provided, MissingEnvironmentKey will be thrown.
   *
   * @param {EnvironmentKey} key - Property that is optionally required to exist in the Environment
   * @param {string} [defaultValue] - Default value returned if the property doesn't exist
   * @throws {MissingEnvironmentKey} Error thrown if the property is missing from the Environment
   * @returns {string} Value of the property in the Environment
   */
  optional(key: EnvironmentKey, defaultValue?: string): string | never {
    try {
      return this.required(key);
    } catch (error) {
      if (defaultValue) {
        return defaultValue;
      } else {
        throw error;
      }
    }
  }
}
