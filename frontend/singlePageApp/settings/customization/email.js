/**
 * Description: What is FYQ2: Email Customization?
Admins can finally customize learning invitation email so that email templates are more personal and engaging -> higher B2B sign up rate -> higher eQL


Background
Basic Flow: Admin creates a custom email template for inviting new learners (see screenshot: Customize learner invitation email). Once Save is clicked after filling up the email content (subject, header, message...), now UCF (Content Filter) kicks in to verify each content that admin has typed in does not violate filtering rules.


Having said that, the "status" for saved email template depends on result of Content Filtering (similiar to Custom Content) ["DRAFT", "PENDING", "BLOCKED", "PUBLISHED", "ARCHIVED"]


In detail,
1. When fetching email templates to load up the table, we load all types of status 
=> Then in an upcoming RB, the table will be updated to add labels pending published blocked next to template title (see screenshot: Reference #1)
2. When admin wants to search/select the template for inviting new users, we are only interseted in PUBLISHED templates.


Updates
- (update) email.js to use Finder Get by passing status and emailType for fetchEmailTemplates
- (update) Same as above for email-template-search-typeahead.js (+ integration test updated using Pretender)
- (update) BE has made an update to its schema, so UI should be in sync regarding schema name changes 


 */

import Component from '@glimmer/component';
import jSecure from '@linkedin/jsecure';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { htmlSafe } from '@ember/template';
import { dropTask } from 'ember-concurrency-decorators';
import { TOAST_TYPES } from 'artdeco-toast/utils/constants';
import { fetch, mergeRequestInfo } from 'lew-fetch';
import { get, update, create, destroy } from 'lew-fetch/restli';
import { constructRestliQueryString } from 'learning-enterprise-web/utils/restli-utils';
import config from 'learning-enterprise-web/config/environment';
import createTableTheme from 'learning-enterprise-web/utils/models-table/create-theme';
import { LEGO_ENUM_CONSTANTS } from 'learning-enterprise-web/utils/lego/constants';
import { tracked } from '@glimmer/tracking';
import { runTask, runDisposables } from 'ember-lifeline';

const TEMPLATE = 'components/c-pages/settings/customization/email';
const DEFAULT_ALERT = 'components/shared/alerts/default-alert';
const APP_INSTANCE_FINDER = 'appInstance';
const EMAIL_TEMPLATE_JET_ERROR_KEY = 'emailCustomization';
const EMAIL_TEMPLATE_ENDPOINT = `/${config.namespace}/learningEmailTemplates`;

const EMAIL_TEMPLATE_TYPE = {
  ACTIVATION: 'ACTIVATION'
};

const TEMPLATE_EDIT_STATE = {
  CREATING: 'creating',
  DUPLICATING: 'duplicating',
  UPDATING: 'updating',
  DELETING: 'deleting'
};

const TEMPLATE_ERROR_STATE = {
  DUPLICATE_NAME_FLAGGED: 'DUPLICATE_NAME_FLAGGED',
  UCF_FLAGGED: 'UCF_FLAGGED'
};

const API_ERROR_CODE = {
  UCF_FAILURE_ERROR_CODE: 422,
  DUPLICATE_TEMPLATE_NAME_ERROR_CODE: 412
};

const ERROR_GENERIC_MESSAGE = 'generic_error_message';

/**
 * This is component level page that hosts Customize Email feature
 *
 * @param {string?} launchpadWidgetToken - token is passed through URL query param once redirected from Launchpad card's CTA that leads to Customize Emails
 * @example
 * <CPages::Settings::Customization::Email
 *   @launchpadWidgetToken={{this.launchpadWidgetToken}}
 * />
 *
 * @lkim | Email Customization UI Spec can be found here:
 * https://iwww.corp.linkedin.com/wiki/cf/display/ENGS/Email+Customization+UI
 */
export default class EmailComponent extends Component {
  /** @type I18nService */
  @service()
  i18n;

  @service
  jet;

  @service
  configuration;

