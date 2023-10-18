import { service } from '@ember/service';
import Component from '@glimmer/component';
import type InlineTranslationApiService from 'inline-translation-web/services/inline-translation-api';

export default class LayoutComponent extends Component {
  @service('inline-translation-api')
  declare inlineTranslationApi: InlineTranslationApiService;

  get userProfileType(): UserProfileType {
    return this.inlineTranslationApi.userProfileType;
  }
}
