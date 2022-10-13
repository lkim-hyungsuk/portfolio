import Component from '@ember/component';
import { assert } from '@ember/debug';
import { htmlSafe } from '@ember/string';
import { readOnly } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { tagName } from '@ember-decorators/component';
import { action, computed, set, setProperties } from '@ember/object';
import {
  parseLocaleCode,
  getLocaleCode
} from 'learning-enterprise-web/utils/locales';
import removeEmptyKeys from 'learning-enterprise-web/utils/shared/remove-empty-keys';
import showConfirmation from 'learning-enterprise-web/utils/show-confirmation';
import config from 'learning-enterprise-web/config/environment';

const IS_TESTING = config.environment === 'test';

@tagName('')
export default class EditTemplateModalComponent extends Component {
  @service()
  configuration;

  @service()
  device;

  /**
   * @type {boolean}
   */
  isOpen;

  /**
   * Preferrably `isDirty`, but named this way so the template isn't cluttered
   * with `not isDirty`
   *
   * @type {boolean}
   */
  isPristine = true;

  /**
   * @type {string}
   */
  header = '';

  /**
   * @type {number}
   */
  headerMaxLength = 150;

  /**
   * @type {string}
   */
  locale = '';

  /**
   * @type {string}
   */
  message = '';

  /**
   * @type {number}
   */
  messageMaxLength = 300;

  /**
   * @type {string}
   */
  name = '';

  /**
   * @type {number}
   */
  nameMaxLength = 250;

  /**
   * @type {() => void}
   */
  onDismiss;

  /**
   * @type {({ header: string, locale: string, message: string, name: string, subject: string }) => void}
   */
  onSave;

  /**
   * @type {string}
   */
  subject = '';

  /**
   * @type {number}
   */
  subjectMaxLength = 75;

  /**
   * @type {?object}
   */
  template;

  /**
   * Passed from parent container
   * @type {?boolean}
   */
  isDuplicating;

  /**
   * Set when user starts editing the name
   * Used as a flag to prevent cases like `Copy of 'in the middle of' Copy of 'typing'...`
   */
  isNameEdited = false;

  /**
   * Confirmation message that shows when user tries to dismiss the modal
   * Passed from the parent container (`c-pages/settings/customization/email`)
   * @type {string}
   */
  onDismissText;

  /**
   * Prefix with `Copy of` (translated) to the template name for `DUPLICATE`
   * @type {string}
   */
  @computed('name', 'isDuplicating')
  get computedName() {
    const originalName = this.name;

    if (this.isDuplicating && !this.isNameEdited) {
      this.set('isNameEdited', true);

      const originalName = this.name;
      const prefix = this._getTranslation('copy_of');

      // Tack with spacebar (' ')
      return `${prefix}\u0020`.concat(originalName);
    }
    return originalName;
  }

  @readOnly('configuration.hasMultipleLicenseLocales')
  hasMultipleLicenseLocales;

  @readOnly('configuration.companyName')
  companyName;

  @computed('header')
  get isValidHeader() {
    const length = this.header.trim().length;

    return length > 0 && length <= this.headerMaxLength;
  }

  @computed('message')
  get isValidMessage() {
    const length = this.message.trim().length;

    return length > 0 && length <= this.messageMaxLength;
  }

  @computed('computedName')
  get isValidName() {
    const length = this.computedName.trim().length;

    return length > 0 && length <= this.nameMaxLength;
  }

  @computed('subject')
  get isValidSubject() {
    const length = this.subject.trim().length;

    return length > 0 && length <= this.subjectMaxLength;
  }

  init() {
    super.init(...arguments);
    assert('`onDismiss` is required', typeof this.onDismiss === 'function');
    assert('`onSave` is required', typeof this.onSave === 'function');
  }

  didReceiveAttrs() {
    super.didReceiveAttrs(...arguments);

    const {
      urn = '',
      subject = this._getTranslation('default_subject').string,
      header = this._getTranslation('default_header', [
        {
          companyName: this.companyName
        }
      ]).string,
      message = this._getTranslation('default_message').string,
      name = '',
      emailType = '',
      status = ''
    } = this.template || {};

    let locale;

    if (this.template && this.template.locale) {
      locale = getLocaleCode(this.template.locale) || {}; // if the passed locale is "all" (string), reset it as empty object, following the API contract
    } else {
      locale = this.configuration.defaultLicenseLocale.id;
    }

    setProperties(this, {
      urn,
      header,
      isPristine: true,
      locale,
      message,
      name,
      subject,
      emailType,
      status
    });
  }

  @action
  handleSubmit(event) {
    event.preventDefault();

    if (
      this.isValidHeader &&
      this.isValidMessage &&
      this.isValidName &&
      this.isValidSubject
    ) {
      const { urn, emailType, header, message, subject, locale } = this;

      let massagedLocale;
      if (locale) {
        massagedLocale =
          typeof locale === 'string' ? parseLocaleCode(locale) : locale.data;
      }

      this.onSave(
        removeEmptyKeys({
          urn,
          emailType,
          subject,
          header,
          message,

          // massaged data
          name: this.computedName,
          locale: massagedLocale
        })
      );
    } else {
      set(this, 'isPristine', false);
    }
  }

  @action
  tryDismiss() {
    if (!(IS_TESTING || showConfirmation(this.onDismissText))) {
      return false;
    }

    this.onDismiss();
  }

  /**
   * Wrapper around i18n.lookupTransation
   * @param  {string} key
   * @param  {?object[]} params
   * @return {string} The corresponding translated string
   * @private
   */
  _getTranslation(key, params) {
    return htmlSafe(
      jSecure.sanitizeHTML(
        this.i18n.lookupTranslation(
          'components/c-pages/settings/customization/edit-template-modal',
          key
        )(params)
      )
    );
  }
}