  @service('artdeco-toast')
  toastService;

  @service('apis/learning-enterprise')
  learningEnterpriseApi;

  @service('lego-tracking')
  legoTracking;

  /**
   * Set when template is flagged for error from API:
   *  1. If the target template to `CREATE / UPDATE / DUPLICATE` fails UCF (Universal Content Filtering) - 412 | Example: Admin has typed in swear word in while creating a new template
   *  2. If the template name to `CREATE` / `UPDATE` already exists in DB - 422
   * Note: Passed to `component:edit-template-modal`
   * @type {string?}
   */
  @tracked
  templateError;

  /**
   * Shared across CREATE / EDIT / DUPLICATE
   * @type {boolean}
   */
  @tracked
  isEditTemplateModalOpen = false;

  /**
   * for DELETE
   * @type {boolean}
   */
  @tracked
  isDeleteTemplateModalOpen = false;

  /**
   * Set when the admin decides to `CRUD`
   * @type {string}
   */
  @tracked
  templateEditState;

  /**
   * Fetched templates from /learning-enterprise-api
   * Each template goes through UCF and BE sets the status accordignly as PUBLISHED / BLOCKED / PENDING (Reference: go/ucf)
   * @type {?object[]} - array of template objects
   */
  @tracked
  fetchedTemplates = [];

  /**
   * Set when user clicks one of action buttons on the target template from the table
   * @type {?object} - A template object that is marked to `CREATE / UPDATE / DUPLICATE`
   */
  @tracked
  selectedTemplate;

  /**
   * Set when user clicks one of action buttons on the target template
   * @type {?object} - A template object that is marked to `DELETE`
   */
  @tracked
  markedToDelete;

  /**
   * [a11y] Set when user clicks the dismiss button of creating a template email in the customize invitation emails tab
   */
  @tracked
  shouldFocusCreateTemplateButton = false;

  /**
   * Set as `ACTIVATION` - Potentially can be used as a bridge when new email types are included in this component - verify with permission
   * @type {?object} - A template object that is marked to `CREATE / UPDATE / DUPLICATE`
   */
  selectedTemplateType = EMAIL_TEMPLATE_TYPE.ACTIVATION;

  /**
   * Theme for models-table
   * @type {object}
   */
  tableTheme = createTableTheme();

  /**
   * `CREATE` a new email template
   * @param {object} template
   */
  @dropTask
  createTemplate = function* (template) {
    template.emailType = this.selectedTemplateType;

    yield fetch(
      EMAIL_TEMPLATE_ENDPOINT,
      mergeRequestInfo(
        this.learningEnterpriseApi.fetchRequestInfo,
        create(template)
      )
    );
  };

  /**
   * `UPDATE` a target email template
   * @param {object} template
   */
  @dropTask
  updateTemplate = function* (template) {
    yield fetch(
      `${EMAIL_TEMPLATE_ENDPOINT}/${template.urn}`,
      mergeRequestInfo(
        this.learningEnterpriseApi.fetchRequestInfo,
        update(template)
      )
    );
  };

  /**
   * `DELETE` a email template
   * @param {object} template
   */
  @dropTask
  deleteTemplate = function* (template) {
    try {
      yield fetch(
        `${EMAIL_TEMPLATE_ENDPOINT}/${template.urn}`,
        mergeRequestInfo(this.learningEnterpriseApi.fetchRequestInfo, destroy())
      );
      this.isDeleteTemplateModalOpen = false;
      this._showSuccessMessage(template);
    } catch (e) {
      this.jet.error(e, EMAIL_TEMPLATE_JET_ERROR_KEY, false);
      this._showGenericErrorMessage();
    }
  };

