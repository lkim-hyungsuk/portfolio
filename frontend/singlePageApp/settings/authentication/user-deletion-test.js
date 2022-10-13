import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click, triggerEvent } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { resolve } from 'rsvp';
import EmberObject from '@ember/object';
import { setupModalOutlet } from 'artdeco-modal/test-support';
import setupOwner from 'learning-enterprise-web/tests/helpers/setup-owner';
import FeatureTogglesStub from 'learning-enterprise-web/tests/helpers/feature-toggles-stub';
import sinon from 'sinon';
import setupPretender from 'learning-enterprise-web/tests/helpers/setup-pretender';
import setupHoverableOutlet from 'learning-enterprise-web/tests/helpers/setup-hoverable-outlet';

const ACCOUNT_AUTHENTICATION_SETTINGS_COLLECTION =
  'settings/account-authentication-settings-collection';

const SELECTORS = {
  SECTION: '[data-test-gdpr-delete]',
  MAIN_CTA: '[data-test-gdpr-delete-main-cta]',
  GDPR_CSV_UPLOAD_MODAL: '[data-test-csv-upload-modal]',
  GDPR_CSV_TEMPLATE_DOWNLOAD_BTN:
    '[data-test-gdpr-delete-csv-template-download-button]',
  GDPR_DELETE_NOTE: '[data-test-gdpr-delete-note]',
  FOOTER_CTA_NEXT: '[data-test-csv-upload-next]',
  GDPR_CSV_TEMPLATE_TABLE: '[data-test-user-deletion-table]',
  GDPR_CSV_DOWNLOAD: '[data-test-user-deletion-download]',
  TAB_EXPAND_CARROT: '[data-test-user-deletion-drawer-toggle]',

  // Template-only components used in GDPR table
  HOVER_ICON: '[data-test-key-mapping-status-icon]',
  HOVER_CONTENT: '[data-test-key-mapping-status-hover-content]'
};

