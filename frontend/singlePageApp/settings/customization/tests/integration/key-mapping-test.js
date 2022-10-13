import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import setupOwner from 'learning-enterprise-web/tests/helpers/setup-owner';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

const COLUMN_MOCKS = {
  TYPE: { propertyName: 'emailType' },
  LAST_MODIFIED: { propertyName: 'lastModifiedAt' },
  LOCALE: { propertyName: 'locale' },
  CREATED_BY: { propertyName: 'createdBy' }
};

const LOCALE_MOCKS = {
  ENGLISH: {
    country: 'US',
    language: 'en'
  },
  FRENCH: {
    country: 'FR',
    language: 'fr'
  },
  SPANISH: {
    country: 'ES',
    variant: '',
    language: 'es'
  },
  JAPANESE: {
    country: 'JP',
    language: 'ja'
  }
};

const MINI_PROFILE_MOCK = {
  urn: 'abc',
  firstName: 'Lenny',
  lastName: 'Kim'
};

module(
  'Integration | Component | c-pages/settings/customization/email/key-mapping',
  function(hooks) {
    setupRenderingTest(hooks);
    setupOwner(hooks);

    // mocking API response
    hooks.beforeEach(function() {
      this.set('mockRecord', {
        urn: '1234',
        name: 'Fake template name 1',
        status: 'PENDING',
        emailType: 'ACTIVATION',
        locale: LOCALE_MOCKS.ENGLISH,
        createdBy: MINI_PROFILE_MOCK,
        lastModifiedAt: 1603929600000
      });
    });

    test('UI converts backend data to a readable format - emailType', async function(assert) {
      this.set('mockColumn', COLUMN_MOCKS.TYPE);

      await render(hbs`
        <CPages::Settings::Customization::Email::KeyMapping
          @record={{this.mockRecord}}
          @column={{this.mockColumn}}
        />
      `);

      assert.equal(this.element.textContent.trim(), 'Learner Invitation');
    });

    // doing a minimal test as this should be covered by `helper:locale-name``
    test('UI converts backend data to a readable format - locale', async function(assert) {
      this.set('mockColumn', COLUMN_MOCKS.LOCALE);
      await render(hbs`
        <CPages::Settings::Customization::Email::KeyMapping
          @record={{this.mockRecord}}
          @column={{this.mockColumn}}
        />
      `);

      this.set('mockRecord', { locale: LOCALE_MOCKS.SPANISH });
      assert.equal(this.element.textContent.trim(), 'Spanish');

      this.set('mockRecord', { locale: LOCALE_MOCKS.FRENCH });
      assert.equal(this.element.textContent.trim(), 'French');

      this.set('mockRecord', { locale: LOCALE_MOCKS.JAPANESE });
      assert.equal(this.element.textContent.trim(), 'Japanese');

      this.set('mockRecord', { locale: '' });
      assert.equal(this.element.textContent.trim(), 'All');
    });

    test('UI converts backend data to a readable format - lastModifiedAt', async function(assert) {
      this.set('mockColumn', COLUMN_MOCKS.LAST_MODIFIED);

      await render(hbs`
        <CPages::Settings::Customization::Email::KeyMapping
          @record={{this.mockRecord}}
          @column={{this.mockColumn}}
        />
      `);

      assert.equal(this.element.textContent.trim(), '10/29/2020');
    });

    test('UI converts backend data to a readable format - createdBy', async function(assert) {
      this.set('mockColumn', COLUMN_MOCKS.CREATED_BY);

      await render(hbs`
        <CPages::Settings::Customization::Email::KeyMapping
          @record={{this.mockRecord}}
          @column={{this.mockColumn}}
        />
      `);

      assert.equal(this.element.textContent.trim(), 'Lenny Kim');
    });

    test('UI converts backend data to a readable format - default createdBy', async function(assert) {
      this.set('mockColumn', COLUMN_MOCKS.CREATED_BY);
      this.set('mockRecord', {
        // MiniProfile's `firstName` & `lastName` are optional
        createdBy: {
          urn: 123
        }
      });

      await render(hbs`
        <CPages::Settings::Customization::Email::KeyMapping
          @record={{this.mockRecord}}
          @column={{this.mockColumn}}
        />
      `);

      assert.equal(this.element.textContent.trim(), 'Learning Admin');
    });
  }
);
