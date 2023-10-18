import Component from '@glimmer/component';
import { service } from '@ember/service';
import type InlineTranslationApiService from 'inline-translation-web/services/inline-translation-api';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

enum FilterTypeEnum {
  OriginalTextFilters = 'originalTextFilters',
  ProposalTextFilters = 'proposalTextFilters',
  Fingerprint = 'fingerprint',
}

interface SearchBarComponentSignature {
  Args: {
    onSubmit: (searchFilter: SearchFilter) => void;
    isSubmitting: boolean;
  };
}
export default class SearchBarComponent extends Component<SearchBarComponentSignature> {
  @tracked originalTextFilters: string[] = [];
  @tracked proposalTextFilters: string[] = [];
  @tracked fingerprint: string | undefined = '';

  @service('inline-translation-api')
  declare inlineTranslationApi: InlineTranslationApiService;

  get FilterTypeEnum(): typeof FilterTypeEnum {
    return FilterTypeEnum;
  }

  get searchFilter(): SearchFilter {
    const { originalTextFilters, proposalTextFilters, fingerprint } = this;

    return {
      originalTextFilters,
      proposalTextFilters,
      fingerprint,
    };
  }

  @action
  onChange(filterType: FilterType, event: Event): void {
    const target = event.target as HTMLInputElement;
    const inputValue: string = encodeURIComponent(target.value);

    if (filterType === FilterTypeEnum.OriginalTextFilters) {
      this.originalTextFilters = inputValue ? inputValue.split('%20') : [];
    } else if (filterType === FilterTypeEnum.ProposalTextFilters) {
      this.proposalTextFilters = inputValue ? inputValue.split('%20') : [];
    } else if (filterType === FilterTypeEnum.Fingerprint) {
      this.fingerprint = inputValue;
    }
  }

  @action
  submitSearchCriteria(event: KeyboardEvent): void {
    if (event.ctrlKey && event.key === 'Enter') {
      this.args.onSubmit(this.searchFilter);
    }
  }

  @action
  clearInput(filterType: FilterType): void {
    if (filterType === FilterTypeEnum.OriginalTextFilters) {
      this.originalTextFilters = [];
    } else if (filterType === FilterTypeEnum.ProposalTextFilters) {
      this.proposalTextFilters = [];
    } else if (filterType === FilterTypeEnum.Fingerprint) {
      this.fingerprint = undefined;
    }
  }
}
