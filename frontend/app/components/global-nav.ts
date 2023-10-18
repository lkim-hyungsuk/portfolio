import Component from '@glimmer/component';
import { getEnvironmentHost } from '../utils/environment-host';
import { getCsrfToken } from '../utils/cookies';
import { service } from '@ember/service';
import type RouterService from '@ember/routing/router-service';

interface GlobalNavComponentArgs {
  Args: {
    shouldSignIn: boolean;
  };
}

export default class GlobalNavComponent extends Component<GlobalNavComponentArgs> {
  @service('router')
  declare router: RouterService;

  get encodedCurrentUrl(): string {
    const currentUrl = window.location.href;
    const index = currentUrl.lastIndexOf('/error');

    // if user signs in again while staying on sub-route (e.g /translate, /search..), we need to strip the sub-route 'error' from the url
    const strippedUrl =
      index > -1 ? currentUrl.substring(0, index) : currentUrl;
    return encodeURIComponent(strippedUrl);
  }

  get linkedinSignInUrl(): string {
    return `${getEnvironmentHost()}/uas/login?session_redirect=${
      this.encodedCurrentUrl
    }`;
  }

  get linkedinSignOutUrl(): string {
    const linkedinSignOutUrl = `${getEnvironmentHost()}/uas/logout?csrfToken=${getCsrfToken()}&session_redirect=${
      this.encodedCurrentUrl
    }`;

    return linkedinSignOutUrl;
  }
}
