import { action } from '@ember/object';
import { service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { COLOR_SCHEME_MAP } from 'hue-web-foundations/helpers/-color-scheme';
import type InlineTranslationApiService from 'inline-translation-web/services/inline-translation-api';
import type RouterService from '@ember/routing/router-service';
import { UserProfileEnum } from 'inline-translation-web/services/inline-translation-api';

export default class SidebarNavComponent extends Component {
  @service('inline-translation-api')
  declare inlineTranslationApi: InlineTranslationApiService;

  @service('router')
  declare router: RouterService;

  @tracked useDarkMode = false;

  get isModerator(): boolean {
    return (
      this.inlineTranslationApi.userProfileType === UserProfileEnum.MODERATOR
    );
  }

  get canAccessApprove(): boolean {
    return (
      this.inlineTranslationApi.userProfileType !==
        UserProfileEnum.CONTRIBUTOR &&
      this.inlineTranslationApi.userProfileType !== UserProfileEnum.CS_USER
    );
  }

  @action
  toggleSidebar(): void {
    const sidebar: HTMLElement | null = document.querySelector('.sidebar-nav');
    const sidebarTextList: NodeListOf<HTMLElement> = document.querySelectorAll(
      '.sidebar-nav__list-item-text'
    );
    if (sidebar && sidebarTextList) {
      sidebar.classList.toggle('sidebar-nav--collapsed');
      sidebarTextList.forEach((el) => {
        el.classList.toggle('sidebar-nav__list-item-text--collapsed');
      });
    }
  }

  @action
  toggleDarkMode(): void {
    this.useDarkMode = !this.useDarkMode;
    if (this.useDarkMode) {
      document.documentElement.classList.add(COLOR_SCHEME_MAP.dark);
      document.documentElement.classList.remove(COLOR_SCHEME_MAP.light);
    } else {
      document.documentElement.classList.add(COLOR_SCHEME_MAP.light);
      document.documentElement.classList.remove(COLOR_SCHEME_MAP.dark);
    }
  }

  @action
  refreshData(): void {
    if (this.router.currentRouteName === 'authentication.translate') {
      this.router.refresh('authentication');
    } else {
      this.router.refresh(this.router.currentRouteName);
    }
  }
}