  /**
   * `GET` Finder: appInstance
   */
  @dropTask
  fetchEmailTemplates = function* () {
    try {
      const query = {
        q: APP_INSTANCE_FINDER,
        emailType: EMAIL_TEMPLATE_TYPE.ACTIVATION
      };

      const response = yield fetch(
        [EMAIL_TEMPLATE_ENDPOINT, constructRestliQueryString(query)].join('?'),
        mergeRequestInfo(
          get(),
          this.learningEnterpriseApi.restliFetchRequestInfo
        )
      );

      const data = yield response.json();

      this.fetchedTemplates = data.elements;
    } catch (e) {
      this._showGenericErrorMessage();
      this.jet.error(e, EMAIL_TEMPLATE_JET_ERROR_KEY, false);
    }
  };

  /**
   * `GET` full template detail (api response from initial fetch lacks header, message...)
   * @param {string} urn - email template urn
   */
  @dropTask
  fetchEmailTemplateDetail = function* (urn) {
    if (!urn) {
      return;
    }
    const response = yield fetch(
      `${EMAIL_TEMPLATE_ENDPOINT}/${urn}`,
      mergeRequestInfo(get(), this.learningEnterpriseApi.fetchRequestInfo)
    );

    const data = yield response.json();
    return data;
  };

  /**
   * Show edit modal while setting 'selectedTemplate' as 'record' for `UPDATE` only
   * @param {?object} record : optional - passed when one row item is selected from ModelsTable
   */
  @dropTask
  initiateEdit = function* (record, closefn) {
    let template;
    let templateError;

    try {
      template = yield this.fetchEmailTemplateDetail.perform(record.urn);

      if (record.status === 'BLOCKED') {
        templateError = TEMPLATE_ERROR_STATE.UCF_FLAGGED;
      }

      // BE does not pass `locale` if the template is saved as `All languages`,
      if (!template.locale) {
        template.locale = 'all';
      }

      this.selectedTemplate = template;
      this.isEditTemplateModalOpen = true;
      this.templateEditState = TEMPLATE_EDIT_STATE.UPDATING;
      this.templateError = templateError;
    } catch (e) {
      this.jet.error(e, EMAIL_TEMPLATE_JET_ERROR_KEY, false);
      this._showGenericErrorMessage();
    }

    if (typeof closefn === 'function') {
      runTask(this, () => closefn());
    }
  };

  /**
   * Show edit modal for `CREATE / DUPLICATE`
   * @param {?object} record : optional - passed when one row item is selected from ModelsTable
   */
  @dropTask
  initiateCreate = function* (record, closefn) {
    let template = {};
    let templateEditState = TEMPLATE_EDIT_STATE.CREATING;

    if (record) {
      // if the record exists, that means admin has selected one of templates from the table to `DUPLICATE`
      templateEditState = TEMPLATE_EDIT_STATE.DUPLICATING;
      template = yield this.fetchEmailTemplateDetail.perform(record.urn);
      closefn(true);
    }

    this.selectedTemplate = template;
    this.isEditTemplateModalOpen = true;
    this.templateEditState = templateEditState;
  };

  /**
   * Passed to `component:edit-template-modal`
   * @param {object} template - a target template to `CREATE / UPDATE / DUPLICATE`
   */
  @dropTask
  save = function* (template) {
    if (!template) {
      return;
    }

    try {
      switch (this.templateEditState) {
        // fall through for `CREATE / DUPLICATE`
        case TEMPLATE_EDIT_STATE.CREATING:
        case TEMPLATE_EDIT_STATE.DUPLICATING:
          yield this.createTemplate.perform(template);
          break;
        case TEMPLATE_EDIT_STATE.UPDATING:
          yield this.updateTemplate.perform(template);
          break;
      }
      this._showSuccessMessage(template);

      if (this.args.launchpadWidgetToken) {
        this._fireLegoAction(LEGO_ENUM_CONSTANTS.LEGO_ACTION_PRIMARY);
      }
    } catch (e) {
      const status = e.response.status;
      this.selectedTemplate = template;

      // Template content fails Universal Content Filtering (UCF)
      if (status === API_ERROR_CODE.UCF_FAILURE_ERROR_CODE) {
        this.templateError = TEMPLATE_ERROR_STATE.UCF_FLAGGED;
        return;
      }

      // Template name already exists in DB
      if (status === API_ERROR_CODE.DUPLICATE_TEMPLATE_NAME_ERROR_CODE) {
        this.templateError = TEMPLATE_ERROR_STATE.DUPLICATE_NAME_FLAGGED;
        return;
      }

      // general error
      this.jet.error(e, EMAIL_TEMPLATE_JET_ERROR_KEY, false);
      this._showGenericErrorMessage();
    }

    // tear down (modal, internal data state)
    this.dismissEditState();
    yield this.fetchEmailTemplates.perform();
  };

