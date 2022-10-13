import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { setupTracking } from 'ember-cli-pemberly-tracking/test-support';
import Service from '@ember/service';
import setupOwner from 'learning-enterprise-web/tests/helpers/setup-owner';
import {
  click,
  fillIn,
  render,
  triggerKeyEvent,
  focus,
  find
} from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import sinon from 'sinon';
import * as Fetch from 'fetch';
import { resolve } from 'rsvp';

const SELECTORS = {
  WRAPPER: '[data-test-email-template-search-typeahead]',
  RADIO_BUTTONS: '[data-test-email-template-search-typeahead-radio-buttons]',
  DEFAULT_TEMPLATE_RADIO_BUTTON:
    '[data-test-email-template-search-typeahead-radio-button-default] input[type=radio]',
  CUSTOM_TEMPLATE_RADIO_BUTTON:
    '[data-test-email-template-search-typeahead-radio-button-custom] input[type=radio]',
  CUSTOM_TEMPLATE_TYPEAHEAD_INPUT:
    '[data-test-email-template-search-typeahead-input] input',
  CUSTOM_TEMPLATE_TYPEAHEAD_RESULT:
    '[data-test-email-template-search-typeahead-result]',
  CUSTOM_TEMPLATE_TYPEAHEAD_NO_RESULTS:
    '[data-test-email-template-search-typeahead-no-result]'
};

const INTERACTION_EVENTS = {
  SELECT_FROM_TYPEAHEAD: 'email_template_search_typeahead__select_from_dropdown'
};

const KEY_DOWN = 'keydown';
const KEY_CODES = {
  HORIZONTAL_TAB: 9
};

