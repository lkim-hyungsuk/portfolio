import RSVP from 'rsvp';
import Component from '@ember/component';
import classic from 'ember-classic-decorator';
import config from 'learning-enterprise-web/config/environment';
import ShellConfig from 'learning-enterprise-web/utils/shell-config';
import UrnGenerator from 'learning-enterprise-web/utils/eis/urn-generator';
import showConfirmation from 'learning-enterprise-web/utils/show-confirmation';
import { A } from '@ember/array';
import { capitalize } from '@ember/string';
import { computed, action } from '@ember/object';
import { isEmpty, tryInvoke } from '@ember/utils';
import { inject as service } from '@ember/service';
import { task } from 'ember-concurrency-decorators';
import { TOAST_TYPES } from 'artdeco-toast/utils/constants';
import { empty, filterBy, filter, gt, lt } from '@ember/object/computed';
import { LEGO_ENUM_CONSTANTS } from 'learning-enterprise-web/utils/lego/constants';

const { maxEmailEntries, licenseLimitWarn } = ShellConfig;
const TEMPLATE = 'components/eis/people/users/add-users-by-email';
const CURATOR_TEMPLATE = 'components/c-pages/people/curators/curators-main';
const ADD_USERS_BY_EMAIL_ERROR = 'AddUsersByEmailError';
const ADD_USERS_BY_EMAIL_WITH_CUSTOM_EMAIL_ERROR =
  'AddUsersByEmailWithCustomTemplateError';
const GROUP_TYPEAHEAD =
  'com.linkedin.enterprise.api.search.TypeaheadEnterpriseGroup';
const FIND_GROUP = 'enterprise/api/group/enterprise-group';
const SSO_NOT_REQUIRED = 'ssoNotRequired';
const LICENSES_KEYWORD = 'licenses';
const I18N_LICENSE_KEY = 'i18n/eis/license';
const I18N_USERS_KEY = 'i18n/eis/users';
const I18N_GROUPS_KEY = 'i18n/eis/groups';
const IS_TESTING = config.environment === 'test';

/**
 * Allows consumers to add users via emails and optionally assign them a license.
 *
 * Using this modal, an admin can:
 * - Enter up to `maxEmailEntries` email addresses that may or may not map to an existing user
 * - Create users out of email address that do not match with an existing user
 * - Assign an optional license to all new users
 * - Revoke the license of existing users via the "No license" option
 * - Change the license of existing users by choosing a different license
 */
@classic
export default class AddUsersByEmailComponent extends Component {
  'data-test-add-users-by-email' = true;

  @service('eis/enterprise-user')
  enterpriseUser;

  @service()
  i18n;

  @service()
  jet;

  @service()
  legoTracking;

  @service('eis/license/license-allocation-service')
  licenseService;

  @service('eis/users')
  usersService;

  @service()
  store;

  @service('artdeco-toast')
  toast;

  @service('enterprise-lix')
  enterpriseLix;

  @service('account-authentication')
  accountAuthenticationService;

  /**
   * The maximum amount of users that can be created.
   * @type {number}
   */
  limit = maxEmailEntries;

  /**
   * The array of users to add. These are populated by the `setUsers` action,
   * which is called by the child `people/users/add-users-input` component.
   * @type {?object[]}
   */
  users = A();

  /**
   * When this component is used for Curator flow, this will be populated by child component <Shared::CuratorRoleCheckbox>
   * @type {?object}
   */
  curatorRoleAssignmentHash = null;

  /**
   * Whether or not we are waiting to hear back from the API
   * after form submission.
   * @type {boolean}
   */
  isLoading = false;

  /**
   * Whether or not we should highlight to the admin that he/she is trying to
   * add more users than we allow.
   * @type {boolean}
   */
  shouldHighlightLimit = false;

  /**
   * Whether or not `component:AddUsersInput` has invalid users
   * that must be removed from the list before saving
   * @type {boolean}
   */
  hasInvalidUsers = false;

  /**
   * Whether the admin has decided to send custom email template for invitation
   * Toggled in child container (SEE: component:email-template-search-typeahead)
   * @type {boolean}
   */
  isCustomTemplateSelected = false;

  /**
   * Whether this shared component is used for Curator tab
   * NOTE: Passed from parent container
   * @type {?boolean}
   */
  addUsersFromCuratorsTab = false;

