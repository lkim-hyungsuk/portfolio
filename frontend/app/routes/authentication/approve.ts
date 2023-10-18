import Route from '@ember/routing/route';
import type Controller from '@ember/controller';
import type InlineTranslationApiService from 'inline-translation-web/services/inline-translation-api';
import { service } from '@ember/service';

export default class AuthenticationApproveRoute extends Route {
  @service('inline-translation-api')
  declare inlineTranslationApi: InlineTranslationApiService;

  override async model(): Promise<RestliResponseModel> {
    const response: RestliResponseModel =
      await this.inlineTranslationApi.fetchProposalList('NEED_APPROVAL');
    return response;
  }

  override setupController(
    controller: Controller,
    model: RestliResponseModel
  ): void {
    controller.currentProposalList = model;
  }
}