module(
  'Integration | Component | shared/email-template-search-typeahead',
  function(hooks) {
    setupRenderingTest(hooks);
    setupOwner(hooks);
    setupTracking(hooks);

    hooks.beforeEach(function() {
      this.owner.register(
        'service:artdeco-toast',
        Service.extend({
          add: sinon.stub()
        })
      );
      this.toastService = this.owner.lookup('service:artdeco-toast');

      // Fetch stub
      this.fetchStub = sinon.stub(Fetch, 'default');
      Fetch.default.returns(
        resolve(
          new Fetch.Response(
            JSON.stringify({
              elements: [
                {
                  urn: 1,
                  name: 'fake email template name 1',
                  status: 'BLOCKED',
                  emailType: 'ACTIVATION',
                  createdBy: {
                    urn: 'baz',
                    firstName: 'andre',
                    lastName: 'kim'
                  },
                  lastModifiedAt: 111111111111,
                  locale: {
                    language: 'en',
                    country: 'US'
                  }
                },
                {
                  urn: 2,
                  name: 'fake email template name 2',
                  status: 'PUBLISHED',
                  emailType: 'ACTIVATION',
                  createdBy: {
                    urn: 'baz',
                    firstName: 'notorious',
                    lastName: 'big'
                  },
                  lastModifiedAt: 111111111111,
                  locale: {
                    language: 'es',
                    country: 'ES'
                  }
                }
              ]
            })
          )
        )
      );

      // required attribute for `email-template-search-typeahead-search`
      this.onHandleSelectedTemplateStub = sinon.stub();
    });

    test('Default radio button is selected by default on first render', async function(assert) {
      assert.expect(1);
      await render(hbs`
        {{shared/email-template-search-typeahead
          onHandleSelectedTemplate=onHandleSelectedTemplateStub
          targetTemplateType="ACTIVATION"
        }}
      `);

      assert
        .dom(SELECTORS.DEFAULT_TEMPLATE_RADIO_BUTTON)
        .isChecked(
          'Default learner invitation type must be always first selected'
        );
    });

    test('it renders typeahead when custom radio button is clicked', async function(assert) {
      assert.expect(5);

      await render(hbs`
        {{shared/email-template-search-typeahead
          onHandleSelectedTemplate=onHandleSelectedTemplateStub
          targetTemplateType="ACTIVATION"
        }}
      `);

      await click(SELECTORS.CUSTOM_TEMPLATE_RADIO_BUTTON);
      await fillIn(SELECTORS.CUSTOM_TEMPLATE_TYPEAHEAD_INPUT, '1');

      assert
        .dom(SELECTORS.RADIO_BUTTONS)
        .exists('Default / Custom radio button wrapper exists');
      assert
        .dom(SELECTORS.DEFAULT_TEMPLATE_RADIO_BUTTON)
        .exists(
          'Radio button that selects `Default` learner invitation type exists'
        );
      assert
        .dom(SELECTORS.CUSTOM_TEMPLATE_RADIO_BUTTON)
        .exists(
          'Radio button that selects `Custom` learner invitation type exists'
        );
      assert
        .dom(SELECTORS.CUSTOM_TEMPLATE_TYPEAHEAD_INPUT)
        .exists('Typeahead input field for `Custom` type exists');
      assert
        .dom(SELECTORS.CUSTOM_TEMPLATE_TYPEAHEAD_RESULT)
        .exists('Typeahead result exists');
    });

    test('it shows no result found when necessary', async function(assert) {
      assert.expect(1);

      Fetch.default.returns(
        resolve(
          new Fetch.Response(
            JSON.stringify({
              elements: []
            })
          )
        )
      );

      await render(hbs`
        {{shared/email-template-search-typeahead
          onHandleSelectedTemplate=onHandleSelectedTemplateStub
          targetTemplateType="ACTIVATION"
        }}
      `);

      await click(SELECTORS.CUSTOM_TEMPLATE_RADIO_BUTTON);
      await fillIn(SELECTORS.CUSTOM_TEMPLATE_TYPEAHEAD_INPUT, '1');

      assert
        .dom(SELECTORS.CUSTOM_TEMPLATE_TYPEAHEAD_NO_RESULTS)
        .exists('Typeahead result exists and says no result is found');
    });

    // I am not testing artdeco typeahead itself as this should be already covered by the library
    test('it supports keyboard navigation to select either `Default` or `Custom` radio button to decide which learner invitation email type that admin wants to use', async function(assert) {
      assert.expect(1);

      await render(hbs`
        {{shared/email-template-search-typeahead
          onHandleSelectedTemplate=onHandleSelectedTemplateStub
          targetTemplateType="ACTIVATION"
        }}
      `);

      await focus(SELECTORS.CUSTOM_TEMPLATE_RADIO_BUTTON);
      await triggerKeyEvent(
        SELECTORS.CUSTOM_TEMPLATE_RADIO_BUTTON,
        KEY_DOWN,
        KEY_CODES.HORIZONTAL_TAB
      );

      assert
        .dom(SELECTORS.CUSTOM_TEMPLATE_TYPEAHEAD_INPUT)
        .doesNotExist(
          'by only using keyboard, user is able to select Default radio button'
        );
    });

    test('calls the parent action when one typeahead result is selected from dropdown result', async function(assert) {
      assert.expect(1);

      await render(hbs`
        {{shared/email-template-search-typeahead
          onHandleSelectedTemplate=onHandleSelectedTemplateStub
          targetTemplateType="ACTIVATION"
        }}
      `);

      await click(SELECTORS.CUSTOM_TEMPLATE_RADIO_BUTTON);
      await fillIn(SELECTORS.CUSTOM_TEMPLATE_TYPEAHEAD_INPUT, '1');
      await click(SELECTORS.CUSTOM_TEMPLATE_TYPEAHEAD_RESULT);

      assert.ok(
        this.onHandleSelectedTemplateStub.calledOnce,
        '`onHandleSelectedTemplate` callback should be passed from parent is must be called'
      );
    });

    test('fires interaction event when a template is selected from dropdown result', async function(assert) {
      assert.expect(1);

      await render(hbs`
        {{shared/email-template-search-typeahead
          onHandleSelectedTemplate=onHandleSelectedTemplateStub
          targetTemplateType="ACTIVATION"
        }}
      `);

      await click(SELECTORS.CUSTOM_TEMPLATE_RADIO_BUTTON);
      await fillIn(SELECTORS.CUSTOM_TEMPLATE_TYPEAHEAD_INPUT, '1');
      await click(SELECTORS.CUSTOM_TEMPLATE_TYPEAHEAD_RESULT);

      this.trackingSession
        .assertInteractionEvent(
          INTERACTION_EVENTS.SELECT_FROM_TYPEAHEAD,
          'Interaction event fires when user selectes one of typeahead results'
        )
        .occurs(1);
    });

    test('selecting typeahead result sets the <input> value', async function(assert) {
      assert.expect(2);

      await render(hbs`
        {{shared/email-template-search-typeahead
          onHandleSelectedTemplate=onHandleSelectedTemplateStub
          targetTemplateType="ACTIVATION"
        }}
      `);

      await click(SELECTORS.CUSTOM_TEMPLATE_RADIO_BUTTON);
      await fillIn(SELECTORS.CUSTOM_TEMPLATE_TYPEAHEAD_INPUT, '1');
      await click(SELECTORS.CUSTOM_TEMPLATE_TYPEAHEAD_RESULT);

      assert.dom(SELECTORS.CUSTOM_TEMPLATE_TYPEAHEAD_RESULT).doesNotExist();
      assert.ok(
        find(SELECTORS.CUSTOM_TEMPLATE_TYPEAHEAD_INPUT).value.trim() ===
          'fake email template name 1',
        `Selecting one of typeahead results should show the target name as input vaue so that user knows it's selected`
      );
    });

    test('makes serach API successfully once user starts typing', async function(assert) {
      const userInput = '1';

      await render(hbs`
        {{shared/email-template-search-typeahead
          onHandleSelectedTemplate=onHandleSelectedTemplateStub
          targetTemplateType="ACTIVATION"
        }}
      `);

      await click(SELECTORS.CUSTOM_TEMPLATE_RADIO_BUTTON);
      await fillIn(SELECTORS.CUSTOM_TEMPLATE_TYPEAHEAD_INPUT, userInput);

      const getCall = this.fetchStub.args[0][0];

      assert.equal(
        getCall,
        `/learning-enterprise-api/learningEmailTemplates?q=appInstance&emailType=ACTIVATION&status=PUBLISHED&namePrefix=${userInput}`,
        'makes GET finder by passing `emailType`, `status` & `namePrefix`'
      );
    });
  }
);
