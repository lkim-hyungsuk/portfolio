import { action } from '@ember/object';
import Component from '@glimmer/component';
import { guidFor } from '@ember/object/internals';
import { inject as service } from '@ember/service';
import { HTTP, XMESSAGE_ERROR_DOC } from '../utils/constants';
import { getCsrfToken, getInterfaceLocale } from '../utils/cookies';
import { tracked } from '@glimmer/tracking';
import { isBrowser } from '../utils/environment-utils';
import HueWebToastService from '@linkedin/hue-web-toast/addon/services/hue-web-toast';
import I18nService from '@linkedin/ember-cli-pemberly-i18n/addon/services/i18n';
import type { PemberlyNetworkService } from '@linkedin/ember-cli-pemberly-network';
import type InlineTranslationApiService from 'inline-translation-web/services/inline-translation-api';
import {
  HttpMethodEnum,
  UserProfileEnum,
} from 'inline-translation-web/services/inline-translation-api';
import { debounce } from '@ember/runloop';
import { StatusTypeEnum } from 'inline-translation-web/components/vote-proposal-list-item';

interface ProposalListItemComponentSignature {
  Args: {
    proposal: PubInlineTranslationProposalEditor;
  };
}

interface FilteredProposals {
  own: PubInlineTranslationProposal[];
  others: PubInlineTranslationProposal[];
}

export default class ProposalListItemComponent extends Component<ProposalListItemComponentSignature> {
  @service('hue-web-toast')
  declare toastService: HueWebToastService;

  @service('i18n')
  declare i18n: I18nService;

  @service('pemberly-network')
  declare pemberlyNetwork: PemberlyNetworkService;

  @service('inline-translation-api')
  declare inlineTranslationApi: InlineTranslationApiService;

  @tracked
  targetTranslation?: string | undefined = this.ownProposal?.targetTranslation;

  @tracked
  issues: Array<string> = [];

  @tracked
  ownProposalVariants: Array<string> = this.ownProposal?.variants
    ? this.ownProposal?.variants.variants
    : [];

  @tracked
  shouldHighlightTextarea: boolean = false;

  @tracked
  isLoading: boolean = false;

  @tracked
  isCreating: boolean = false;

  @tracked
  isError: boolean = false;

  @tracked
  isSubmitted: boolean = !!this.ownProposal;

  @tracked
  showSubmit: boolean = false;

  @tracked
  ownProposalStatus: StatusType | undefined = this.ownProposal?.status;

  get guid(): string {
    return guidFor(this);
  }

  get isSingleError(): boolean {
    return this.issues.length === 1;
  }

  get interfaceLocale(): Array<string> {
    const interfaceLocale = getInterfaceLocale(); // e.g. ko-kr, en-us
    return interfaceLocale ? interfaceLocale.split('-') : [];
  }

  get isManager(): boolean {
    return (
      this.inlineTranslationApi.userProfileType === UserProfileEnum.MANAGER
    );
  }

  get filteredProposals(): FilteredProposals {
    const memberId = this.inlineTranslationApi.memberId;

    return this.args.proposal.proposals.reduce<FilteredProposals>(
      ({ own, others }, proposal) => {
        if (proposal.author === memberId) {
          return { own: [...own, proposal], others };
        } else {
          return { own, others: [...others, proposal] };
        }
      },
      { own: [], others: [] }
    );
  }

  get ownProposal(): PubInlineTranslationProposal | undefined {
    return this.filteredProposals.own[0];
  }

  get otherProposals(): PubInlineTranslationProposal[] {
    return this.filteredProposals.others;
  }

  @action
  highlightTextarea(shouldHighlightTextarea: boolean): void {
    this.shouldHighlightTextarea =
      !!this.targetTranslation || shouldHighlightTextarea;
  }

  @action
  async create(): Promise<void> {
    const url = `/inline-translation-api/translationProposal`;
    const [language, country] = this.interfaceLocale;
    try {
      this.isCreating = true;
      const response = await this.pemberlyNetwork.fetch(url, {
        method: 'POST',
        returnXHR: true,
        headers: {
          ...HTTP.DEFAULT_HEADERS,
          'Csrf-Token': getCsrfToken(),
        },
        body: JSON.stringify({
          fingerprint: this.args.proposal.fingerprint,
          targetLocale: {
            language,
            country,
          },
          targetTranslation: this.targetTranslation,
        }),
      });
      if (response.ok) {
        this.showToast('success', 'i18n_submit_toast_msg_success');
        this.showSubmit = false;
        this.isSubmitted = true;
        return;
      }
    } catch (error) {
      this.isError = true;
      this.showToast('error', 'i18n_submit_toast_msg_error');
    } finally {
      this.isCreating = false;
    }
  }

