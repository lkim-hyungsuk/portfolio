import { hbs } from 'ember-cli-htmlbars';
import Component from '@ember/component';
import EmberObject, { getProperties } from '@ember/object';
import { click, render } from '@ember/test-helpers';
import { setupTracking } from 'ember-cli-pemberly-tracking/test-support';
import { setupRenderingTest } from 'ember-qunit';
import { module, test } from 'qunit';
import sinon from 'sinon';
import setupOwner from 'learning-enterprise-web/tests/helpers/setup-owner';
import setupPretender from 'learning-enterprise-web/tests/helpers/setup-pretender';
import { setupModalOutlet } from 'artdeco-modal/test-support';
import setupHoverableOutlet from 'learning-enterprise-web/tests/helpers/setup-hoverable-outlet';

const SELECTORS = {
  PAGE: '[data-test-customize-email]',
  HEADER: '[data-test-customize-email-header]',
  TABLE: '[data-test-customize-email-table]',
  ADD_TEMPLATE_BUTTON: '[data-test-email-customization-add-template-button]',
  MODAL_CONTAINER: '[data-test-modal-container]',
  MODAL_CLOSE_BUTTON: '[data-test-modal-close-btn]',
  MODAL_SAVE_BUTTON: '[data-test-edit-template-modal-save-button]',
  MODAL_DELETE_BUTTON: '[data-test-delete-template-modal-delete-button]',
  MORE_ACTIONS_BUTTON: '[data-test-more-actions-dropdown]',
  ARTDECO_DROPDOWN: '[data-test-more-actions-item]',
  EMPTY_STATE: '[data-test-customize-email-empty-state]',

  // component:more-actions-dropdown
  DROPDOWN_DUPLICATE: '[data-test-more-actions-item=Duplicate]',
  DROPDOWN_EDIT: '[data-test-more-actions-item=Edit]',
  DROPDOWN_DELETE: '[data-test-more-actions-item=Delete]'
};

const KEY_EVENTS = {
  ADD_TEMPLATE_INTERACTION: 'email__add_template_button',
  DELETE_TEMPLATE_INTERACTION: 'email__delete_template_button'
};

const localeObj = {
  language: 'en',
  country: 'US'
};

