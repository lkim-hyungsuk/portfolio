import MemberToGuestInvitations from './MemberToGuestInvitations';
import MemberToGuestInvitationsGlimmer from '../../../glimmer/src/ui/pages/MemberToGuestInvitations';
import defaultData from '../../../glimmer/src/ui/pages/test-data/GetTheApp/full-page.json';
import { renderOptions } from '@linkedin/jest-glimmer';
import { render } from '@linkedin/play-glimmer-test-helpers';
import PretenderManager from '../utils/pretender';
import { expect } from '@jest/globals';

describe('MemberToGuestInvitations', function () {
  let pretenderManager;
  const locationMock = { href: defaultData.graphQL.onboardingPage.basePage.canonicalUrl, replace: jest.fn() };
  const windowMock = new Proxy(window, {
    get(target, prop) {
      if (prop === 'location') {
        return locationMock;
      }

      return Reflect.get(...arguments);
    }
  });

  beforeEach(async () => {
    pretenderManager = new PretenderManager();
    pretenderManager.setResponse('post', 'mwlite/startfrontend/api/runQuery');
    const html = await render(MemberToGuestInvitationsGlimmer, renderOptions(defaultData));
    document.body.innerHTML = html;
  });

  afterEach(() => {
    pretenderManager.reset();
    windowMock.location.replace.mockRestore();
  });

  describe('constructor', () => {
    test('it calls markUserAction to send an impression action', async () => {
      const memberToGuestInvitations = new MemberToGuestInvitations(windowMock, document);

      await expect(memberToGuestInvitations._impressionReq).resolves.toEqual({});

      expect(
        pretenderManager.getMatchedRequests('/mwlite/startfrontend/api/runQuery', {}, 'POST')[0].requestBodyJSON
      ).toMatchInlineSnapshot(
        {},
        `
        Object {
          "variables": Object {
            "action": "IMPRESSION",
            "currentStep": "GET_THE_APP",
            "source": "lite-frontend",
          },
        }
      `
      );
    });
  });
});