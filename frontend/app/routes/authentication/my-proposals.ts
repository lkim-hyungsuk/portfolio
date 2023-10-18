import Route from '@ember/routing/route';
import { service } from '@ember/service';
import type Controller from '@ember/controller';
import type InlineTranslationApiService from 'inline-translation-web/services/inline-translation-api';

export default class AuthenticationMyProposalRoute extends Route {
  @service('inline-translation-api')
  declare inlineTranslationApi: InlineTranslationApiService;

  override async model(): Promise<RestliResponseModel> {
    const response: RestliResponseModel =
      await this.inlineTranslationApi.fetchProposalList('MY_PROPOSALS');
    return response;
  }

  override setupController(
    controller: Controller,
    model: RestliResponseModel
  ): void {
    controller.currentProposalList = model;
  }
}