  /**
   * The type of email template that new learners will receive
   * @type {string}
   */
  activateEmailType = 'ACTIVATION';

  /**
   * The currently selected artdeco tab
   * @type {string}
   */
  selection = null;

  /**
   * @type {EmberObject} selectedSsoType
   */
  selectedSsoType = null;

  /**
   * @type {EmberObject} defaultAuthMode
   */
  defaultAuthMode = null;

  /**
   * The optional (selected or `No License`) license to assign to the users. The object is set by the
   * `onUpdate` action, which is called by the child `license/license-assignment` component.
   * @type {?object}
   */
  license = null;

  /**
   * Set when admin decides to use custom template email template and selects one of typeahead results
   * @type {?string}
   */
  selectedCustomTemplateUrn = null;

  @lt('license.availableSeats', licenseLimitWarn)
  limitWarn;

  @lt('license.availableSeats', 1)
  notEnoughLicenses;

  /**
   * Whether or not the admin has entered more users than allowed.
   * @type {boolean}
   */
  @(gt('users.length', 'limit').readOnly())
  hasExceededLimit;

  /**
   * Whether or not the admin has entered any users. The form cannot submit if
   * this is `true`.
   * @type {boolean}
   */
  @empty('users')
  hasNoUsers;

  /**
   * The array of new users.
   * @type {?object[]}
   */
  @filterBy('users', 'newUser', true)
  newUsers;

  /**
   * The array of valid users.
   * @type {?object[]}
   */
  @filterBy('users', 'valid', true)
  validUsers;

  /**
   * The array of users with at least one license.
   * @type {?object[]}
   */
  @filter('users', user => !isEmpty(user.licenses))
  usersWithLicenses;

  /**
   * The array of users that are titled `No licenses` in `component:add-users-input`
   * @type {?object[]}
   */
  @filter('users', user => isEmpty(user.licenses))
  usersWithoutLicenses;

  /**
   * The array of users that already have the currently selected license.
   * @type {?object[]}
   */
  @filter('usersWithLicenses', user => !user.hasOwnLicenses)
  usersWithSelectedLicense;

  /**
   * Whether the admin can add users with the selected curator roles
   * NOTE: At least one role should be selected to become a `Curator`
   * @type {?boolean}
   */
  @computed('curatorRoleAssignmentHash.@each.assigned')
  get isAnyCuratorRoleSelected() {
    const curatorRoleAssignmentHash = this.curatorRoleAssignmentHash;
    if (curatorRoleAssignmentHash) {
      return Object.keys(curatorRoleAssignmentHash).some(
        role => curatorRoleAssignmentHash[role].assigned
      );
    }
    return false;
  }

  /**
   * The name of the current application, shown in a note if the admin tries
   * to assign a license to a user that already has another license in the
   * current application instance.
   * @type {string}
   */
  @computed('enterpriseUser.applicationName')
  get applicationName() {
    const appName = this.enterpriseUser.applicationName ?? '';
    return capitalize(appName);
  }

  /**
   * The list of existing profiles to work with
   * NOTE: This includes `No License` users & `New users`
   * @type {?object[]}
   */
  @computed('validUsers')
  get existingProfileIdentities() {
    return this.validUsers
      .mapBy('profileIdentity')
      .compact()
      .toArray();
  }

  /**
   * @type {string}
   */
  @computed('i18n', 'selectedLicenseType')
  get header() {
    const i18nKey = this.selectedLicenseType
      ? 'assign_licenses'
      : 'add_users_by_email';
    return this.i18n.lookupTranslation(TEMPLATE, i18nKey)();
  }

  /**
   * @type {string}
   */
  @computed('i18n', 'selectedLicenseType', 'limit')
  get notice() {
    const useCaseInfo = this.addUsersFromCuratorsTab
      ? 'use_case_curator_info'
      : 'use_case_info';
    const i18nKey = this.selectedLicenseType
      ? 'to_add_more_licenses'
      : useCaseInfo;
    return this.i18n.lookupTranslation(
      TEMPLATE,
      i18nKey
    )([
      {
        limit: this.limit
      }
    ]);
  }

