import { action } from '@ember/object';
import { service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import type I18nService from '@linkedin/ember-cli-pemberly-i18n/addon/services/i18n';
import type HueWebToastService from '@linkedin/hue-web-toast/addon/services/hue-web-toast';
import { encode } from '@linkedin/restli-utils';
import type InlineTranslationApiService from 'inline-translation-web/services/inline-translation-api';
import {
  HttpMethodEnum,
  UserProfileEnum,
} from 'inline-translation-web/services/inline-translation-api';

interface VoteProposalListItemSignature {
  Args: {
    proposal: PubInlineTranslationProposal;
  };
}

export enum StatusTypeEnum {
  PROPOSED = 'PROPOSED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED', // required to mark "to be deleted"
}

export default class VoteProposalListItemComponent extends Component<VoteProposalListItemSignature> {
  @service('inline-translation-api')
  declare inlineTranslationApi: InlineTranslationApiService;

  @service('hue-web-toast')
  declare toastService: HueWebToastService;

  @service('i18n')
  declare i18n: I18nService;

  @tracked
  latestVoteType: VoteType = this.args.proposal.voteType;

  @tracked
  latestStatus: StatusType = this.args.proposal.status;

  /**
   * Whether the current user is a moderator
   * @returns boolean
   */
  get canAccess(): boolean {
    return (
      this.inlineTranslationApi.userProfileType !==
        UserProfileEnum.CONTRIBUTOR &&
      this.inlineTranslationApi.userProfileType !== UserProfileEnum.CS_USER
    );
  }

  /**
   * Delete existing translation proposal vote for given proposal vote key.
   * https://sceptre.corp.linkedin.com/service-detail/translationProposalVote/resource/translationProposalVote/details#methods,delete
   * @param body - PubInlineTranslationProposalVote
   * @returns void
   */
  async deleteVoteProposal(
    body: PubInlineTranslationProposalVote
  ): Promise<void> {
    const newUrl = this._createRestliUrl(body);

    await this.inlineTranslationApi.handleTranslationProposalVote({
      method: 'DELETE',
      newUrl,
    });
  }

  /**
   * Return the proposal vote for the given key which is made up of fingerprint, target locale and proposal owner.
   * https://sceptre.corp.linkedin.com/service-detail/translationProposalVote/resource/translationProposalVote/details#methods,get
   * @param voteType - VoteType
   * @param body - PubInlineTranslationProposalVote
   * @returns Promise<void>
   */
  async getVoteProposal(
    voteType: VoteType,
    body: PubInlineTranslationProposalVote
  ): Promise<void> {
    const newUrl = this._createRestliUrl(body);

    const response =
      (await this.inlineTranslationApi.handleTranslationProposalVote({
        method: 'GET',
        newUrl,
      })) as PubInlineTranslationProposalVoteResponse;

    this.latestVoteType = response.voteType;
  }

  /**
   * Called when the user interacts with Vote icons
   * @param voteType - VoteType
   * @returns Promise<void>
   */
  @action
  async handleProposalVote(voteType: VoteType): Promise<void> {
    const body: PubInlineTranslationProposalVote = {
      fingerprint: this.args.proposal.fingerprint,
      targetLocale: this.args.proposal.targetLocale,
      voteType,
      author: this.args.proposal.author,
    };
    try {
      if (this.latestVoteType === voteType) {
        // undo the vote
        await this.deleteVoteProposal(body);
        await this.getVoteProposal(voteType, body);
        this._showToast('success', 'i18n_vote_proposal_unvote_success');
        this.latestVoteType = undefined;
      } else {
        // update with a new vote
        await this.inlineTranslationApi.handleTranslationProposalVote({
          body,
        });
        this.latestVoteType = voteType;
        this._showToast('success', 'i18n_vote_proposal_success');
      }
    } catch (error) {
      this._showToast('error', 'i18n_vote_proposal_error');
    }
  }

  @action
  async handleTranslationProposal(
    method: HttpMethodType = HttpMethodEnum.POST
  ): Promise<void> {
    try {
      const isDeleting = method === HttpMethodEnum.DELETE;

      if (isDeleting) {
        await this.inlineTranslationApi.handleTranslationProposal(
          this.args.proposal,
          {
            method,
          }
        );
      } else {
        await this.inlineTranslationApi.handleTranslationProposal(
          this.args.proposal,
          {
            method,
            proposalStatus: StatusTypeEnum.ACCEPTED,
          }
        );
      }

      this._showToast(
        'success',
        isDeleting
          ? 'i18n_vote_proposal_delete_success'
          : this.latestStatus === StatusTypeEnum.ACCEPTED
          ? 'i18n_vote_proposal_approve_already_submitted'
          : 'i18n_vote_proposal_approve_success'
      );

      this.latestStatus = isDeleting
        ? StatusTypeEnum.REJECTED
        : StatusTypeEnum.ACCEPTED;
    } catch (error) {
      this._showToast('error', 'i18n_vote_proposal_error');
    }
  }

  /**
   * @param type - string
   * @param key - string
   */
  _showToast(type: string, key: string): void {
    this.toastService.add({
      type,
      message: this.i18n.lookupTranslation(
        'components/vote-proposal-list-item',
        key
      )([]),
    });
  }

  /**
   * @param body - PubInlineTranslationProposalVote
   * @returns string
   */
  _createRestliUrl(body: PubInlineTranslationProposalVote): string {
    return `/inline-translation-api/translationProposalVote/(author:${encodeURIComponent(
      body.author
    )},fingerprint:${body.fingerprint},targetLocale:${encode(
      body.targetLocale
    )})`;
  }
}