  /**
   * Passed to `component:delete-template-modal`
   */
  @dropTask
  delete = function* () {
    yield this.deleteTemplate.perform(this.markedToDelete);
    yield this.fetchEmailTemplates.perform();

    // tear down (modal, internal data state)
    this.dismissDeleteState();
  };

  /**
   * Show delete modal while setting `markedToDelete` as `record` for `DELETE`
   * @param {object} record - passed when one row item is selected from `ModelsTable`
   */
  @action
  initiateDelete(record, closefn) {
    this.markedToDelete = record;
    this.isDeleteTemplateModalOpen = true;
    this.templateEditState = TEMPLATE_EDIT_STATE.DELETING;

    closefn(true);
  }

  @action
  dismissEditState() {
    this.isEditTemplateModalOpen = false;
    this.selectedTemplate = undefined;
    this.templateEditState = undefined;
    this.templateError = undefined;

    this.shouldFocusCreateTemplateButton = true;
  }

  @action
  dismissDeleteState() {
    this.isDeleteTemplateModalOpen = false;
    this.markedToDelete = undefined;
    this.templateEditState = undefined;
  }

  /**
   * @override
   */
  constructor() {
    super(...arguments);
    this.fetchEmailTemplates.perform();
  }

  willDestroy() {
    runDisposables(this);
  }

  /**
   * This is a generic method that will be called when a succesful change has been made
   */
  _showSuccessMessage(template = {}) {
    let key;
    let shouldShowCtaOnToast;

    switch (this.templateEditState) {
      // fall through for `CREATE / DUPLICATE`
      case TEMPLATE_EDIT_STATE.CREATING:
      case TEMPLATE_EDIT_STATE.DUPLICATING:
        key = 'save_success_toast_new';
        shouldShowCtaOnToast = true;
        break;
      case TEMPLATE_EDIT_STATE.DELETING:
        key = 'delete_success_toast';
        break;
      case TEMPLATE_EDIT_STATE.UPDATING:
        key = 'update_success_toast';
        break;
    }

    const message = this.i18n.lookupTranslation(
      TEMPLATE,
      key
    )([
      {
        templateName: template.name
      }
    ]);

    this.toastService.add({
      type: TOAST_TYPES.SUCCESS,
      message: htmlSafe(jSecure.sanitizeHTML(message)),
      ctaText: shouldShowCtaOnToast
        ? htmlSafe(this.i18n.lookupTranslation(TEMPLATE, 'go_to_people_page')())
        : null,
      ctaRouteName: shouldShowCtaOnToast ? 'eis.people.users.index' : null,
      ctaControlName: 'email__go_to_people_tab_from_toast'
    });
  }

  /**
   * This is a generic method that will be called when an error has occurred
   */
  _showGenericErrorMessage() {
    const genericErrorMessage = this.i18n.lookupTranslation(
      DEFAULT_ALERT,
      ERROR_GENERIC_MESSAGE
    )();

    this.toastService.add({
      type: TOAST_TYPES.ERROR,
      message: genericErrorMessage
    });
  }

  /**
   * Only fired when the origin of action is Launchpad
   * We use query-param to figure out who's coming from Launchpad or not (launchpadWidgetToken)
   * @param {string} action
   */
  _fireLegoAction(action) {
    this.legoTracking.sendLegoAction(this.args.launchpadWidgetToken, action, 1);
  }
}