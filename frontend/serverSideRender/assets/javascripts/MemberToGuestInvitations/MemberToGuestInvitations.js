import markUserAction, { ACTIONS } from '../utils/markStepRequest';
import { getEmbeddedContent } from '@linkedin/ssr-ui-lib/vanilla';

const { IMPRESSION } = ACTIONS;

/**
 * Member to Guest Invitations client side JS controller
 *
 * @export
 * @class MemberToGuestInvitations
 */
export default class MemberToGuestInvitations {
  constructor(_window) {
    this._window = _window;
    // expose request for testing
    this._impressionReq = markUserAction(this.source, this.currentStepType, IMPRESSION);
  }

  get source() {
    return getEmbeddedContent('source');
  }

  get currentStepType() {
    return getEmbeddedContent('currentStepType');
  }
}