  /**
   * Whether or not we should disable main CTA (Save) button
   * @type {boolean}
   */
  @computed(
    'isLoading',
    'hasNoUsers',
    'hasExceededLimit',
    'hasInvalidUsers',
    'notEnoughLicenses',
    'isCustomTemplateSelected',
    'selectedCustomTemplateUrn',
    'isGroupScopedSubadmin',
    'isGroupSelected',
    'isAnyCuratorRoleSelected',
    'addUsersFromCuratorsTab'
  )
  get isInvalid() {
    return (
      this.isLoading ||
      this.hasNoUsers ||
      this.hasExceededLimit ||
      this.hasInvalidUsers ||
      this.notEnoughLicenses ||
      (this.isGroupScopedSubadmin && !this.isGroupSelected) ||
      (this.isCustomTemplateSelected &&
        isEmpty(this.selectedCustomTemplateUrn)) || // if custom template is selected, admins must select one of typeahead results to enable main CTA
      (this.addUsersFromCuratorsTab && !this.isAnyCuratorRoleSelected)
    );
  }

  /**
   * An object that houses all the different licenses that users in this modal
   * have, group by budget group. During form submission, this object will be
   * looked at to see if any revoke calls need to be made.
   * @type {?object[]}
   */
  @computed('usersWithLicenses')
  get revocableLicenses() {
    const usersWithLicenses = this.usersWithLicenses;

    return usersWithLicenses.reduce((revokes, user) => {
      const { licenses, profileIdentity } = user;

      licenses.forEach(license => {
        const { budgetGroup, licenseType } = license
          .get('key')
          .getProperties('budgetGroup', 'licenseType');

        revokes[budgetGroup] = revokes[budgetGroup] || {};
        revokes[budgetGroup][licenseType] =
          revokes[budgetGroup][licenseType] || [];
        revokes[budgetGroup][licenseType].push(profileIdentity);
      });

      return revokes;
    }, {});
  }

  /**
   * Assign the currently selected template to the provided new and existing users
   *
   * @param {string[]} [newUsers=[]] The encoded profile ids of new users
   */
  @task
  assignTemplateUrn = function*(newUsers = []) {
    const profiles = this.existingProfileIdentities.concat(newUsers);

    if (!profiles.length) {
      return;
    }

    try {
      yield this.usersService.assignCustomTemplate(
        profiles,
        this.activateEmailType,
        this.selectedCustomTemplateUrn
      );
      this.showToasts(
        I18N_USERS_KEY,
        'template_assigned_success',
        TOAST_TYPES.SUCCESS,
        {
          numUsers: profiles.length
        }
      );

      // TODO | @lkim | Fix this: We are passing newUsers only as `assignLicenses` inside manageLicenses counts existingProfileIdentities already
      this.manageLicenses(newUsers);
    } catch (e) {
      this.jet.logError(e, ADD_USERS_BY_EMAIL_WITH_CUSTOM_EMAIL_ERROR, false);
      this.showToasts(
        I18N_USERS_KEY,
        'template_assigned_error',
        TOAST_TYPES.ERROR
      );
      if (!this.isDestroyed && !this.isDestroying) {
        this.updateParentComponent();
        this.resetForm();
      }
    }
  };

  /**
   * Assigns the currently selected license to the provided users
   *
   * @param {string[]} [newUsers=[]] The encoded profile ids of the users
   * @return {Promise} The result of the call.
   */
  assignLicenses(newUsers = []) {
    const license = this.license;
    const profiles = this.existingProfileIdentities.concat(newUsers);

    if (profiles.length && license) {
      const { budgetGroupUrn, licenseTypeUrn } = license;

      return this.licenseService
        .assign(budgetGroupUrn, licenseTypeUrn, profiles)
        .then(() => profiles.length);
    }

    return RSVP.resolve();
  }

  /**
   * Assign the selected group to list of users, then notify group page
   * to refresh
   */
  assignGroup(groupData) {
    if (!groupData) {
      return;
    }

    const group = groupData;
    group.set('profiles', this.profileIds);

    group
      .save({
        adapterOptions: {
          action: 'addUsers',
          memberType: 'profiles'
        }
      })
      .then(() => {
        if (!this.addUsersFromCuratorsTab) {
          this.showToasts(
            I18N_GROUPS_KEY,
            this.isGroupScopedSubadmin
              ? 'group_scoped_subadmin_add_users_to_group_success'
              : 'add_users_to_group_success',
            TOAST_TYPES.SUCCESS,
            {
              count: this.profileIds.length
            }
          );
        }
      })
      .catch(() => {
        this.jet.logError(
          'error assigning group',
          ADD_USERS_BY_EMAIL_ERROR,
          false
        );
        this.showToasts(
          I18N_GROUPS_KEY,
          'add_users_to_group_error',
          TOAST_TYPES.ERROR,
          {
            count: this.profileIds.length
          }
        );
      });
  }

