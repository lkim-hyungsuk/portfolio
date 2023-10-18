import Controller from '@ember/controller';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import type InlineTranslationApiService from 'inline-translation-web/services/inline-translation-api';

const VIEW_TYPE_MY_PROPOSALS = 'MY_PROPOSALS';

export default class AuthenticationMyProposalsController extends Controller {
  @service('inline-translation-api')
  declare inlineTranslationApi: InlineTranslationApiService;

  @tracked currentProposalList: RestliResponseModel = {
    elements: [],
    paging: {
      count: 10,
      links: [],
      start: 0,
    },
  };

  @action
  async onInfiniteScroll(): Promise<void> {
    if (this.isDestroying || this.currentProposalList.elements.length < 10) {
      return;
    }

    const currentProposalList = this.currentProposalList.elements;
    const newUrl =
      this.inlineTranslationApi.createTranslationProposalEditorUrl(
        VIEW_TYPE_MY_PROPOSALS
      ) + `&start=${currentProposalList.length}`;

    const response: RestliResponseModel =
      await this.inlineTranslationApi.fetchProposalList(
        VIEW_TYPE_MY_PROPOSALS,
        { newUrl }
      );

    currentProposalList.push(...response.elements);
    this.currentProposalList = {
      elements: currentProposalList,
      paging: this.currentProposalList.paging,
    };

    return;
  }
}