  async validate(): Promise<Response> {
    const url = `/inline-translation-api/translationProposal?action=validate`;
    const [language, country] = this.interfaceLocale;
    const response = await this.pemberlyNetwork.fetch(url, {
      method: 'POST',
      returnXHR: true,
      headers: {
        ...HTTP.DEFAULT_HEADERS,
        'Csrf-Token': getCsrfToken(),
      },
      body: JSON.stringify({
        proposal: {
          fingerprint: this.args.proposal.fingerprint,
          targetLocale: {
            language,
            country,
          },
          targetTranslation: this.targetTranslation,
        },
      }),
    });
    return response;
  }

  async createVariants(): Promise<void> {
    const url = `/inline-translation-api/translationVariants?action=variate`;
    const [language, country] = this.interfaceLocale;

    const response: Response = await this.pemberlyNetwork.fetch(url, {
      method: 'POST',
      returnXHR: true,
      headers: {
        ...HTTP.DEFAULT_HEADERS,
        'Csrf-Token': getCsrfToken(),
      },
      body: JSON.stringify({
        variantRequest: {
          translation: this.targetTranslation,
          locale: {
            language: language?.toLowerCase(),
            country: country?.toUpperCase(),
          },
        },
      }),
    });
    if (response.ok) {
      const responseBody = await response.json();
      this.ownProposalVariants = responseBody.value.variants;
      this.showSubmit = true;
    }
  }

  showToast(type: string, key: string): void {
    this.toastService.add({
      type,
      message: this.i18n.lookupTranslation(
        'components/proposal-list-item',
        key
      )([]),
    });
  }

  @action
  copy(isForTarget: boolean): void {
    const target = isForTarget ? 'editable' : 'readonly';
    let copied: string;
    const textareaElement: HTMLInputElement | null =
      document.querySelector<HTMLInputElement>(
        `.proposal-list-item__text-area--${target}-${this.guid}`
      );
    if (textareaElement) {
      copied = textareaElement.value;
      navigator.clipboard.writeText(copied);
      this.showToast('success', 'i18n_proposal_list_copy_success');
    } else {
      this.showToast('error', 'i18n_proposal_list_copy_error');
    }
  }

  @action
  openHelpLink(errorId: string): void {
    if (isBrowser()) {
      window.open(`${XMESSAGE_ERROR_DOC}/${errorId}`, '_blank');
    }
  }

  async generateVariants(): Promise<void> {
    try {
      this.isLoading = true;
      const response = await this.validate();
      if (response.ok) {
        const responseBody = await response.json();
        this.issues = responseBody.value.issues;
        if (!this.issues.length) {
          this.isError = false;
          await this.createVariants();
        } else {
          this.isError = true;
        }
      } else {
        this.isError = true;
        this.showToast('error', 'i18n_submit_toast_msg_error');
      }
    } catch {
      this.isError = true;
      this.showToast('error', 'i18n_submit_toast_msg_error');
    } finally {
      this.isLoading = false;
    }
  }

  @action
  setTargetTranslation(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.targetTranslation = target.value;

    if (!this.targetTranslation) {
      this.ownProposalVariants = [];
      this.reset();
    } else {
      debounce(this, this.generateVariants, 300);
    }
  }

  @action
  async handleTranslationProposal(
    method: HttpMethodType = HttpMethodEnum.DELETE
  ): Promise<void> {
    try {
      const isDeleting = method === HttpMethodEnum.DELETE;
      const ownProposal = this.filteredProposals.own[0];

      if (isDeleting && ownProposal) {
        await this.inlineTranslationApi.handleTranslationProposal(ownProposal, {
          method,
        });
      }

      this.showToast('success', 'i18n_vote_proposal_delete_success');
      this.ownProposalStatus = StatusTypeEnum.REJECTED;
    } catch (error) {
      this.showToast('error', 'i18n_vote_proposal_error');
    }
  }

  @action
  reset(): void {
    this.isError = false;
    this.isLoading = false;
    this.isCreating = false;
    this.showSubmit = false;
    this.issues = [];
  }
}