  /**
   * If there are new users to be created, create them all at once.
   * When setting ssoTypeUrn, there are three possible outcomes:
   * 1) User selects 'SSO Not Required' -- in this case, there will be a selectedSsoType, but no associated urn -- we need ssoTypeUrn to be null here
   * 2) User selects any other authMode -- we need the urn from selectedSsoType
   * 3) User leaves the default selection as is (does not open the dropdown and make a selection) -- we need the defaultAuthMode urn here
   * To accomodate all three use cases, we check for existance of 'selectedSsoType' before returning, giving the opportunity to set null in cases of 'SSO Not Required'.
   * @return {Promise} The result of the creation call.
   */
  createNewUsers() {
    const usersService = this.usersService;
    const emails = this.newUsers.mapBy('emailAddress');

    let ssoTypeUrn = this.selectedSsoType?.urn || this.defaultAuthMode?.urn;
    if (ssoTypeUrn === SSO_NOT_REQUIRED || this.addUsersFromCuratorsTab) {
      ssoTypeUrn = undefined;
    }

    if (emails.length) {
      return usersService
        .createByEmails(emails, ssoTypeUrn)
        .then(({ newUsers }) => {
          const emails = Object.keys(newUsers);
          const profiles = [];
          const failures = [];

          for (const email of emails) {
            const profile = newUsers[email];

            if (profile) {
              profiles.push(profile);
            } else {
              failures.push(email);
            }
          }

          return { profiles, failures, newUsers };
        });
    }

    return RSVP.resolve({});
  }

  getEnterpriseGroup() {
    const groupUrn = this.group.hitInfo[GROUP_TYPEAHEAD].groupUrn;
    return this.store.findRecord(
      FIND_GROUP,
      UrnGenerator.generateGroupIdFromUrn(groupUrn),
      { reload: true }
    );
  }

  /**
   * Assign/Revoke the currently selected license to the provided list of users
   *
   * @param {string[]} profiles The encoded profile ids of the users to assign/revoke licenses.
   */
  manageLicenses(profiles) {
    RSVP.allSettled([
      this.assignLicenses(profiles)
        .then(numLicensesAssigned => {
          if (!this.addUsersFromCuratorsTab && numLicensesAssigned) {
            this.showToasts(
              I18N_LICENSE_KEY,
              'licenses_assigned',
              TOAST_TYPES.SUCCESS,
              {
                count: numLicensesAssigned
              }
            );
          }
        })
        .catch(() => {
          this.jet.logError(
            'error assigning licenses',
            ADD_USERS_BY_EMAIL_ERROR,
            false
          );
          this.showToasts(
            I18N_LICENSE_KEY,
            'licenses_assigned_error',
            TOAST_TYPES.ERROR
          );
        }),
      this.revokeExistingLicenses()
        .then(numberOfRevokes => {
          if (numberOfRevokes) {
            this.showToasts(
              I18N_LICENSE_KEY,
              'licenses_revoked',
              TOAST_TYPES.SUCCESS,
              {
                count: numberOfRevokes
              }
            );
          }
        })
        .catch(() => {
          this.jet.logError(
            'error revoking licenses',
            ADD_USERS_BY_EMAIL_ERROR,
            false
          );
          this.showToasts(
            I18N_LICENSE_KEY,
            'licenses_revoked_error',
            TOAST_TYPES.ERROR
          );
        })
    ]).finally(() => {
      if (!this.isDestroyed && !this.isDestroying) {
        this.updateParentComponent();
        this.resetForm();
      }
      tryInvoke(this, 'onModalActionComplete');
    });
  }

