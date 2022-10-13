import Component, { hbs } from '@glimmerx/component';
import { BasePage, NavLogo } from '@linkedin/ssr-ui-lib';
import { gql } from '@linkedin/gql-webpack-plugin';
import { CssAssetLocalized, assetUrl, EmbedJson } from '@linkedin/play-glimmer-core-ui-lib';
import PageHeader from '../components/PageHeader';
import Head from '../components/Head';

export default class MemberToGuestInvitations extends Component {
  static template = hbs`
    {{!i18n-resource}}
    {{t-def "LinkedIn Onboarding - Member to Guest Invitations" key="i18n_m2g_page_title"}}
    {{t-def "Skip for now" key="i18n_m2g_skip"}}
    {{t-def "Invite" key="i18n_m2g_invite"}}
    {{t-def "Invited" key="i18n_m2g_invite_checked"}}
    {{t-def "Invite your friends to join you on LinkedIn" key="i18n_m2g__header"}}
    {{t-def "If someone you invite doesn\u2019t respond, we\u2019ll remind them in 7 days." key="i18n_m2g_subheader"}}

    <BasePage @graphQL={{@graphQL.onboardingPage.basePage}}>
      <:head>
        <Head @title={{t "i18n_m2g_page_title"}} @canonicalUrl={{@graphQL.onboardingPage.basePage.canonicalUrl}} />
        <CssAssetLocalized @path="stylesheets/member-to-guest-invitations" />
      </:head>
      <:body>
        <main class="px-3 flex flex-col bg-color-canvas-tint min-h-screen items-center" role="main">
          <nav class="pt-4 self-start"><NavLogo /></nav>
          <PageHeader @headerText={{t "i18n_m2g__header"}} @subheaderText={{t "i18n_m2g_subheader"}} />
          {{! TODO | Add email list by using mock data }}
          <footer class="footer-sticky">
            <button
              type="button"
              class="button-large button-tertiary-muted w-full mt-1.5"
              data-tracking-control-name="member-to-guest-invitations-skip"
              data-js-module-id="skip"
            >{{t "i18n_m2g_skip"}}</button>
          </footer>
        </main>

        <EmbedJson @id="currentStepType" @data={{@graphQL.onboardingPage.nextValidStep.stepType}} />
        <EmbedJson @id="source" @data={{@source}} />
      </:body>
      <:scripts>
        <script src="{{assetUrl path="dist/MemberToGuestInvitations.js"}}" async defer></script>
      </:scripts>
    </BasePage>
  `;

  // TODO Fetch the list of emails to show
  static query = gql`
    query MemberToGuestInvitationsPage($currentStep: OnboardingStep, $source: String!, $stepOverride: OnboardingStep) {
      onboardingPage(input: { currentStep: $currentStep, source: $source, stepOverride: $stepOverride }) {
        basePage {
          ...${BasePage.query}
        }
        nextValidStep {
          stepType
        }
      }
    }
  `;
}