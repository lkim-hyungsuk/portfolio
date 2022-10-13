/*
## JIRA
BUG=SEG-11811

## Summary
This PR adds a new onboarding widget, targeting existing Firstline workers to encourage them join one of most popular Retail & Customer Service Group. We anticipate this feature will help drive up DAU / WAU in LI.

## User Story
This PR covers upto #3, and #4 will be handled in a separate ticket: (SEG-11825)

Firstline member signs in
LEGO logic kicks in and show this new Onboarding Widget
Once "Accept Invite" is clicked, send the users to /groups/8797287/join link. Otherwise, lead them to Feed page.
Once user lands on /groups/8797287/join, it will fire the request to join the group, which will be automatically approved (hence this project is called "Firstline Group Auto-invite"). Once successful, lead them to Group Feed page. Otherwise, error page.
PRD: https://docs.google.com/document/d/1l0r9FhOGI8NUhECYvo-KStK9BlMDteAqH1EUKvzrjrA/edit

## Details
Since /groups/:group-id/join hasn't been implemented yet, I am temporarily using the pre-existing /about nested route for debugging purpose. Will update this later (SEG-11825)

I am leveraging the existing onStepCompleted method's data param to fork my logic so that I can redirect users to the target Group Feed page

## Testing Done
(add) acceptance test

Screenshots
Screen Shot 2021-05-27 at 11 52 45 AM
*/
import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { CLIENT_SENSOR, LIXES } from 'onboarding/utils/constants';

// target group ID to which Firstline workers will be auto-invited (The Break Room: Retail & Customer Service)
const targetGroupId = 8797287;

/**
 * Renders the firstline-group-auto-invite widget used during onboarding
 * @arg {Object} stepModel - an onboarding step model instance
 * @arg {Object} metadata - metadata returned from widget route
 * @arg {Function} onStepCompleted - a closure action called when the widget has been completed
 * @arg {Function} onStepSkipped - a closure action called when the widget has been skipped
 * @arg {Function} onStepImpression - a closure action called when the widget has been impressed
 */
export default class FirstlineGroupAutoInvite extends Component {
  @service('client-sensor-web@client-sensor')
  clientSensor;

  @service('lix')
  lix;

  /**
   * @type {boolean} shouldHideDismissBtn
   * Control = Show / Enabled = Hide
   */
  get shouldHideDismissBtn() {
    return this.lix.getTreatmentIsEnabled(
      LIXES.FIRSTLINE_GROUP_AUTO_INVITE_HIDE_DISMISS
    );
  }

  constructor() {
    super(...arguments);
    this.clientSensor.incrementMetricCounter({
      groupName: CLIENT_SENSOR.GROUP_NAME,
      metricName: 'firstline-group-auto-invite-impression',
    });
  }

  /**
   * Redirects users to /groups/<targetGroupId>/join
   * Since that point Groups Pillar will take care of Business Logic
   */
  @action
  onClickMainCTA() {
    this.args.onStepCompleted({
      context: 'firstline-group-auto-invite',
      targetGroupId,
    });
  }
}