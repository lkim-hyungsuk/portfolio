import Component from '@glimmer/component';
import { service } from '@ember/service';
import type InlineTranslationApiService from 'inline-translation-web/services/inline-translation-api';

interface ProposalListComponentSignature {
  Args: {
    proposalList: RestliResponseModel;
    onInfiniteScroll: () => void;
  };
}

export default class ProposalListComponent extends Component<ProposalListComponentSignature> {
  @service('inline-translation-api')
  declare inlineTranslationApi: InlineTranslationApiService;
}
