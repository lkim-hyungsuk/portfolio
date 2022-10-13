import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { setupLego } from 'learning-web/tests/helpers/test-support';

const SELECTORS = Object.freeze({
  MAIN_CTA: '[data-test-bind-promo-card-main-cta]',
  SECONDARY_CTA: '[data-test-bind-promo-card-secondary-cta]',
  UNDO_BUTTON: '[data-test-bind-promo-card-undo]',
  BIND_PROMO_WIDGET_DISMISSED: '[data-test-bind-promo-card-dismissed]',
});

module('Integration | Component | common/bind-promo-card', function(hooks) {
  setupRenderingTest(hooks);
  setupLego(hooks);

  hooks.beforeEach(async function() {
    this.sandbox = sinon.sandbox.create();
  });

  hooks.afterEach(function() {
    this.sandbox.restore();
  });

  test('it makes LEGO calls correctly upon load and click', async function(assert) {
    const impressWidgetSpy = this.sandbox.spy(this.lego, 'impressWidget');
    const dismissWidgetSpy = this.sandbox.spy(this.lego, 'dismissWidget');
    const firePrimaryActionWidgetSpy = this.sandbox.spy(this.lego, 'firePrimaryAction');
    this.legoWidget = {};

    await render(hbs`<Common::BindPromoCard @widget={{this.legoWidget}}/>`);

    await click(SELECTORS.SECONDARY_CTA);

    assert.ok(impressWidgetSpy.calledWith(this.legoWidget));
    assert.ok(dismissWidgetSpy.calledWith(this.legoWidget));
    assert.dom(SELECTORS.BIND_PROMO_WIDGET_DISMISSED).exists('Dismissed view shows up');

    await click(SELECTORS.UNDO_BUTTON);
    assert.dom(SELECTORS.MAIN_CTA).exists('normal view shows up upon UNDO');

    await click(SELECTORS.MAIN_CTA);
    assert.ok(firePrimaryActionWidgetSpy.calledWith(this.legoWidget));
  });
});

test('it correctly renders binding promo widget', async function(assert) {
  server.get('/feedRecommendations', (_, request) => getM3Payload(createCardMock(request), NORMALIZED_JSON_VALUE));
  await run(async () => {
    this.model.feedRecommendationGroups = await getMockFeedRecommendationGroupCollection(
      { service: this.store },
      'singleCarouselManyCards'
    );
  });

  const impressWidgetSpy = this.sandbox.spy(this.lego, 'impressWidget');
  const dismissWidgetSpy = this.sandbox.spy(this.lego, 'dismissWidget');

  const legoUnboundWidget = {};

  // TODO replace this mock later by stubbing initial context (new data is coming)
  set(this.user, 'isLoggedIn', true);
  set(this.user, 'isUnboundUser', true);
  set(this.binding, 'isOptional', true);

  set(this.lego, 'bindingPromoForHome_a', legoUnboundWidget);
  this.lix.setTreatment('learning.web.show-binding-promo', 'enabled');

  await render(hbs`
    <Me::IndexBody @model={{model}} />
  `);

  assert.dom(SELECTORS.BIND_PROMO_WIDGET).exists({ count: 1 }, 'binding widget exists');

  await click(SELECTORS.BIND_PROMO_WIDGET_SECONDARY_CTA);

  assert.ok(impressWidgetSpy.calledWith(legoUnboundWidget));

  assert.ok(dismissWidgetSpy.calledWith(legoUnboundWidget));
});

test('it displays promo-bind-card with LEGO actions invoked successfully', async function(assert) {
  const widget = {};
  set(this.lego, 'bindingPromoForSearchResult_a', widget);
  this.searchQueryCount = 2;
  this.lix.setTreatment('learning.web.show-binding-promo', 'enabled');

  // TODO | Replace this later with /learning-api's new endpoint
  this.user.set('isLoggedIn', true);
  this.binding.set('isOptional', true);
  this.user.set('isUnboundUser', true);

  const legoImpressWidgetSpy = this.sandbox.spy(this.lego, 'impressWidget');
  const legoDismissWidgetSpy = this.sandbox.spy(this.lego, 'dismissWidget');
  const legoPrimaryActionWidgetSpy = this.sandbox.spy(this.lego, 'firePrimaryAction');

  this.results = {
    value: await getMockCardsCollection({ service: this.store }, { count: 8 }),
  };

  await render(hbs`
    <Search::SearchBody
      @results={{results}}
      @searchId={{searchId}}
      @searchFacets={{searchFacets}}
      @searchResultsCount={{0}}
      @facetsWithShowMorePressed={{array}}
      @facetsExpanded={{array}}
      @onFilterResults={{filterResultsStub}}
      @onToggleShowMore={{toggleShowMoreStub}}
      @onToggleExpand={{toggleExpandStub}}
      @onChangeRelevance={{changeRelevanceStub}}
      @onSpellCheck={{spellCheckStub}}
      @searchQueryCount={{searchQueryCount}}
    />
  `);

  assert.dom(SELECTORS.BIND_PROMO_WIDGET).exists({ count: 1 }, 'binding widget exists');

  await click(SELECTORS.BIND_PROMO_WIDGET_MAIN_CTA);
  await click(SELECTORS.BIND_PROMO_WIDGET_SECONDARY_CTA);

  assert.ok(legoPrimaryActionWidgetSpy.calledWith(widget), 'it fires LEGO primary action successfully');
  assert.ok(legoImpressWidgetSpy.calledWith(widget), 'it impresses learningSearchSurvey widget');
  assert.ok(legoDismissWidgetSpy.calledWith(widget), 'it dismisses learningSearchSurvey widget');
});

test('Should fire primary action for a widget', async function(assert) {
  this.service.setWidgets([this.widgetOne]);
  await settled();

  this.service.firePrimaryAction(this.service.get('widgetOne'));
  await settled();

  assert.ok(this.legoSpy.calledOnce, 'it makes a request.');
});