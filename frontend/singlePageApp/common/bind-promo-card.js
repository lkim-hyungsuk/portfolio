import Component from '@glimmer/component';
import { action, get } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';
import { default as isBrowser } from 'ember-stdlib/utils/is-browser';
import { assert } from '@ember/debug';

export const WIDGETS_FOR_HOME_PAGE = ['bindingPromoForHome_a', 'bindingPromoForHome_b'];
export const WIDGETS_FOR_SEARCH_RESULT_PAGE = ['bindingPromoForSearchResult_a', 'bindingPromoForSearchResult_b'];

// t-string reference to the template
const BULLET_POINTS = ['card_bullet_a', 'card_bullet_b', 'card_bullet_c'];

/**
 * @component common/bind-promo-card
 * Use this component for rendering a card that offers two options: BIND or DISMISS (only for Enterprise)
 * Updates its view based on the sole @tracked:didDismiss property
 *
 * JIRA epic: Optimize One Activation Funnel (LEARN-22807)
 *
 * Example usage:
 * <Common::BindPromoCard
 *   @widget=this.widget
 * </Common::BindPromoCard>
 */
export default class CommonBindPromoCardComponent extends Component {
  @service lego;
  @service device;

  @tracked didDismiss = false;

  get widgetName() {
    return get(this.args.widget, 'name');
  }

  get isForSearchResult() {
    return WIDGETS_FOR_SEARCH_RESULT_PAGE.indexOf(this.widgetName) > -1;
  }

  get isForWatchParty() {
    // TODO Figure out how LEGO config can improve this logic
    return this.widgetName?.indexOf('watch_party') > -1;
  }

  /**
   * @type {Boolean}
   * Mobile view requires UI to wrap the mercado image and the title
   */
  get shouldWrapTitle() {
    return this.device.isSmall && this.isForSearchResult;
  }

  get mercadoImage() {
    if (this.device.isSmall && this.isForSearchResult) {
      return this.isForWatchParty ? 'mercado__video' : 'mercado__dartboard';
    }

    return this.isForWatchParty ? 'mercado__main-coworkers' : 'mercado__main-person';
  }

  constructor() {
    super(...arguments);
    const widget = this.args.widget;
    assert('common/bind-promo-card: widget is a required field.', widget);

    this.cardBulletPoints = BULLET_POINTS;

    if (isBrowser && widget) {
      this.lego.impressWidget(widget, { clear: true });
    }
  }

  @action
  launchBindingFlow() {
    // Opening this up for @yili to fill in
    if (this.args.widget) {
      this.lego.firePrimaryAction(this.args.widget, { clear: true });
    }
  }

  @action
  didDismissWidget() {
    this.didDismiss = !this.didDismiss;
    if (this.args.widget) {
      this.lego.dismissWidget(this.args.widget, { clear: true });
    }
  }
}
