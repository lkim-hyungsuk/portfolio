import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import setupOwner from 'learning-enterprise-web/tests/helpers/setup-owner';
import sinon from 'sinon';
import setupHoverableOutlet from 'learning-enterprise-web/tests/helpers/setup-hoverable-outlet';

const SELECTORS = {
  DATE: '[data-test-user-deletion-key-mapping-date]',
  CSV_DOWNLOAD_BUTTON: '[data-test-user-deletion-download]'
};

const COLUMN_MOCKS = {
  JOB_ID: { propertyName: 'jobId' },
  SUCCESS_COUNT: { propertyName: 'deletedUsers' },
  STATUS: { propertyName: 'status' },
  TOTAL_COUNT: { propertyName: 'totalRecords' },
  SUBMITTED_BY: { propertyName: 'submittedBy' },
  CSV_DOWNLOAD: { propertyName: 'resultCsvUrl' }
};

const MINI_PROFILE_MOCK = {
  urn: 'abc',
  firstName: 'Lenny',
  lastName: 'Kim'
};

module(
  'Integration | Component | c-pages/settings/authentication/user-deletion/key-mapping',
  function(hooks) {
    setupRenderingTest(hooks);
    setupOwner(hooks);
    setupHoverableOutlet(hooks);

    // mocking API response
    hooks.beforeEach(function() {
      this.set('mockRecord', {
        createdBy: MINI_PROFILE_MOCK,
        key: {
          account: 'urn:li:enterpriseAccount:7397388',
          id: 314332
        },
        createdAt: 1609869372348,
        resultStats: {
          failed: 5,
          succeeded: 81,
          total: 86
        },
        status: 'DONE'
      });
    });

    test('UI renders the column - jobId', async function(assert) {
      this.set('mockColumn', COLUMN_MOCKS.JOB_ID);

      await render(hbs`
      <CPages::Settings::Authentication::UserDeletion::KeyMapping
        @record={{this.mockRecord}}
        @column={{this.mockColumn}}
      />
    `);

      assert.equal(this.element.textContent.trim(), 314332);
    });

    test('UI renders the column - totalRecords', async function(assert) {
      this.set('mockColumn', COLUMN_MOCKS.TOTAL_COUNT);

      await render(hbs`
      <CPages::Settings::Authentication::UserDeletion::KeyMapping
        @record={{this.mockRecord}}
        @column={{this.mockColumn}}
      />
    `);

      assert.equal(this.element.textContent.trim(), 86);
    });

    test('UI renders the column - deletedUsers', async function(assert) {
      this.set('mockColumn', COLUMN_MOCKS.SUCCESS_COUNT);

      await render(hbs`
      <CPages::Settings::Authentication::UserDeletion::KeyMapping
        @record={{this.mockRecord}}
        @column={{this.mockColumn}}
      />
    `);

      assert.equal(this.element.textContent.trim(), 81);
    });

    test('UI renders the column - submittedBy', async function(assert) {
      this.set('mockColumn', COLUMN_MOCKS.SUBMITTED_BY);

      await render(hbs`
      <CPages::Settings::Authentication::UserDeletion::KeyMapping
        @record={{this.mockRecord}}
        @column={{this.mockColumn}}
      />
    `);

      assert.dom(SELECTORS.DATE).exists('Date shows up');
    });

    test('UI renders the column - CSV download', async function(assert) {
      this.set('mockColumn', COLUMN_MOCKS.CSV_DOWNLOAD);
      this.set('mockRecord', {
        encryptedResultMediaId: 'test'
      });

      this.downloadCsvMock = sinon.spy();

      await render(hbs`
      <CPages::Settings::Authentication::UserDeletion::KeyMapping
        @record={{this.mockRecord}}
        @column={{this.mockColumn}}
        @onDownloadCsv={{this.downloadCsvMock}}
      />
    `);

      assert
        .dom(SELECTORS.CSV_DOWNLOAD_BUTTON)
        .exists('Download button shows up');

      await click(SELECTORS.CSV_DOWNLOAD_BUTTON);
      assert.ok(
        this.downloadCsvMock.calledWith('test'),
        'callback is invoked with correct arg'
      );

      this.set('mockRecord', {
        encryptedResultMediaId: undefined
      });

      assert
        .dom(SELECTORS.CSV_DOWNLOAD_BUTTON)
        .doesNotExist(
          'Download button should hide when mediaId is not available'
        );
    });

    test('UI renders the column - status', async function(assert) {
      this.set('mockColumn', COLUMN_MOCKS.STATUS);

      this.set('mockRecord', {
        createdBy: MINI_PROFILE_MOCK,
        key: {
          account: 'urn:li:enterpriseAccount:7397388',
          id: 314332
        },
        lastModified: 1609869372348,
        resultStats: {
          failed: 0,
          succeeded: 81,
          total: 81
        },
        status: 'DONE'
      });

      await render(hbs`
        <CPages::Settings::Authentication::UserDeletion::KeyMapping
          @record={{this.mockRecord}}
          @column={{this.mockColumn}}
        />
      `);

      assert.equal(this.element.textContent.trim(), 'Succeed');

      this.set('mockRecord', {
        resultStats: {
          failed: 1,
          succeeded: 8,
          total: 9
        },
        status: 'DONE'
      });

      assert.equal(this.element.textContent.trim(), 'Failed (1 error)');

      this.set('mockRecord', {
        resultStats: {
          failed: 0,
          succeeded: 9,
          total: 9
        },
        status: 'FAILED'
      });

      assert.equal(this.element.textContent.trim(), 'Failed');

      this.set('mockRecord', {
        resultStats: {
          failed: 1,
          succeeded: 8,
          total: 9
        },
        status: 'PROCESSING'
      });

      assert.ok(this.element.textContent.trim().includes('Processing'));
    });
  }
);
