import { assign } from '@ember/polyfills';
import { copy } from 'ember-copy';
import { get } from '@ember/object';
import { setupModalOutlet } from 'artdeco-modal/test-support';
import { module, test } from 'qunit';
import {
  visit,
  find,
  findAll,
  click,
  currentURL,
  fillIn,
  triggerEvent
} from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import setupAcceptanceTest from 'learning-enterprise-web/tests/helpers/setup-acceptance-test';
import configuration from 'learning-enterprise-web/mirage/fixtures/configuration';
import currentUser from 'learning-enterprise-web/mirage/fixtures/current-user';

const KEY_EVENTS = {
  PAGE_KEY_EVENT: 'd_learning-enterprise_settings_customization_emails',
  GO_TO_PEOPLE_BTN: 'email__go_to_people_tab'
};

const SELECTORS = {
  ADD_TEMPLATE_BUTTON: '[data-test-email-customization-add-template-button]',
  MODAL_CONTAINER: '[data-test-modal-container]',
  MODAL_CLOSE_BUTTON: '[data-test-modal-close-btn]',
  MODAL_DELETE_BUTTON: '[data-test-delete-template-modal-delete-button]',
  MORE_ACTIONS_BUTTON: '[data-test-more-actions-dropdown]',
  ARTDECO_DROPDOWN: '[data-test-more-actions-item]',
  TABLE_CELL: '.artdeco-models-table tbody tr',
  TEMPLATE_NAME: '[data-test-key-mapping-name]',
  GO_TO_PEOPLE: '[data-test-email-customization-go-to-people-page]',

  // component:edit-template-modal
  EDIT_TEMPLATE_MODAL: '[data-test-edit-template-modal]',
  NAME_INPUT: '[data-test-edit-template-modal-name-input] input',
  SUBJECT_INPUT: '[data-test-input-with-tooltip-input="SUBJECT"]',
  HEADER_INPUT: '[data-test-input-with-tooltip-input="HEADER"]',
  MESSAGE_INPUT: '[data-test-input-with-tooltip-input="MESSAGE"]',
  INLINE_FEEDBACK: '[data-test-edit-template-modal-inline-feedback]',
  MODAL_SAVE_BUTTON: '[data-test-edit-template-modal-save-button]',
  MODAL_CANCEL_BUTTON: '[data-test-edit-template-modal-cancel-button]',
  UCF_ERROR_MSG: '[data-test-edit-template-modal-content-inappropriate]',
  LANGUAGE_DROPDOWN: '[data-test-language-selection]',

  // component:delete-template-modal
  DELETE_CONFIRM_BUTTON: '[data-test-delete-template-modal-delete-button]',

  // component:email-template-preview
  PREVIEW_SUBJECT: '[data-test-email-template-preview-subject]',
  PREVIEW_HEADER: '[data-test-email-template-preview-header]',
  PREVIEW_MESSAGE: '[data-test-email-template-preview-message]',

  // component:more-actions-dropdown
  DROPDOWN_DUPLICATE: '[data-test-more-actions-item=Duplicate]',
  DROPDOWN_EDIT: '[data-test-more-actions-item=Edit]',
  DROPDOWN_DELETE: '[data-test-more-actions-item=Delete]',
  SEND_TEST_EMAIL: '[data-test-more-actions-item="Send test email"]',

  // artdeco-toast
  ARTDECO_TOAST: '[data-test-message-content]',
  ARTDECO_TOAST_CTA: '[data-test-customize-email-toast-cta]'
};

function currentUserWithPermissions(permissions) {
  return assign({}, currentUser, {
    permissions
  });
}

function configWithPermissions(permissions) {
  const config = copy(configuration);
  config.currentUser = currentUserWithPermissions(permissions);

  return config;
}