module(
  'Integration | Component | c-pages/settings/customization/email',
  function (hooks) {
    setupRenderingTest(hooks);
    setupOwner(hooks);
    setupPretender(hooks);
    setupTracking(hooks);
    setupModalOutlet(hooks);
    setupHoverableOutlet(hooks);

    hooks.beforeEach(function () {
      this.owner.lookup('router:main').setupRouter();
      // Configuration
      this.owner.register(
        'service:configuration',
        class extends EmberObject {
          defaultLicenseLocale = { id: 'en_US' };

          hasMultipleLicenseLocales = true;

          licensedLocales = [
            EmberObject.create({
              locale: localeObj
            })
          ];
        }
      );

      this.configuration = this.owner.lookup('service:configuration');
      this.toastService = this.owner.lookup('service:artdeco-toast');

      // Stubbing API call
      this.server.get(
        '/learning-enterprise-api/learningEmailTemplates',
        sinon.fake.returns([
          200,
          {},
          JSON.stringify({
            elements: [
              {
                urn: 3,
                name: 'fake email template name',
                status: 'PUBLISHED',
                emailType: 'ACTIVATION',
                createdBy: {
                  urn: 'baz',
                  firstName: 'kanye',
                  lastName: 'west'
                },
                lastModifiedAt: 111111111111,
                locale: {
                  language: 'en',
                  country: 'US'
                }
              }
            ]
          })
        ])
      );
    });

    test('it renders empty state illustration when there are no templates created', async function (assert) {
      this.server.get(
        '/learning-enterprise-api/learningEmailTemplates',
        sinon.fake.returns([
          200,
          {},
          JSON.stringify({
            elements: []
          })
        ])
      );

      await render(hbs`<CPages::Settings::Customization::Email />`);

      assert.dom(SELECTORS.PAGE).exists({ count: 1 }, 'Page renders');
      assert.dom(SELECTORS.HEADER).exists({ count: 1 }, 'Header renders');
      assert.dom(SELECTORS.TABLE).doesNotExist('Table does not show up');

      assert
        .dom(SELECTORS.EMPTY_STATE)
        .exists({ count: 1 }, 'Empty state renders');
    });

    test('it renders the table and all other elements', async function (assert) {
      await render(hbs`<CPages::Settings::Customization::Email />`);

      assert.dom(SELECTORS.PAGE).exists({ count: 1 }, 'Page renders');

      assert.dom(SELECTORS.HEADER).exists({ count: 1 }, 'Header renders');

      assert.dom(SELECTORS.TABLE).exists({ count: 1 }, 'Table renders');

      assert
        .dom(SELECTORS.ADD_TEMPLATE_BUTTON)
        .includesText('Create template', 'Add template button renders');
    });

    test('it passes correct attributes to edit template modal', async function (assert) {
      const attrsChanged = sinon.stub();

      this.owner.register(
        'template:components/c-pages/settings/customization/edit-template-modal',
        hbs``
      );
      this.owner.register(
        'component:c-pages/settings/customization/edit-template-modal',
        class extends Component {
          didReceiveAttrs() {
            attrsChanged(getProperties(this, ...Object.keys(this.attrs)));
          }
        }
      );

      await render(hbs`<CPages::Settings::Customization::Email />`);

      await click(SELECTORS.ADD_TEMPLATE_BUTTON);

      assert.ok(attrsChanged.lastCall.args[0].isOpen);
      assert.equal(
        JSON.stringify(attrsChanged.lastCall.args[0].template),
        JSON.stringify({}),
        '`template` should be an empty object when creating a new template'
      );

      this.owner.unregister(
        'template:components/c-pages/settings/customization/edit-template-modal'
      );
      this.owner.unregister(
        'component:c-pages/settings/customization/edit-template-modal'
      );
    });

    test('it renders edit template modal & fires tracking event', async function (assert) {
      await render(hbs`<CPages::Settings::Customization::Email />`);

      assert
        .dom(SELECTORS.MODAL_CONTAINER)
        .doesNotExist('Edit template modal does not exist');

      await click(SELECTORS.ADD_TEMPLATE_BUTTON);

      assert
        .dom(SELECTORS.MODAL_CONTAINER)
        .exists({ count: 1 }, 'Edit template modal exists');

      await click(SELECTORS.MODAL_CLOSE_BUTTON);

      assert
        .dom(SELECTORS.MODAL_CONTAINER)
        .doesNotExist('Edit template modal does not exist');

      this.trackingSession
        .assertInteractionEvent(
          KEY_EVENTS.ADD_TEMPLATE_INTERACTION,
          'Add template button fires interaction event'
        )
        .withInteractionType('SHORT_PRESS')
        .occurs(1);
    });

    test('it renders delete template modal', async function (assert) {
      await render(hbs`<CPages::Settings::Customization::Email />`);

      assert
        .dom(SELECTORS.MODAL_CONTAINER)
        .doesNotExist('Delete template modal does not exist');

      await click(SELECTORS.MORE_ACTIONS_BUTTON);
      await click(SELECTORS.DROPDOWN_DELETE);

      assert
        .dom(SELECTORS.MODAL_CONTAINER)
        .exists({ count: 1 }, 'Delete template modal exists');

      await click(SELECTORS.MODAL_DELETE_BUTTON);

      assert
        .dom(SELECTORS.MODAL_CONTAINER)
        .doesNotExist('Delete template modal does not exist');

      this.trackingSession
        .assertInteractionEvent(
          KEY_EVENTS.DELETE_TEMPLATE_INTERACTION,
          'Delete template button fires interaction event'
        )
        .withInteractionType('SHORT_PRESS')
        .occurs(1);
    });
  }
);