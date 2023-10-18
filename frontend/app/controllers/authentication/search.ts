import Controller from '@ember/controller';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import type InlineTranslationApiService from 'inline-translation-web/services/inline-translation-api';
import type HueWebToastService from '@linkedin/hue-web-toast/addon/services/hue-web-toast';
import type I18nService from '@linkedin/ember-cli-pemberly-i18n/addon/services/i18n';

const VIEW_TYPE_SEARCH: ViewType = 'SEARCH';

export default class AuthenticationSearchController extends Controller {
  @service('inline-translation-api')
  declare inlineTranslationApi: InlineTranslationApiService;

  @service('hue-web-toast')
  declare toastService: HueWebToastService;

  @service('i18n')
  declare i18n: I18nService;

  @tracked searchFilter: SearchFilter = {};
  @tracked isSubmitting = false;
  @tracked shouldFetchMore = true;
  @tracked currentProposalList: RestliResponseModel = {
    elements: [],
    paging: {
      count: 10,
      links: [],
      start: 0,
    },
  };

  @action
  async onSubmit(searchFilter: SearchFilter): Promise<void> {
    this.isSubmitting = true;
    try {
      const response = await this.inlineTranslationApi.fetchProposalList(
        VIEW_TYPE_SEARCH,
        { searchFilter }
      );
      this.searchFilter = searchFilter;
      this.currentProposalList = response;
      this.isSubmitting = false;
    } catch (error) {
      this.toastService.add({
        type: 'error',
        message: this.i18n.lookupTranslation(
          'authentication',
          'i18n_toast_general_error'
        )([]),
      });
    }
  }

  @action
  async onInfiniteScroll(): Promise<void> {
    if (this.isDestroying || this.currentProposalList.elements.length < 10) {
      return;
    }

    const queryParamOverwrite = {
      start: this.currentProposalList.elements.length,
    };

    const searchFilter = this.searchFilter;
    const newUrl =
      this.inlineTranslationApi.createTranslationProposalEditorUrl(
        VIEW_TYPE_SEARCH,
        searchFilter
      ) + `&start=${queryParamOverwrite.start}`;

    const response: RestliResponseModel =
      await this.inlineTranslationApi.fetchProposalList(VIEW_TYPE_SEARCH, {
        newUrl,
      });

    this.shouldFetchMore = response.elements.length > 0 ? true : false;

    this.currentProposalList.elements.push(...response.elements);
    this.currentProposalList = {
      ...this.currentProposalList,
      elements: this.currentProposalList.elements,
    };

    return;
  }
}
