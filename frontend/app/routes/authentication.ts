import Route from '@ember/routing/route';
import { service } from '@ember/service';
import {
  HTTP,
  X_LI_HEADER_ILT_MEMBER_ID,
  X_LI_HEADER_ILT_PROFILE_TYPE,
} from '../utils/constants';
import { getCsrfToken } from '../utils/cookies';
import { PemberlyNetworkService } from '@linkedin/ember-cli-pemberly-network';
import type RouterService from '@ember/routing/router-service';
import type InlineTranslationApiService from 'inline-translation-web/services/inline-translation-api';
import { action } from '@ember/object';
import type HueWebToastService from '@linkedin/hue-web-toast/addon/services/hue-web-toast';
import type I18nService from '@linkedin/ember-cli-pemberly-i18n/addon/services/i18n';

const ERROR_CODES_TO_TOAST = [400, 403, 500];
export default class AuthenticationRoute extends Route {
  @service('pemberly-network')
  declare pemberlyNetwork: PemberlyNetworkService;

  @service('inline-translation-api')
  declare inlineTranslationApi: InlineTranslationApiService;

  @service('router')
  declare router: RouterService;

  @service('hue-web-toast')
  declare toastService: HueWebToastService;

  @service('i18n')
  declare i18n: I18nService;

  override async model(): Promise<unknown> {
    const [language, country] = this.inlineTranslationApi.interfaceLocale;

    const url = `/inline-translation-api/translationProposalEditor?q=search&criteria=(targetLocale:(country:${country},language:${language}),viewType:TRANSLATE)`;

    const response = await this.pemberlyNetwork.fetch(url, {
      method: 'GET',
      returnXHR: true,
      headers: {
        ...HTTP.DEFAULT_HEADERS,
        'Csrf-Token': getCsrfToken(),
      },
    });

    const userProfileType = response.headers.get(
      X_LI_HEADER_ILT_PROFILE_TYPE
    ) as UserProfileType;
    const memberUrn = response.headers.get(
      X_LI_HEADER_ILT_MEMBER_ID
    ) as MemberUrnType;

    if (response.ok && userProfileType) {
      this.inlineTranslationApi.userProfileType = userProfileType;
    }

    if (response.ok && memberUrn) {
      this.inlineTranslationApi.memberId = memberUrn;
    }

    if (response.ok) {
      return await response.json();
    } else {
      throw response;
    }
  }

  /**
   * Called when API call fails from model() hook
   * @param error - Response
   */
  @action
  override error(error: Response): void {
    const statusCode = error.status ?? error.response.status;
    if (ERROR_CODES_TO_TOAST.includes(statusCode)) {
      this.toastService.add({
        type: 'error',
        message: this.i18n.lookupTranslation(
          'authentication',
          'i18n_toast_general_error'
        )([]),
      });
    }

    this.router.transitionTo('error', {
      queryParams: { errorCode: error.status ?? error.response.status },
    });
  }
}