module(
  'Integration | Component | c-pages/settings/authentication/user-deletion',
  function(hooks) {
    setupRenderingTest(hooks);
    setupOwner(hooks);
    setupPretender(hooks);
    setupModalOutlet(hooks);
    setupHoverableOutlet(hooks);

    hooks.beforeEach(function() {
      this.owner.register('service:feature-toggles', FeatureTogglesStub);
      this.featureToggles = this.owner.lookup('service:feature-toggles');
      this.featureToggles.setToggles('activationEmailsAllowed', true);
      this.store = this.owner.lookup('service:store');
      const store = this.store;

      // I am stubbing the hardcoded data only because restli mocker has issues with creating one of child fields
      // https://linkedin-randd.slack.com/archives/C6TBMKKK6/p1611195292000900
      this.mockData = {
        createdAt: 1610488486922,
        resultStats: { total: 1, failed: 1, succeeded: 0 },
        creator:
          'ABkAAAAAAABw4AwAAAAAAWNO_QAAAXcc14KjAeIXYhctFi8Dchx2DjpxCS-BtZAL',
        application: 'urn:li:enterpriseApplication:learning',
        bulkActionType: 'EP_BATCH_GDPR_DELETE_PROFILES',
        applicationInstance:
          'urn:li:enterpriseApplicationInstance:(urn:li:enterpriseAccount:7397388,7810948)',
        key: {
          account: 'urn:li:enterpriseAccount:7397388',
          id: 321324
        },
        status: 'PROCESSING',
        encryptedResultMediaId: 'testEncryptedMediaUrn'
      };

      sinon.stub(this.store, 'queryURL').returns(
        resolve(
          EmberObject.create({
            elements: [this.mockData]
          })
        )
      );

      this.queryRecord = sinon.stub(store, 'queryRecord');
      this.storeQueryResponses = {
        [ACCOUNT_AUTHENTICATION_SETTINGS_COLLECTION]: EmberObject.create({
          elements: []
        })
      };
      this.queryRecord.callsFake(type =>
        resolve(this.storeQueryResponses[type] || EmberObject.create())
      );
    });

    test('open GDPR delete CSV upload modal', async function(assert) {
      assert.expect(4);

      await render(hbs`<CPages::Settings::Authentication::UserDeletion />`);

      assert.dom(SELECTORS.MAIN_CTA).exists('main CTA button shows up');

      await click(SELECTORS.MAIN_CTA);
      assert
        .dom(SELECTORS.GDPR_CSV_UPLOAD_MODAL)
        .exists('GDPR upload CSV shows up');
      assert
        .dom(SELECTORS.GDPR_CSV_TEMPLATE_DOWNLOAD_BTN)
        .exists('GDPR Template download button renders');
      assert
        .dom(SELECTORS.GDPR_DELETE_NOTE)
        .exists('GDPR delete specific note renders');
    });

    test('downloads GDPR delete csv template', async function(assert) {
      // mocking API
      const handler = sinon.fake.returns([200, {}]);
      this.server.post(
        '/learning-enterprise-api/file/csvTemplateDownload',
        handler
      );

      assert.expect(2);
      await render(hbs`<CPages::Settings::Authentication::UserDeletion />`);
      await click(SELECTORS.MAIN_CTA);
      assert
        .dom(SELECTORS.GDPR_CSV_TEMPLATE_DOWNLOAD_BTN)
        .exists('GDPR Template download button renders');
      await click(SELECTORS.GDPR_CSV_TEMPLATE_DOWNLOAD_BTN);
      assert.ok(
        handler.args[0][0].queryParams.templateType === 'BULK_DELETE',
        'GDPR specific download template is downloaded'
      );
    });

    test('shows the table to show previous GDPR delete jobs - PROCESSING', async function(assert) {
      assert.expect(4);

      await render(hbs`<CPages::Settings::Authentication::UserDeletion />`);

      await click(SELECTORS.TAB_EXPAND_CARROT);

      assert
        .dom(SELECTORS.GDPR_CSV_TEMPLATE_TABLE)
        .exists('GDPR table renders');

      assert
        .dom(SELECTORS.GDPR_CSV_DOWNLOAD)
        .isDisabled('Should be disabled for PROCESSING item');

      assert
        .dom(SELECTORS.HOVER_ICON)
        .exists('For the status - PROCESSING, it shows the pebble icon');

      await triggerEvent(SELECTORS.HOVER_ICON, 'mouseenter');

      assert.dom(SELECTORS.HOVER_CONTENT).exists('Hoverable content shows up');
    });

    test('download the CSV file successfully', async function(assert) {
      this.mockData.status = 'DONE';
      assert.expect(2);

      this.fileService = this.owner.lookup('service:eis/file-service');
      sinon.stub(this.fileService, 'fetchFileContents').returns(resolve({}));

      await render(
        hbs`<CPages::Settings::Authentication::UserDeletion @downloadCsvFile=this.downloadCsvFile />`
      );
      await click(SELECTORS.TAB_EXPAND_CARROT);
      await click(SELECTORS.GDPR_CSV_DOWNLOAD);

      assert.ok(
        this.fileService.fetchFileContents.calledOnce,
        'makes a call using fileService'
      );

      assert.equal(
        this.fileService.fetchFileContents.args[0][0],
        '/learning-enterprise-api/file/download?token=testEncryptedMediaUrn&src=eis',
        'makes a call to the expected API endpoint with mediaUrn'
      );
    });
  }
);

test('GDPR User Delete Flow: onGdprDeleteConfirm is called upon final CTA confirm', async function(assert) {
  assert.expect(2);

  // mocking CSV process flow
  this.set('inputFile', {});

  this.fetchGdprJobListStub = sinon.stub();

  await render(hbs`
    {{shared/eis/csv-upload
      currentSection="finished"
      isForGdprDelete=true
      isGdprDeleteNotConfirmed=false
      showCsvUploadModal=true
      onGdprDeleteConfirm=fetchGdprJobListStub
    }}`);

  await click(SELECTORS.GDPR_DELETE_FINAL_MAIN_CTA_BTN);

  assert.ok(
    this.fetchGdprJobListStub.calledOnce,
    'restli call is made upon clicking main CTA'
  );

  assert
    .dom(SELECTORS.GDPR_DELETE_FINAL_MAIN_CTA_BTN)
    .doesNotExist('Modal closes down');
});