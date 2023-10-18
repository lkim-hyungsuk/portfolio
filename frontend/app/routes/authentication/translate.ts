import Route from '@ember/routing/route';
import { service } from '@ember/service';
import type Controller from '@ember/controller';
import type InlineTranslationApiService from 'inline-translation-web/services/inline-translation-api';

export default class AuthenticationTranslateRoute extends Route {
  @service('inline-translation-api')
  declare inlineTranslationApi: InlineTranslationApiService;

  override model(): unknown {
    return this.modelFor('authentication');
  }

  override setupController(
    controller: Controller,
    model: RestliResponseModel
  ): void {
    controller.currentProposalList = model;
  }
}
