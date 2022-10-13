import Component from '@glimmer/component';
import createTableTheme from 'learning-enterprise-web/utils/models-table/create-theme';
import { inject as service } from '@ember/service';
import { TOAST_TYPES } from 'artdeco-toast/utils/constants';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { task } from 'ember-concurrency-decorators';
import { getDomainUrl } from 'learning-enterprise-web/utils/url-manager';
import PEM_TRACKING_METADATA from 'learning-enterprise-web/utils/constants/degradations/activate';

const TEMPLATE = 'components/shared/alerts/default-alert';
const APPLICATION_INSTANCE = 'applicationInstance';
const BULK_ACTION_TYPE = 'EP_BATCH_GDPR_DELETE_PROFILES';

export default class UserDeletionComponent extends Component {
  @service('artdeco-toast')
  toastService;

  @service configuration;

  /** @type I18nService */
  @service i18n;

  @service jet;

  @service store;

  @service pemTracking;

  @service('eis/file-service')
  fileService;

  /**
   * Theme for models-table
   * @type {object}
   */
  tableTheme = createTableTheme();

  /**
   * Help link for gdpr user deletion
   * @type {String}
   */
  userDeletionUrl = `${getDomainUrl()}/help/learning/answer/127399`;

  /**
   * A list of fetched prevous GDPR delete jobs
   * @type {object[]}
   */
  @tracked
  fetchedGdprJobList = [];

  constructor() {
    super(...arguments);

    this.fetchGdprJobList.perform();
  }

  /**
   * Populate ModelsTable with GDPR jobs
   */
  @task
  fetchGdprJobList = function* () {
    try {
      const query = {
        q: APPLICATION_INSTANCE,
        bulkActionType: BULK_ACTION_TYPE,
        applicationInstance: this.configuration.enterpriseApplicationInstance
      };
      const options = {
        params: query,
        reload: true,
        adapterOptions: {
          degradations: [PEM_TRACKING_METADATA.USER_DELETION_LOADS],
          degradedEntityIDsToRemove: []
        }
      };

      const collectionResponse = yield this.store.queryURL('bulkActionTasks', {
        ...options
      });
      const data = collectionResponse.get('elements');

      if (!this.isDestroying && !this.isDestroyed) {
        this.fetchedGdprJobList = data;
      }
    } catch (e) {
      this.jet.error(e, 'gdpr-delete-table-load', false);
      this._showErrorMessage();
    }
  };

  /**
   * Download the CSV file from ModelsTable
   * @param {String} encryptedMediaUrn
   */
  @action
  downloadCsvFile(encryptedMediaUrn) {
    const downloadUrl = `/learning-enterprise-api/file/download?token=${encryptedMediaUrn}&src=eis`;
    const promise = this.fileService.fetchFileContents(downloadUrl);

    this.pemTracking.trackFeatureDegradations(
      downloadUrl,
      [],
      [PEM_TRACKING_METADATA.USER_DELETION_CSV_DOWNLOADED],
      promise
    );

    promise
      .then(([, , jQXhr]) => {
        if (jQXhr.responseText) {
          if (this.isDestroying || this.isDestroyed) {
            return;
          }
          this.fileService.downloadFileContents(
            jQXhr.responseText,
            'gdpr_delete_result.csv'
          );
        }
      })
      .catch(e => {
        e = e[0]; // fetchFileContents rejects in Array form
        const jetMessage = `GDPR CSV download failed - ${encryptedMediaUrn} | ${e?.status} ${e?.statusText}`;
        this.jet.error(jetMessage, 'gdpr-csv-download', false);
        this._showErrorMessage('failed_gdpr_delete_csv_download');
      });
  }

  /**
   * Display error message
   * @param {String} i18nKey
   */
  _showErrorMessage(i18nKey = 'generic_error_message') {
    const errorMessage = this.i18n.lookupTranslation(TEMPLATE, i18nKey)();
    this.toastService.add({
      type: TOAST_TYPES.ERROR,
      message: errorMessage
    });
  }
}