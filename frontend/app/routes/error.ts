import Route from '@ember/routing/route';
import type RouterService from '@ember/routing/router-service';
import type Transition from '@ember/routing/transition';
import { service } from '@ember/service';
import { getInterfaceLocale } from 'inline-translation-web/utils/cookies';

export default class ErrorRoute extends Route {
  @service('router')
  declare router: RouterService;

  override model(params: { errorCode: string }) {
    return params;
  }
}
