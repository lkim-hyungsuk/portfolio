import markUserAction, { ACTIONS } from '../utils/markStepRequest';
import { getEmbeddedContent } from '@linkedin/ssr-ui-lib/vanilla';
import getElByModuleId from '../utils/getElByModuleId';
import { redirectToNextStep } from '../utils/redirectUtils';

const { SKIP, COMPLETE, IMPRESSION } = ACTIONS;

export default class AddressBookImport {
  constructor() {
    this.submitButtonEl.addEventListener('click', () => this.submit());
    this.skipButtonEl.addEventListener('click', () => this.skip());

    // expose request for testing
    this._impressionReq = markUserAction(this.source, this.currentStepType, IMPRESSION);
  }

  get submitButtonEl() {
    return getElByModuleId('submit');
  }

  get skipButtonEl() {
    return getElByModuleId('skip');
  }

  get source() {
    return getEmbeddedContent('source');
  }

  get currentStepType() {
    return getEmbeddedContent('currentStepType');
  }

  async submit() {
    try {
      await markUserAction(this.source, this.currentStepType, COMPLETE);
    } finally {
      redirectToNextStep();
    }
  }

  async skip() {
    try {
      await markUserAction(this.source, this.currentStepType, SKIP);
    } finally {
      redirectToNextStep();
    }
  }
}