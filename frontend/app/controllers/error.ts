import Controller from '@ember/controller';
import { getEnvironmentHost } from 'inline-translation-web/utils/environment-host';

export default class ErrorController extends Controller {
  queryParams = ['errorCode'];
  errorCode = null;

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
}
