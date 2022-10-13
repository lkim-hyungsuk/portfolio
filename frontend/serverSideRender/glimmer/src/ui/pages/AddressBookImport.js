import Component, { hbs } from '@glimmerx/component';
import { BasePage, noJquery, NavLogo } from '@linkedin/ssr-ui-lib';
import { gql } from '@linkedin/gql-webpack-plugin';
import { CssAssetLocalized, assetUrl, addTrackingCode, EmbedJson } from '@linkedin/play-glimmer-core-ui-lib';
import PageHeader from '../components/PageHeader';
import Head from '../components/Head';
import getFormattedBasePage from '../helpers/getFormattedBasePage';

const TRACKING_PREFIX = 'start_fe_address_book_import';
const APP_STORE_TRK_CODE = `${TRACKING_PREFIX}_address_book_import`;

export default class AddressBookImport extends Component {
  get iconPath() {
    return 'images/mercado/illustration-microspots/main-commute/large.svg';
  }

  get appStoreUrl() {
    return noJquery.addQueryParam('https://www.linkedinmobileapp.com/', 'appType', 'FLAGSHIP');
  }

  static template = hbs`
    {{!i18n-resource}}
    {{t-def "LinkedIn Onboarding - ABook Import" key="i18n_abi_page_title"}}
    {{t-def "Sync my contacts" key="i18n_abi_continue_text"}}
    {{t-def "Skip for now" key="i18n_abi_finish_text"}}
    {{t-def "Add your contacts to see who you already know on LinkedIn" key="i18n_abi_header"}}
    {{t-def
      "We\u2019ll periodically import and store your contacts to suggest connections and show you updates about your contacts. You can turn off sync and manage your contacts. You choose who to connect to and who to invite."
      key="i18n_abi_subheader"
    }}
    {{t-def
      '<a href="{:learnMoreLink}" 
      class="color-text-help" data-tracking-will-navigate="true" data-tracking-control-name="abook-import-learn-more-link" target="_blank" aria-label="Click to change learn more about sync contacts">Learn more</a>'
      key="i18n_abi_learn_more"
    }}

    <BasePage @graphQL={{getFormattedBasePage @graphQL.onboardingPage.basePage}}>
      <:head>
        <Head @title={{t "i18n_abi_page_title"}} @canonicalUrl={{@graphQL.onboardingPage.basePage.canonicalUrl}} />
        <CssAssetLocalized @path="stylesheets/address-book-import" />
        <script src={{assetUrl path="artdeco/static/javascripts/artdeco-sans-icons.js"}} defer></script>
      </:head>
      <:body>
        <main class="px-3 flex flex-col bg-color-canvas-tint min-h-screen items-center" role="main">
          <nav class="pt-4 self-start"><NavLogo /></nav>
          <PageHeader @headerText={{t "i18n_abi_header"}} />

          <section class="flex-auto flex flex-col items-center pt-2">
            <icon
              class="flex items-center justify-center w-[128px] h-[128px] img"
              data-delayed-url="{{assetUrl path="images/mercado/illustration-microspots/main-commute/large.svg"}}"
            ></icon>

            <h2 class="text-md text-center text-color-text-secondary pt-2">{{t "i18n_abi_subheader"}}</h2>

            <p class="text-md text-color-action font-bold">{{t "i18n_abi_learn_more" learnMoreLink="google.com"}}</p>
          </section>

          <footer class="footer-sticky">
            <a
              class="button-large button-primary button-link w-full"
              target="_blank"
              href="{{addTrackingCode url=this.appStoreUrl code=APP_STORE_TRK_CODE}}"
              data-tracking-control-name="abook-import-continue"
              data-tracking-will-navigate="false"
              data-js-module-id="submit"
            >
              <span class="align-middle text-white">{{t "i18n_abi_continue_text"}}</span>
            </a>
            <button
              type="button"
              class="button-large button-tertiary-muted w-full mt-1.5"
              data-tracking-control-name="abook-import-skip"
              data-js-module-id="skip"
            >{{t "i18n_abi_finish_text"}}</button>
          </footer>
        </main>

        <EmbedJson @id="currentStepType" @data={{@graphQL.onboardingPage.nextValidStep.stepType}} />
        <EmbedJson @id="source" @data={{@source}} />
      </:body>
      <:scripts>
        <script src="{{assetUrl path="dist/AddressBookImport.js"}}" async defer></script>
      </:scripts>
    </BasePage>
  `;

  static query = gql`
    query GetTheAppPage($currentStep: OnboardingStep, $source: String!, $stepOverride: OnboardingStep) {
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