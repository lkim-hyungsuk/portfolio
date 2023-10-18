import { typeOf } from '@ember/utils';
import { isBrowser } from './environment-utils';

const DEFAULT_FABRIC = 'linkedin';
const DEFAULT_DOMAIN = '.com';
const SUPPORTED_DOMAINS = [DEFAULT_DOMAIN];

const EnvironmentHost = {
  // for testing purposes we want to be able to replace the window object here
  window: window as Window & typeof globalThis,

  get hostname(): string {
    if (isBrowser()) {
      return this.window.location.hostname;
    }

    return '';
  },

  get FABRIC(): string {
    return this.getFabric(this.hostname);
  },

  /**
   * Gets the current domain. Function exported for unit testing.
   * @return {String} returns a string for the current domain e.g.: ".com" or ".cn"
   */
  getLinkedinDomain(): string {
    if (!this.hostname) {
      return DEFAULT_DOMAIN;
    }

    const matches: RegExpMatchArray | null = this.hostname.match(
      /linkedin(?:-\w+)?(\.\w+)/
    );

    if (!matches) {
      return DEFAULT_DOMAIN;
    }

    const domain: string | undefined = matches.pop();

    if (!domain || (domain && SUPPORTED_DOMAINS.indexOf(domain) < 0)) {
      return DEFAULT_DOMAIN;
    }

    return domain;
  },

  /**
   * Gets the current fabric. Function exported for unit testing.
   * @return {String} returns a string for the current fabric: "linkedin" or "linkedin-<fabric>"
   */
  getFabric(str: string): string {
    if (typeOf(str) !== 'string') {
      return DEFAULT_FABRIC;
    }

    const matches: RegExpMatchArray | null = str.match(/(linkedin(?:-\w+)?)\./);

    if (!matches) {
      return DEFAULT_FABRIC;
    }

    return matches.pop() || '';
  },

  /**
   * Gets the current environment host name with protocol
   * @param {boolean} [preserveFabric=true] - whether to preserve the current fabric or use prod always
   * @param {string} [protocol='https'] - the protocol to use for environment host
   * @param {string} [hostnamePrefix='www'] - the prefix of the hostname that should be used
   * @return {string}
   */
  getEnvironmentHost(
    preserveFabric = true,
    protocol = 'https',
    hostnamePrefix = 'www'
  ): string {
    const FABRIC = preserveFabric ? this.FABRIC : DEFAULT_FABRIC;

    // Prepend www. in front of the fabric by default as services such as UAS expect destination URLs to containing this subdomain.
    return `${protocol}://${hostnamePrefix}.${FABRIC}${this.getLinkedinDomain()}`;
  },
};

export default EnvironmentHost;
export const getEnvironmentHost =
  EnvironmentHost.getEnvironmentHost.bind(EnvironmentHost);
export const FABRIC = EnvironmentHost.FABRIC;
