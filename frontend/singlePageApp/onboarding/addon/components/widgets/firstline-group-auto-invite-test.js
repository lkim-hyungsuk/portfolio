import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import {
  PAGE_KEYS,
  USER_LIFECYCLE_ENUM,
  USER_ACTION_ENUM,
} from 'onboarding/utils/constants';
import { addQueryParams } from 'global-utils/utils/url';
import { mocker } from 'extended/tests/helpers/restli-mocker';
import { setupLixTesting } from 'ember-cli-pemberly-lix/test-support';
import { setupTracking } from 'ember-cli-pemberly-tracking/test-support';
import { START_ROUTE, FEED_ROUTE } from 'onboarding/test-support/onboarding';
import {
  find,
  findAll,
  currentRouteName,
  visit,
  click,
} from '@ember/test-helpers';
import { setupClientSensor } from 'client-sensor-web/test-support/client-sensor-utils';
import a11yAuditIf from 'ember-a11y-testing/test-support/audit-if';
import OnboardingRecipes from 'deco-recipes/pillar-recipes/onboarding/recipes';
import PretenderManager from 'extended/tests/helpers/pretender/pretender-manager';
import takeScreenshot from '@linkedin/ember-cli-pemberly-jstf-addon/test-support/take-screenshot';

async function runA11yAudit() {
  await a11yAuditIf({
    rules: {
      'aria-valid-attr-value': { enabled: true },
      'frame-title-unique': { enabled: true },
      'duplicate-id': { enabled: false }, // This fails due to artdeco-modal-outlet id
      'landmark-contentinfo-is-top-level': { enabled: true },
      'landmark-unique': { enabled: true },
      'link-name': { enabled: true },
      'valid-lang': { enabled: true },
      'heading-order': { enabled: true },
    },
  });
}

const STEP_TYPE = 'FIRSTLINE_GROUP_AUTO_INVITE';

module('Acceptance | onboarding/widgets/firstline-group-auto-invite', function (
  hooks
) {
  setupApplicationTest(hooks);
  setupTracking(hooks);
  setupClientSensor(hooks);
  setupLixTesting(hooks);

  hooks.beforeEach(function () {
    this.setupLixes({
      'voyager.web.onboarding-use-dash': 'enabled',
      'voyager.web.firstline-group-auto-invite-hide-dismiss-btn': 'control',
    });

    const onboardingStepCollectionMock = mocker.mockPDSC(
      'com.linkedin.voyager.dash.deco.onboarding.OnboardingStepCollection',
      {
        elements: [
          {
            stepType: STEP_TYPE,
            finalStep: true,
          },
        ],
        metadata: {
          userLifeCycleStatus: USER_LIFECYCLE_ENUM.EXISTING,
        },
      }
    );

    PretenderManager.setup();
    PretenderManager.setResponseMock(
      'get',
      addQueryParams('voyager/api/voyagerOnboardingDashOnboardingStep', {
        decorationId:
          OnboardingRecipes[
            'com.linkedin.voyager.dash.deco.onboarding.OnboardingStepCollection'
          ],
        q: 'memberAndCurrentStepType',
        lookahead: true,
        onboardingContext: {},
        currentStepType: '',
      }),
      onboardingStepCollectionMock
    );
  });

  test('Default layout state test [a11y audit]', async function (assert) {
    assert.expect(5);

    await visit(START_ROUTE);

    await runA11yAudit();

    assert.ok(true, 'No accessibility violations found for the default state');

    await takeScreenshot('onboarding.firstline-group-auto-invite');

    assert.equal(
      findAll('[data-test-action-bar-item="SKIP"]').length,
      1,
      'should have skip button'
    );

    assert.equal(
      findAll('[data-test-action-bar-item="DONE"]').length,
      1,
      'should have done button'
    );

    assert.dom('[data-test-onboarding-widget-header]').hasAnyText();

    assert.ok(
      find('[data-test-onboarding-widget-subheader]').textContent.length,
      'should have header subtitle'
    );
  });

  test('can be visited with IMPRESSION event fired', async function (assert) {
    assert.expect(5);

    const expectedRoute = 'onboarding.start.firstline-group-auto-invite';

    await visit(START_ROUTE);

    const filteredImpressionRequest = PretenderManager.getHandledRequests().filter(
      (request) =>
        request.method === 'POST' &&
        request.path ===
          '/voyager/api/voyagerOnboardingDashOnboardingStep?action=markStepWithUserAction' &&
        JSON.parse(request.request.requestBody).userAction ===
          USER_ACTION_ENUM.IMPRESSION
    );

    assert.equal(
      filteredImpressionRequest.length,
      1,
      `${USER_ACTION_ENUM.IMPRESSION} event is fired once`
    );
    assert.equal(
      currentRouteName(),
      expectedRoute,
      `the current route should be ${expectedRoute}`
    );
    this.trackingSession.assertPageViewEvent(
      `${PAGE_KEYS.ONBOARDING_PREFIX}${PAGE_KEYS.FIRSTLINE_GROUP_AUTO_INVITE_SUFFIX}`
    );
    this.clientSensorSession
      .assertClientSensorGroup('onboarding')
      .hasGroupMetric('firstline-group-auto-invite-impression', 1);
  });

  test('skip button causes a transition to Feed with SKIP event fired', async function (assert) {
    assert.expect(2);

    await visit(START_ROUTE);
    await click('[data-test-action-bar-item="SKIP"]');

    const filteredSkipRequest = PretenderManager.getHandledRequests().filter(
      (request) =>
        request.method === 'POST' &&
        request.path ===
          '/voyager/api/voyagerOnboardingDashOnboardingStep?action=markStepWithUserAction' &&
        JSON.parse(request.request.requestBody).userAction ===
          USER_ACTION_ENUM.SKIP
    );

    assert.equal(
      filteredSkipRequest.length,
      1,
      `${USER_ACTION_ENUM.SKIP} event is fired once`
    );

    assert.equal(
      currentRouteName(),
      `${FEED_ROUTE}.index`,
      `The current route should be ${FEED_ROUTE}`
    );
  });

  test('done button causes a transition to /groups/<id>/join with COMPLETE event fired', async function (assert) {
    assert.expect(2);

    await visit(START_ROUTE);
    await click('[data-test-action-bar-item="DONE"]');

    const filteredCompleteRequest = PretenderManager.getHandledRequests().filter(
      (request) =>
        request.method === 'POST' &&
        request.path ===
          '/voyager/api/voyagerOnboardingDashOnboardingStep?action=markStepWithUserAction' &&
        JSON.parse(request.request.requestBody).userAction ===
          USER_ACTION_ENUM.COMPLETE
    );

    assert.equal(
      filteredCompleteRequest.length,
      1,
      `${USER_ACTION_ENUM.COMPLETE} event is fired once`
    );

    const expectedRoute = 'groups.groups-entity.index.feed.all';

    assert.equal(
      currentRouteName(),
      expectedRoute,
      `The current route should be ${expectedRoute}`
    );
  });
});