  /**
   * Revokes any existing licenses from all users that own a license that is
   * not the currently selected license.
   *
   * @return {Promise} The result of the call.
   */
  revokeExistingLicenses() {
    const { license, licenseService, revocableLicenses } = this.getProperties(
      'license',
      'licenseService',
      'revocableLicenses'
    );

    if (license) {
      return RSVP.resolve();
    }

    const revokeCalls = [];
    let numberOfRevokes = 0;

    for (const [budgetGroup, licenses] of Object.entries(revocableLicenses)) {
      const sameBudgetGroup = license && license.budgetGroupUrn === budgetGroup;

      for (const [licenseType, profiles] of Object.entries(licenses)) {
        if (sameBudgetGroup && license.licenseTypeUrn === licenseType) {
          continue;
        }

        const revokeCall = licenseService.revoke(
          budgetGroup,
          licenseType,
          profiles
        );

        revokeCalls.push(revokeCall);
        numberOfRevokes += profiles.length;
      }
    }

    if (revokeCalls.length) {
      return RSVP.allSettled(revokeCalls).then(() => {
        if (!license) {
          return numberOfRevokes;
        }
      });
    }

    return RSVP.resolve();
  }

  /**
   * Resets the form and shows the modal.
   *
   * This method gets called when the "Add users by email" option is chosen.
   */
  resetForm() {
    this.setProperties({
      shouldHighlightLimit: false,
      license: null,
      isLoading: false,
      users: A(),
      group: this.isGroupScopedSubadmin ? null : this.group
    });
  }

  /**
   * Show toasts generated after API calls
   *
   * @param {string} template template to fetch the string from
   * @param {string} key i18n t-def key
   * @param {string} type type of toast message
   * @param {object} data data to pass to the i18n key if any
   */
  showToasts(template, key, type, data) {
    this.toast.add({
      type,
      message: this.i18n.lookupTranslation(template, key)([data || {}])
    });
  }

  /**
   * Send action to parent component to update data on pages as needed
   */
  updateParentComponent() {
    if (!this.isGroupScopedSubadmin) {
      tryInvoke(this, 'onUsersChange', [this.profileIds]);
    }
    tryInvoke(this, 'onDismiss');
  }

  /**
   * fire lego primary action if a launchpad widget token exists
   */
  @action
  fireLegoPrimaryAction() {
    if (this.launchpadWidgetToken) {
      this.legoTracking.sendLegoAction(
        this.launchpadWidgetToken,
        LEGO_ENUM_CONSTANTS.LEGO_ACTION_PRIMARY,
        1
      );
    }
  }

  /**
   * Handles what happens when the user clicks out of the modal, clicks the
   * "X" at the top right of the modal. We do not allow the modal to be dismissed when form submission is active.
   * @param {boolean} shouldAlert Whether we should launch browser alert or not
   */
  @action
  tryDismissModal(shouldAlert = true) {
    if (!this.isLoading) {
      if (
        shouldAlert &&
        this.dismissText &&
        !(IS_TESTING || showConfirmation(this.dismissText))
      ) {
        return;
      }

      tryInvoke(this, 'onDismiss');
    }
  }

  /**
   * function for handling groups selection
   * @param {objects} group
   */
  @action
  onHandleSelectedGroup(group) {
    if (!group) {
      return;
    }

    group.groupName = group.hitInfo[GROUP_TYPEAHEAD].groupName;
    this.setProperties({
      group,
      isGroupSelected: true
    });
  }

  /**
   * Deselctes a group.
   */
  @action
  onRemoveGroup() {
    this.setProperties({
      group: null,
      isGroupSelected: false
    });
  }

  /**
   * Called by child `add-users-input` component when new users are added,
   * removed, or modified.
   *
   * @param {object[]} users The array of users.
   */
  @action
  setUsers(users) {
    if (!users) {
      return;
    }

    this.set('shouldHighlightLimit', false);
    this.users.setObjects(users);
  }

  @action
  setAuthType(type, defaultType) {
    this.setProperties({
      selectedSsoType: type,
      defaultAuthMode: defaultType
    });
  }

