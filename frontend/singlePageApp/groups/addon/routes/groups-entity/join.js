/**
## Context
Firstline members struggle with a lack of voice in the workplace. They want a supportive community to share experiences and interact with others in their industry. The Break Room: Retail & Customer Service (TBR) group is a curated private group led by our community builder and one of the most engaged groups at LinkedIn.

## Summary
Segments Firstline team is planning to leverage multiple entry points (e.g., Launchpad, Lapsed User Onboarding, etc.) to invite these Firstline members to join TBR group. In order to lower the barrier, we would like to have a single URL (a.k.a Deep-link ) that members can click to send the group join request (and automatically be approved if the group has direct-join feature enabled and land on the group page.

Mini-RFC | Figma

Screen Shot 2021-06-10 at 10 36 27 PM

## Notes
There was a bug where users could not close group-type-info-modal, so fix that.
Update TODO item in onboarding pillar that I left in this PR
Testing Done
Deep link final demo.mp4.zip
Acceptance test is added
SEE DEMO video
 */

import Route from '@ember/routing/route';
import { get, set } from '@ember/object';
import {
  canViewGroupFeed,
  createMembershipTypeMap,
} from 'groups/utils/get-group-role';
import { inject as service } from '@ember/service';
import isNetworkError from 'global-utils/utils/is-network-error';

const TOAST_TEMPLATE = 'groups@constants/default-toasts';

export default class JoinRoute extends Route {
  @service('groups@groups-data')
  groupsData;

  @service('authentication@authenticated-user')
  authenticatedUser;

  @service('persistent-toast-manager@persistent-toast-manager')
  persistentToastManager;

  @service('jet')
  jet;

  @service('lix')
  lix;

  pageKey = 'flagship3_groups_auto_join';

  async redirect(model) {
    const status = get(model, 'groupEntity.viewerGroupMembership.status');
    const groupId = this.paramsFor('groups-entity')['groups-entity_id'];
    const memberId = get(this, 'authenticatedUser.miniProfile.id');
    let groupMembership;
    if (
      this.lix.getTreatmentIsEnabled(
        'voyager.web.firstline-groups-auto-join-deep-link'
      ) &&
      !canViewGroupFeed(createMembershipTypeMap(status))
    ) {
      try {
        groupMembership = await this.groupsData.sendGroupRequest(
          groupId,
          memberId
        );
        const message = this.i18n.lookupTranslation(
          TOAST_TEMPLATE,
          'successfully_joined_the_group'
        )();
        this.persistentToastManager.success({ message });
      } catch (e) {
        if (isNetworkError(e)) {
          this.jet.logError(
            new Error('Error on API call to send group join request'),
            'groups-auto-join-failure',
            false
          );
        }
        const message = this.i18n.lookupTranslation(
          TOAST_TEMPLATE,
          'error_generic_network'
        )();
        this.persistentToastManager.error({ message });
        throw e;
      } finally {
        set(model, 'groupEntity.viewerGroupMembership', groupMembership);
        this.replaceWith('groups-entity.index', model);
      }
    } else {
      this.replaceWith('groups-entity.index');
    }
  }
}