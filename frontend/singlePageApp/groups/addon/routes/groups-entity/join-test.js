import { currentRouteName, visit } from '@ember/test-helpers';
import { setupTracking } from 'ember-cli-pemberly-tracking/test-support';
import { setupApplicationTest } from 'ember-qunit';
import { GroupMembershipInfo } from 'groups-shared/utils/constants';
import { module, test } from 'qunit';
import GroupsTestManager from 'groups-test-helpers/test-support/groups-test-manager';
import { NoContentResponseMocker } from 'extended/tests/helpers/mock-utils';
import PretenderManager from 'extended/tests/helpers/pretender/pretender-manager';
import { setupLixTesting } from 'ember-cli-pemberly-lix/test-support';
import sinon from 'sinon';

module('Acceptance | groups/groups-entity/join', function (hooks) {
  setupApplicationTest(hooks);
  setupTracking(hooks);
  setupLixTesting(hooks);

  hooks.beforeEach(function () {
    this.groupsTestManager = new GroupsTestManager();
    this.groupsTestManager
      .mockRequestsForGroupsEntityPage()
      .setupGroup({
        groupName: 'name 1',
        groupDescription: 'description 1',
        groupRules: 'rules 1',
        groupLocation: 'location 1',
        groupIndustries: ['industry 1'],
        viewerGroupMembership: GroupMembershipInfo.NON_MEMBER,
      })
      .mockGetRequestForGroup()
      .mockRequestsForGroupImage({
        urn: 'urn:li:digitalmediaAsset:123',
      })
      .mockRequestsForLocationZeroTypeahead()
      .setUpEmptyLegoGroupRequest();
    this.groupId = this.groupsTestManager.getGroupId();
    this.groupUrn = this.groupsTestManager.getGroupUrn();

    PretenderManager.setup();
    PretenderManager.setResponseMock(
      'post',
      `/voyager/api/groups/groups/urn%3Ali%3Agroup%3A${this.groupId}`,
      NoContentResponseMocker.create()
    );

    // Spy on toast service call to show success and error messages
    this.successToastSpy = sinon.spy(
      this.owner.lookup(
        'service:persistent-toast-manager@persistent-toast-manager'
      ),
      'success'
    );
  });

  hooks.afterEach(function () {
    this.groupsTestManager = null;
  });

  test('fires a join request when the lix is enabled', async function (assert) {
    this.setupLixes({
      'voyager.web.firstline-groups-auto-join-deep-link': 'enabled',
    });

    assert.expect(4);

    await visit(`groups/${this.groupId}/join`);

    this.trackingSession
      .assertPageViewEvent('flagship3_groups_auto_join')
      .occurs(1);

    assert.equal(
      currentRouteName(),
      'groups.groups-entity.index.feed.all',
      'redirected to group feed'
    );

    const joinRequest = PretenderManager.getMatchedRequests(
      `/voyager/api/groups/groups/${encodeURIComponent(this.groupUrn)}/members`,
      {
        action: 'updateMembershipStatus',
      },
      'POST'
    );

    assert.ok(joinRequest.length, 'join request was sent');
    assert.ok(this.successToastSpy.calledOnce, 'Success toast should be shown');
  });

  test('should not fire a join request when the lix is disabled', async function (assert) {
    this.setupLixes({
      'voyager.web.firstline-groups-auto-join-deep-link': 'control',
    });

    assert.expect(3);

    await visit(`groups/${this.groupId}/join`);

    assert.equal(
      currentRouteName(),
      'groups.groups-entity.index.feed.all',
      'redirected to group feed'
    );

    const joinRequest = PretenderManager.getMatchedRequests(
      `/voyager/api/groups/groups/${encodeURIComponent(this.groupUrn)}/members`,
      {
        action: 'updateMembershipStatus',
      },
      'POST'
    );

    assert.notOk(joinRequest.length, 'join request was not sent');
    assert.notOk(
      this.successToastSpy.calledOnce,
      'Success toast should not be shown'
    );
  });
});