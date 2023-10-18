import Controller, { inject as controller } from '@ember/controller';
import { action } from '@ember/object';
import { service } from '@ember/service';
import type InlineTranslationApiService from 'inline-translation-web/services/inline-translation-api';
import { tracked } from '@glimmer/tracking';

const VIEW_TYPE_NEED_APPROVAL = 'NEED_APPROVAL';

export default class AuthenticationApproveController extends Controller {
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

    const queryParamOverwrite = {
      start: this.currentProposalList.elements.length,
    };

    const newUrl =
      this.inlineTranslationApi.createTranslationProposalEditorUrl(
        VIEW_TYPE_NEED_APPROVAL
      ) + `&start=${queryParamOverwrite.start}`;

    const response: RestliResponseModel =
      await this.inlineTranslationApi.fetchProposalList(
        VIEW_TYPE_NEED_APPROVAL,
        {
          newUrl,
        }
      );

    this.currentProposalList.elements.push(...response.elements);

    this.currentProposalList = {
      ...this.currentProposalList,
      elements: this.currentProposalList.elements,
    };

    return;
  }
}