module('Acceptance | /settings/customization/emails', function (hooks) {
  setupApplicationTest(hooks);
  setupAcceptanceTest(hooks);
  setupModalOutlet(hooks);

  hooks.beforeEach(function () {
    this.lix.overrideTreatment(
      'learning.enterprise.web.people.to.accountcenter',
      'control'
    );
  });

  test('fires LEGO PRIMARY action event when user creates a template successfully, guided by Launchpad', async function (assert) {
    const handledRequests = this.server.pretender.handledRequests;

    // `launchpadWidgetToken` => only set when it's coming from Launchpad
    await visit(
      '/settings/customization/emails?launchpadWidgetToken=testToken'
    );
    await click(SELECTORS.ADD_TEMPLATE_BUTTON);

    await fillIn(SELECTORS.NAME_INPUT, 'test name');
    await fillIn(SELECTORS.SUBJECT_INPUT, 'test subject');
    await fillIn(SELECTORS.HEADER_INPUT, 'test header');
    await fillIn(SELECTORS.MESSAGE_INPUT, 'test message');

    await click(SELECTORS.MODAL_SAVE_BUTTON);

    const createCall = handledRequests.filter(handled => {
      return (
        handled.method.includes('POST') &&
        handled.url.includes(`/learning-enterprise-api/learningEmailTemplates`)
      );
    }).length;

    assert.equal(
      createCall,
      1,
      'Request method type is POST and call made to proper path'
    );

    this.trackingSession
      .assertEvent(
        event =>
          event.eventInfo.eventName === 'LegoWidgetActionEvent' &&
          event.eventBody.actionCategory === 'PRIMARY_ACTION',
        'LegoWidgetActionEvent'
      )
      .occurs(1);
  });

  test('fires page view event', async function () {
    await visit('/settings/customization/emails');

    this.trackingSession
      .assertPageViewEvent(KEY_EVENTS.PAGE_KEY_EVENT)
      .occurs(1)
      .assertOccurrences();
  });

  test('goes to People tab when the link is clicked', async function (assert) {
    await visit('/settings/customization/emails');
    await click(SELECTORS.GO_TO_PEOPLE);

    this.trackingSession.assertInteractionEvent(
      KEY_EVENTS.GO_TO_PEOPLE_BTN,
      'fires interaction event'
    );

    assert.ok(
      currentURL().includes('/people/users'),
      'redirects to People tab'
    );
  });

  test('shows permissions denied if user does not meet page rendering criteria', async function (assert) {
    const permissions = [
      { name: 'LEARNING-ADMIN-ACCESS', scope: ['appinstances'] },
      { name: 'EisGroup_Read', scope: ['appinstances'] },
      { name: 'EisProfile_Read', scope: ['appinstances'] }
    ];

    this.server.get('/initialContext', () =>
      configWithPermissions(permissions)
    );
    this.server.get('/initialContext/currentUser', () =>
      currentUserWithPermissions(permissions)
    );

    await visit('/settings/customization/emails');

    assert.equal(
      currentURL(),
      '/permissions-denied',
      'shows permissions denied page'
    );
  });

  test('table renders succesfully with email template data', async function (assert) {
    const handledRequests = this.server.pretender.handledRequests;
    await visit('/settings/customization/emails');

    assert.equal(
      findAll(SELECTORS.TABLE_CELL).length,
      4,
      'Succesfully loads the mock data'
    );

    const getCall = handledRequests.filter(
      handled =>
        handled.method.includes('GET') &&
        handled.url.includes(
          `/learning-enterprise-api/learningEmailTemplates?q=appInstance&emailType=ACTIVATION`
        )
    ).length;

    assert.equal(
      getCall,
      1,
      'Request method type is GET Finder (appInstance) and call made to proper path'
    );
  });

  test('it saves customized template succesfully and populates the field on dynamic render accordingly', async function (assert) {
    const handledRequests = this.server.pretender.handledRequests;

    await visit('/settings/customization/emails');
    await click(SELECTORS.ADD_TEMPLATE_BUTTON);

    await fillIn(SELECTORS.NAME_INPUT, 'test name');
    await fillIn(SELECTORS.SUBJECT_INPUT, 'test subject');
    await fillIn(SELECTORS.HEADER_INPUT, 'test header');
    await fillIn(SELECTORS.MESSAGE_INPUT, 'test message');
    await click(SELECTORS.LANGUAGE_DROPDOWN);
    const select = find(SELECTORS.LANGUAGE_DROPDOWN);
    select.selectedIndex = 1;
    await triggerEvent(select, 'change');

    // Dynamic Render check
    const subject = find(SELECTORS.PREVIEW_SUBJECT).textContent.trim();
    const header = find(SELECTORS.PREVIEW_HEADER).textContent.trim();
    const message = find(SELECTORS.PREVIEW_MESSAGE).textContent.trim();

    assert.equal(subject, 'test subject');
    assert.equal(header, 'test header');
    assert.equal(message, 'test message');
    assert
      .dom(SELECTORS.UCF_ERROR_MSG)
      .doesNotExist('UCF error message does not show up');

    await click(SELECTORS.MODAL_SAVE_BUTTON);

    const createCall = handledRequests.filter(handled => {
      const requestBody = JSON.parse(handled.requestBody);

      return (
        handled.method.includes('POST') &&
        handled.url.includes(
          `/learning-enterprise-api/learningEmailTemplates`
        ) &&
        get(requestBody, 'locale.language') === 'en' &&
        get(requestBody, 'locale.country') === 'US'
      );
    }).length;

    assert.equal(
      createCall,
      1,
      'Request method type is POST and call made to proper path'
    );

    const getCall = handledRequests.filter(
      handled =>
        handled.method.includes('GET') &&
        handled.url.includes(`/learning-enterprise-api/learningEmailTemplates`)
    ).length;

    assert.equal(
      getCall,
      2,
      'Request method type is GET and call made to proper path'
    );

    assert.dom(SELECTORS.ARTDECO_TOAST).exists('Toast pops up');

    await click(SELECTORS.ARTDECO_TOAST_CTA);
    assert.ok(
      currentURL().includes('/people/users'),
      'redirects to People tab from toast CTA'
    );
  });

  test('it saves customized template in all language succesfully', async function (assert) {
    const handledRequests = this.server.pretender.handledRequests;

    await visit('/settings/customization/emails');
    await click(SELECTORS.ADD_TEMPLATE_BUTTON);

    await fillIn(SELECTORS.NAME_INPUT, 'test name');
    await fillIn(SELECTORS.SUBJECT_INPUT, 'test subject');
    await fillIn(SELECTORS.HEADER_INPUT, 'test header');
    await fillIn(SELECTORS.MESSAGE_INPUT, 'test message');
    await click(SELECTORS.LANGUAGE_DROPDOWN);
    const select = find(SELECTORS.LANGUAGE_DROPDOWN);
    select.selectedIndex = 1; // first switch to English
    await triggerEvent(select, 'change');
    select.selectedIndex = 0; // then switch back to all language
    await triggerEvent(select, 'change');

    await click(SELECTORS.MODAL_SAVE_BUTTON);

    const createCall = handledRequests.filter(
      handled =>
        handled.method.includes('POST') &&
        handled.url.includes(
          `/learning-enterprise-api/learningEmailTemplates`
        ) &&
        !handled.requestBody.includes('"locale"')
    ).length;

    assert.equal(
      createCall,
      1,
      'Request method type is POST and call made to proper path'
    );
  });

  test('it deletes customized template succesfully', async function (assert) {
    const handledRequests = this.server.pretender.handledRequests;

    await visit('/settings/customization/emails');
    await click(SELECTORS.MORE_ACTIONS_BUTTON);
    await click(SELECTORS.DROPDOWN_DELETE);
    await click(SELECTORS.MODAL_DELETE_BUTTON);

    const deleteCall = handledRequests.filter(
      handled =>
        handled.method.includes('DELETE') &&
        handled.url.includes(
          `/learning-enterprise-api/learningEmailTemplates/1`
        )
    ).length;

    assert.equal(
      deleteCall,
      1,
      'Request method type is DELETE and call made to proper path'
    );

    const getCall = handledRequests.filter(
      handled =>
        handled.method.includes('GET') &&
        handled.url.includes(`/learning-enterprise-api/learningEmailTemplates`)
    ).length;

    assert.equal(
      getCall,
      2,
      'Request method type is GET and call made to proper path'
    );
  });

  test('it updates successfully and populates correct fields', async function (assert) {
    const handledRequests = this.server.pretender.handledRequests;

    await visit('/settings/customization/emails');
    await click(SELECTORS.MORE_ACTIONS_BUTTON);
    await click(SELECTORS.DROPDOWN_EDIT);

    // Dynamic Render check
    const subject = find(SELECTORS.PREVIEW_SUBJECT).textContent.trim();
    const header = find(SELECTORS.PREVIEW_HEADER).textContent.trim();
    const message = find(SELECTORS.PREVIEW_MESSAGE).textContent.trim();

    assert.equal(subject, 'fake subject');
    assert.equal(header, 'fake header');
    assert.equal(message, 'fake message');
    assert
      .dom(SELECTORS.UCF_ERROR_MSG)
      .doesNotExist('UCF error message does not show up');

    await click(SELECTORS.MODAL_SAVE_BUTTON);

    const createCall = handledRequests.filter(
      handled =>
        handled.method.includes('PUT') &&
        handled.url.includes(`/learning-enterprise-api/learningEmailTemplates`)
    ).length;

    assert.equal(
      createCall,
      1,
      'Request method type is POST and call made to proper path'
    );

    const getCall = handledRequests.filter(
      handled =>
        handled.method.includes('GET') &&
        handled.url.includes(
          `/learning-enterprise-api/learningEmailTemplates/1`
        )
    ).length;

    assert.equal(
      getCall,
      1,
      'Request method type is GET and call made to proper path'
    );
  });

  test('it duplicates succesfully and populates correct fields', async function (assert) {
    const handledRequests = this.server.pretender.handledRequests;

    await visit('/settings/customization/emails');
    await click(SELECTORS.MORE_ACTIONS_BUTTON);
    await click(SELECTORS.DROPDOWN_DUPLICATE);

    // Dynamic Render check
    const subject = find(SELECTORS.PREVIEW_SUBJECT).textContent.trim();
    const header = find(SELECTORS.PREVIEW_HEADER).textContent.trim();
    const message = find(SELECTORS.PREVIEW_MESSAGE).textContent.trim();

    assert.equal(subject, 'fake subject');
    assert.equal(header, 'fake header');
    assert.equal(message, 'fake message');
    assert
      .dom(SELECTORS.UCF_ERROR_MSG)
      .doesNotExist('UCF error message does not show up');

    assert
      .dom(SELECTORS.NAME_INPUT)
      .hasValue('Copy of fake name', 'Prefixes with `Copy of` for DUPLICATE');

    await click(SELECTORS.MODAL_SAVE_BUTTON);

    const createCall = handledRequests.filter(
      handled =>
        handled.method.includes('POST') &&
        handled.url.includes(`/learning-enterprise-api/learningEmailTemplates`)
    ).length;

    assert.equal(
      createCall,
      1,
      'Request method type is POST and call made to proper path'
    );

    const getCall = handledRequests.filter(
      handled =>
        handled.method.includes('GET') &&
        handled.url.includes(
          `/learning-enterprise-api/learningEmailTemplates/1`
        )
    ).length;

    assert.equal(
      getCall,
      1,
      'Request method type is GET and call made to proper path'
    );
  });

  test('opens edit modal when the template name is clicked', async function (assert) {
    assert.expect(1);

    await visit('/settings/customization/emails');
    const templateName = findAll(SELECTORS.TEMPLATE_NAME)[1]; // skipping default template
    await click(templateName);

    assert
      .dom(SELECTORS.EDIT_TEMPLATE_MODAL)
      .exists('Edit template modal shows up when the template name is clicked');
  });

  test("Handle 422 - shows UCF failure message on the modal when `BLOCKED` template's name is clicked", async function (assert) {
    assert.expect(2);

    await visit('/settings/customization/emails');

    // BLOCKED template
    const templateName = findAll(SELECTORS.TEMPLATE_NAME)[1];
    await click(templateName);

    assert
      .dom(SELECTORS.EDIT_TEMPLATE_MODAL)
      .exists('Edit template modal shows up when the template name is clicked');

    assert
      .dom(SELECTORS.UCF_ERROR_MSG)
      .exists(
        'UCF error message shows up when `BLOCKED` template name is clicked from the table'
      );
  });

  test('Handle 422 - UCF (Universal Content Filtering) failure API failure succesfully for CREATE/UPDATE/DUPLICATE', async function (assert) {
    assert.expect(8);
    const handledRequests = this.server.pretender.handledRequests;

    this.server.post(
      '/learningEmailTemplates',
      { errors: ['UCF failure'] },
      422
    );

    this.server.put(
      '/learningEmailTemplates/:id',
      { errors: ['UCF failure'] },
      422
    );

    await visit('/settings/customization/emails');
    await click(SELECTORS.ADD_TEMPLATE_BUTTON);

    await fillIn(SELECTORS.NAME_INPUT, 'test name');
    await fillIn(SELECTORS.SUBJECT_INPUT, 'test subject');
    await fillIn(SELECTORS.HEADER_INPUT, 'test header');
    await fillIn(SELECTORS.MESSAGE_INPUT, 'test message');

    // Dynamic Render check
    const subject = find(SELECTORS.PREVIEW_SUBJECT).textContent.trim();
    const header = find(SELECTORS.PREVIEW_HEADER).textContent.trim();
    const message = find(SELECTORS.PREVIEW_MESSAGE).textContent.trim();

    assert
      .dom(SELECTORS.UCF_ERROR_MSG)
      .doesNotExist('UCF error message does not show up');

    await click(SELECTORS.MODAL_SAVE_BUTTON);

    const createCall = handledRequests.filter(
      handled =>
        handled.method.includes('POST') &&
        handled.url.includes(`/learning-enterprise-api/learningEmailTemplates`)
    ).length;

    assert.equal(
      createCall,
      1,
      'Request method type is POST and call made to proper path'
    );

    assert
      .dom(SELECTORS.UCF_ERROR_MSG)
      .exists('UCF error message shows up when api returns 422 for CREATE');

    // existing content should remain the same
    assert.equal(subject, 'test subject');
    assert.equal(header, 'test header');
    assert.equal(message, 'test message');

    // for DUPLICATE
    await click(SELECTORS.MODAL_CANCEL_BUTTON);
    await click(SELECTORS.MORE_ACTIONS_BUTTON);
    await click(SELECTORS.DROPDOWN_DUPLICATE);
    await click(SELECTORS.MODAL_SAVE_BUTTON);
    assert
      .dom(SELECTORS.UCF_ERROR_MSG)
      .exists('UCF error message shows up when api returns 422 for DUPLICATE');

    // for UPDATE
    await click(SELECTORS.MODAL_CANCEL_BUTTON);
    await click(SELECTORS.MORE_ACTIONS_BUTTON);
    await click(SELECTORS.DROPDOWN_EDIT);
    await click(SELECTORS.MODAL_SAVE_BUTTON);

    assert
      .dom(SELECTORS.UCF_ERROR_MSG)
      .exists('UCF error message shows up when api returns 422 for UPDATE');
  });

  test('Handle 412 - show inline error message when template name to be saved already exists', async function (assert) {
    assert.expect(7);
    const handledRequests = this.server.pretender.handledRequests;

    this.server.post(
      '/learningEmailTemplates',
      { errors: ['Template name already exists'] },
      412
    );

    this.server.put(
      '/learningEmailTemplates/:id',
      { errors: ['Template name already exists'] },
      412
    );

    await visit('/settings/customization/emails');
    await click(SELECTORS.ADD_TEMPLATE_BUTTON);

    await fillIn(SELECTORS.NAME_INPUT, 'test name');
    await fillIn(SELECTORS.SUBJECT_INPUT, 'test subject');
    await fillIn(SELECTORS.HEADER_INPUT, 'test header');
    await fillIn(SELECTORS.MESSAGE_INPUT, 'test message');

    // Dynamic Render check
    const subject = find(SELECTORS.PREVIEW_SUBJECT).textContent.trim();
    const header = find(SELECTORS.PREVIEW_HEADER).textContent.trim();
    const message = find(SELECTORS.PREVIEW_MESSAGE).textContent.trim();

    await click(SELECTORS.MODAL_SAVE_BUTTON);

    const createCall = handledRequests.filter(
      handled =>
        handled.method.includes('POST') &&
        handled.url.includes(`/learning-enterprise-api/learningEmailTemplates`)
    ).length;

    assert.equal(
      createCall,
      1,
      'Request method type is POST and call made to proper path'
    );

    assert
      .dom(SELECTORS.INLINE_FEEDBACK)
      .exists('Inline error message shows up when api returns 412 for CREATE');

    // existing content should remain the same
    assert.equal(subject, 'test subject');
    assert.equal(header, 'test header');
    assert.equal(message, 'test message');

    // for DUPLICATE
    await click(SELECTORS.MODAL_CANCEL_BUTTON);
    await click(SELECTORS.MORE_ACTIONS_BUTTON);
    await click(SELECTORS.DROPDOWN_DUPLICATE);
    await click(SELECTORS.MODAL_SAVE_BUTTON);
    assert
      .dom(SELECTORS.INLINE_FEEDBACK)
      .exists(
        'Inline error message shows up when api returns 412 for DUPLICATE'
      );

    // for UPDATE
    await click(SELECTORS.MODAL_CANCEL_BUTTON);
    await click(SELECTORS.MORE_ACTIONS_BUTTON);
    await click(SELECTORS.DROPDOWN_EDIT);
    await click(SELECTORS.MODAL_SAVE_BUTTON);

    assert
      .dom(SELECTORS.INLINE_FEEDBACK)
      .exists('Inline error message shows up when api returns 412 for UPDATE');
  });
});