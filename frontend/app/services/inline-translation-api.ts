import Service, { service } from '@ember/service';
import type I18nService from '@linkedin/ember-cli-pemberly-i18n/addon/services/i18n';
import type { PemberlyNetworkService } from '@linkedin/ember-cli-pemberly-network';
import { HTTP } from 'inline-translation-web/utils/constants';
import {
  getCsrfToken,
  getInterfaceLocale,
} from 'inline-translation-web/utils/cookies';
import { reject } from 'rsvp';
import { encode } from '@linkedin/restli-utils';
import { StatusTypeEnum } from 'inline-translation-web/components/vote-proposal-list-item';

export enum UserProfileEnum {
  CONTRIBUTOR = 'CONTRIBUTOR',
  MODERATOR = 'MODERATOR',
  MANAGER = 'MANAGER',
  ADMINISTRATOR = 'ADMINISTRATOR',
  CS_USER = 'CS_USER',
}

export enum HttpMethodEnum {
  GET = 'GET',
  POST = 'POST',
  DELETE = 'DELETE',
}

export default class InlineTranslationApiService extends Service {
  @service('pemberly-network')
  declare pemberlyNetwork: PemberlyNetworkService;

  @service('i18n')
  declare i18n: I18nService;

  userProfileType: UserProfileType = undefined;

  memberId: MemberUrnType = undefined;

  get interfaceLocale(): [string, string] {
    const interfaceLocale = getInterfaceLocale();
    const parts = interfaceLocale.split('-');
    if (parts.length !== 2) {
      reject({
        status: 403,
        message: 'Locale must contain exactly two parts',
      });
    }
    return parts as [string, string];
  }

  get targetLanguage(): string {
    const [language, country] = this.interfaceLocale;
    return this.i18n.lookupTranslation(
      'helpers/supported-locales',
      `i18n_language_${language}_${country?.toUpperCase()}`
    )([]);
  }

  /**
   * Create a url for /translationProposalEditor
   * @param viewType string
   * @param searchFilter SearchFilter
   * @returns string
   */
  createTranslationProposalEditorUrl(
    viewType: ViewType,
    searchFilter: SearchFilter = {}
  ): string {
    const [language, country] = this.interfaceLocale;
    const { originalTextFilters, proposalTextFilters, fingerprint } =
      searchFilter;
    const criteria: SearchCriteria = {
      targetLocale: {
        country,
        language,
      },
      viewType,
    };

    if (originalTextFilters && originalTextFilters?.length) {
      criteria.originalTextFilters = originalTextFilters;
    }

    if (proposalTextFilters && proposalTextFilters?.length) {
      criteria.proposalTextFilters = proposalTextFilters;
    }

    if (fingerprint) {
      criteria.fingerprint = fingerprint;
    }

    return `/inline-translation-api/translationProposalEditor?q=search&criteria=${encode(
      criteria
    )}`;
  }

  /**
   * Fetch the list of proposals
   * @param url - The URL for fetching data
   * @param options - options for the fetch call
   * @param options.newUrl - string
   * @param options.searchFilter - SearchFilter
   * @returns Promise<RestliResponseModel>
   */
  async fetchProposalList(
    viewType: ViewType,
    options?: {
      newUrl?: string;
      searchFilter?: SearchFilter;
    }
  ): Promise<RestliResponseModel> {
    const response = await this.pemberlyNetwork.fetch(
      options?.newUrl
        ? options.newUrl
        : this.createTranslationProposalEditorUrl(
            viewType,
            options?.searchFilter
          ),
      {
        method: 'GET',
        returnXHR: true,
        headers: {
          ...HTTP.DEFAULT_HEADERS,
          'Csrf-Token': getCsrfToken(),
        },
      }
    );

    if (response.ok) {
      const data = await response.json();

      return {
        elements: data.elements,
        paging: data.paging,
      };
    }

    return reject(response);
  }

  /**
   * Handles API calls for voting on a proposal
   * @param options - options for the fetch call
   * @param options.method - string
   * @param options.body - PubInlineTranslationProposalVote
   * @param options.newUrl - string
   * @returns Promise<Response>
   */
  async handleTranslationProposalVote(options: {
    method?: string;
    body?: PubInlineTranslationProposalVote;
    newUrl?: string;
  }): Promise<Response | PubInlineTranslationProposalVoteResponse | void> {
    if (!options.method) options.method = HttpMethodEnum.POST;

    const response = await this.pemberlyNetwork.fetch(
      options.newUrl
        ? options.newUrl
        : `/inline-translation-api/translationProposalVote`,
      {
        method: options.method,
        returnXHR: true,
        headers: {
          ...HTTP.DEFAULT_HEADERS,
          'Csrf-Token': getCsrfToken(),
        },
        body: options.body ? JSON.stringify(options.body) : null,
      }
    );

    if (response.ok && response.status === 200) {
      return await response.json();
    } else if (response.ok) {
      return;
    }

    return reject(response);
  }

  /**
   * Approve / Delete a proposal
   * @param proposal - PubInlineTranslationProposal
   * @returns Promise<Response>
   */
  async handleTranslationProposal(
    proposal: PubInlineTranslationProposal,
    options?: {
      method?: HttpMethodType;
      proposalStatus?: StatusTypeEnum;
    }
  ): Promise<void> {
    let url = `/inline-translation-api/translationProposal`;
    let body = null;

    if (!options) {
      options = {
        method: HttpMethodEnum.POST,
        proposalStatus: StatusTypeEnum.PROPOSED,
      };
    }

    const method = options.method;
    if (method === HttpMethodEnum.DELETE) {
      const { author, fingerprint, targetLocale } = proposal;
      url =
        `/inline-translation-api/translationProposal/` +
        encode({
          author,
          fingerprint,
          targetLocale,
        } as PubInlineTranslationProposalInput);
    } else {
      const { author, fingerprint, targetLocale } = proposal;
      url =
        url +
        `/${encode({
          author,
          fingerprint,
          targetLocale,
        })}`;
      body = {
        patch: {
          $set: {
            status: options.proposalStatus,
          },
        },
      };
    }

    const response = await this.pemberlyNetwork.fetch(url, {
      returnXHR: true,
      method,
      headers: {
        ...HTTP.DEFAULT_HEADERS,
        'Csrf-Token': getCsrfToken(),
      },
      body: body ? JSON.stringify(body) : null,
    });

    if (!response.ok) {
      return reject(response);
    }

    return;
  }
}

declare module '@ember/service' {
  interface Registry {
    'inline-translation-api': InlineTranslationApiService;
  }
}