  /**
   * Called when the users clicks the "Confirm" button to submit the form.
   *
   * First, new users (if there are any to make). If that was successful,
   * make in parallel calls to license assignment and license revoke if
   * needed.
   */
  @action
  addUsers() {
    if (this.isLoading) {
      return;
    }

    this.set('isLoading', true);

    // 1. create new users
    this.createNewUsers()
      .then(({ profiles = [], failures = [], newUsers = {} }) => {
        const numberOfNewProfiles = profiles.length;
        const numberOfErrors = failures.length;

        let targetTemplate = I18N_USERS_KEY;
        let targetKey = 'users_added_to_ac';
        const isCustomTemplateSelected = this.isCustomTemplateSelected;

        if (this.addUsersFromCuratorsTab) {
          targetTemplate = CURATOR_TEMPLATE;
          targetKey = isCustomTemplateSelected
            ? 'curators_added_with_custom_email_successful'
            : 'curators_added_successful';
        }

        if (numberOfNewProfiles) {
          this.showToasts(targetTemplate, targetKey, TOAST_TYPES.SUCCESS, {
            count: numberOfNewProfiles
          });
        }

        if (numberOfErrors) {
          this.jet.logError(
            'error adding some new users',
            ADD_USERS_BY_EMAIL_ERROR,
            false
          );
          this.showToasts(
            I18N_USERS_KEY,
            'users_added_failure',
            TOAST_TYPES.ERROR,
            {
              count: numberOfErrors
            }
          );
        }

        const validUsers = this.validUsers;
        const profileIds = [];

        validUsers.forEach(user => {
          const { emailAddress, profileIdentity } = user;
          const newUserProfileIdentity = newUsers[emailAddress];

          profileIds.push(profileIdentity ?? newUserProfileIdentity);
        });

        if (!this.isDestroyed && !this.isDestroying) {
          this.set('profileIds', profileIds);
        }

        // 2. add new users to group if any
        // first turn group hit info into enterprise group if needed
        if (
          !this.addUsersFromCuratorsTab &&
          this.isGroupScopedSubadmin &&
          this.isGroupSelected
        ) {
          this.getEnterpriseGroup()
            .then(group => {
              this.assignGroup(group);
            })
            .catch(() => {
              this.jet.logError(
                'error getting group data',
                ADD_USERS_BY_EMAIL_ERROR,
                false
              );
              this.showToasts(
                I18N_USERS_KEY,
                'fetch_group_failure',
                TOAST_TYPES.ERROR
              );
            });
        } else if (this.group) {
          this.assignGroup(this.group);
        }

        if (!this.addUsersFromCuratorsTab && this.selectedCustomTemplateUrn) {
          // 3. (optional) assign custom template to users then assign licenses
          this.assignTemplateUrn.perform(profiles);
        } else {
          // 4. simply assign licenses
          this.manageLicenses(profiles);
        }
      })
      .catch(() => {
        this.jet.logError(
          'error adding all new users',
          ADD_USERS_BY_EMAIL_ERROR,
          false
        );
        this.showToasts(
          I18N_USERS_KEY,
          'users_added_failure',
          TOAST_TYPES.ERROR,
          {
            count: this.newUsers.length
          }
        );
      })
      .finally(() => {
        this.licenseService.reloadLicenseAllocationData();
        if (!this.isDestroyed && !this.isDestroying) {
          this.set('isLoading', false);
        }
      });
  }

  /**
   * Assign licenses and create `BATCH CREATE` for "New Users" & `BATCH PARTIAL UPDATE` for "Existing Users" who have been a Learner / Sub-admin / Full-admin before becoming a curator
   */
  @action
  batchAddUsers() {
    // attach query data to pass onto `onSave` callback from the parent
    const $set = {
      roleAssignments: this.curatorRoleAssignmentHash
    };
    const $delete = [];

    // $set `authenticationMode` to API only if authentication mode is selected (eg. LTI, SAML, ...)
    // otherwise, delete it so that users can login without SSO - `allowMemberAuthOnly: true`
    const authenticationModeUrn = this.selectedSsoType?.urn;
    if (!authenticationModeUrn || authenticationModeUrn === SSO_NOT_REQUIRED) {
      $set.authenticationMode = {
        allowMemberAuthOnly: true
      };
    } else {
      $set.authenticationMode = {
        authenticationModeUrn,
        allowMemberAuthOnly: false
      };
    }
    if (!this.license) {
      $delete.push(LICENSES_KEYWORD);
    }

    // attach `activationEmailTemplate` to API only if data exists
    const emailTemplate = this.selectedCustomTemplateUrn;
    if (emailTemplate) {
      $set.activationEmailTemplate = { emailTemplate };
    }

    // we don't want to miss out `No License` cases
    const existingUsers = this.existingProfileIdentities;
    const newUsers = this.newUsers;

    // Assign the license only
    if (this.license) {
      this.addUsers();
    }

    // Assign other values (e.g. Authentication mode & Email Template & + Role Assignment for Curators)
    const patch = { $set, $delete };
    tryInvoke(this, 'onSave', [patch, newUsers, existingUsers]);
  }
}
