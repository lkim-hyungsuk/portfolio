/*
What is Groups First Experience?
We have built The Break Room and believe that if we make TBR the #1 community that Firstline members see, they will realize that LinkedIn can truly solve their voice pain point, and thus come back to LinkedIn regularly.

However, today when members come to our app they don’t see The Break Room immediately — they instead see the other content from influencers, pages, etc. To make members truly feel that LinkedIn has the community that solves their voice pain point, we want them to immediately recognize this upon coming to the app.
*/
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { controlNameForFilterFeedTypeUrn } from 'feed/utils/constants';
import { LEGO_ENUM_CONSTANTS } from 'lego/utils/constants';

/**
 * @typedef FilterFeedOption
 * @property {TextViewModel} text - The text shown on the pill
 * @property {string} trackingActionType - The tracking action fire when the pill is clicked
 * @property {string} filterFeedTypeUrn - The filter feed type urn that indicates which feed to load
 */

/**
 * A wrapper around the filter feed option with additional presentation options.
 * @typedef FilterFeedOptionWrapper
 * @property {FilterFeedOption} model - The data model for the pill
 * @property {boolean} selected - Should the pill be rendered as selected?
 */

/**
 * A horizontal list of pills that behaves like a radio group. Only one pill
 * can be selected at a time. When one of the pills is clicked, the
 * onTogglePill argument action is called with the pill's FilterFeedOption model
 * as its argument.
 * @param {FilterFeedOptionWrapper[]} filterFeedOptions - The data models for the pills to render
 * @param {function} onTogglePill - Action called when a pill is clicked
 */
export default class FilterFeedPills extends Component {
  @service('tracking')
  tracking;

  @service('i18n')
  i18n;

  @service('lego@resolver')
  legoResolver;

  @service('lego@tracking')
  legoTracking;

  /**
   * Whether ProductEducation$OnboardingModal is open or not
   * @type {boolean}
   * @default [false]
   */
  @tracked isPEMOpen = false;

  /**
   * Whether or not the pill with a coachmark has been clicked
   * @type {Boolean}
   * @default [false]
   * @private
   */
  @tracked _coachmarkPillClicked = false;

  /**
   * Object that contins the Lego information for product education widget
   * @type {Object}
   * @default [null]
   * @private
   */
  @tracked _gfePELegoWidget = null;

  /**
   * The filter feed options to render.
   * @returns {FilterFeedOptionWrapper[]} An array of filter feed options
   */
  get filterFeedOptions() {
    return this.args.filterFeedOptions ?? [];
  }

  /**
   * @returns {Boolean}
   */
  get shouldShowCoachmark() {
    return !this._coachmarkPillClicked && !!this._gfePELegoWidget;
  }

  constructor() {
    super(...arguments);

    this.modalItems = [
      {
        headline: this._lookupTranslation('i18n_coach_mark_subject'),
        description: this._lookupTranslation('i18n_coach_mark_content'),
      },
    ];

    this._fetchPELegoWidget();
  }

  /**
   * Called when a pill is clicked. Passes the model to the onTogglePill action
   * passed to the component.
   * @param {string} filterFeedTypeUrn - The urn of the filtered feed to load
   */
  @action
  onTogglePill(filterFeedTypeUrn) {
    // Find the filter feed option model with the urn passed.
    const filterFeedModel = this.filterFeedOptions.findBy(
      'filterFeedTypeUrn',
      filterFeedTypeUrn
    );
    this.args.onTogglePill?.(filterFeedModel);
  }

  @action
  fireInteractionEvent(filterFeedTypeUrn) {
    this.tracking.fireInteractionEvent(
      controlNameForFilterFeedTypeUrn[filterFeedTypeUrn]
    );
  }

  @action
  dismissCoachmarkModal() {
    this.isPEMOpen = false;
    this._coachmarkPillClicked = true;
    this._handlePEInteraction();
  }

  /**
   * Handler to fetch the i18n string from the template
   * @returns {String}
   * @private
   */
  _lookupTranslation(key) {
    return this.i18n.lookupTranslation(
      'components/feed@filter-feed-pills',
      key
    )();
  }

  /**
   * Fetch lego widget for the product education coachmark and modal
   * @returns {undefined}
   */
  _fetchPELegoWidget() {
    const legoConfig = {
      groupId: 'coach_mark_on_group_pill',
      pageKey: 'd_flagship3_feed',
      slotId: 'group_first_experience_pill_coachmark',
      widgetId: 'group_first_experience_pill_coachmark',
    };

    this.legoResolver.fireLegoCall(legoConfig).then((widget) => {
      if (!this.isDestroying && widget) {
        this._gfePELegoWidget = widget;
      }
    });
  }

  /**
   * Fire Lego action for the product education coachmark
   * @returns {undefined}
   */
  _handlePEInteraction() {
    const { trackingToken } = this._gfePELegoWidget;
    if (trackingToken) {
      this.legoTracking.sendLegoAction(
        trackingToken,
        LEGO_ENUM_CONSTANTS.LEGO_ACTION_DISMISS,
        1
      );
    }
  }
}