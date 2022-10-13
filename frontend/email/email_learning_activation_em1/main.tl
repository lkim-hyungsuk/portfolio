{! fmt, URL, images, etc. !}
{>"flock/email/email_linkedinlearning_activation_em1/partials/conf"/}

{! i18n strings !}
{>"flock/email/email_linkedinlearning_activation_em1/partials/i18n"/}
{>"flock/email/email_linkedinlearning_activation_em1/partials/i18n_text"/}

{! Email theme !}
{@eq key="{optimizationExperimentResult}" value="control"}
  {>"flock/shared/email/phoenix/foundation/layouts/no_padding_preheader" recipientTypeP="guest" footerTypeP="transactional" emailDescriptionP="{i18n_activation_email}" brandingTypeP="learning"/}
{:else}
  {>"flock/shared/email/phoenix/foundation/layouts/no_padding_preheader"
    recipientTypeP="guest"
    headerTypeP="learning"
    footerTypeP="default"
    recipientFullNameP=fmt_recipient_name_full
    emailDescriptionP=i18n_linkedin_learning
  /}
{/eq}

{<headerContentBrandHtml}
  {>"flock/shared/email/phoenix/foundation/primitives/table_open"/}
    <tr>
      <td class="brand-header">
          {>"flock/shared/email/phoenix/foundation/elements/typography/headline" headlineClassP="heading" headlineSizeP="headline2" headlineTextP="{i18n_text_linkedin_learning_header}"/}
      </td>
    </tr>
  {>"flock/shared/email/phoenix/foundation/primitives/table_close"/}
{/headerContentBrandHtml}

{<subject}
  {>"flock/email/email_linkedinlearning_activation_em1/partials/v3/subject"/}
{/subject}

{<toDisplayName}
  {?global_recipient.firstName}
    {i18n_text_common_to_display_name|s}
  {:else}
    {i18n_text_common_to_display_name_no_name|s}
  {/global_recipient.firstName}
{/toDisplayName}
{<fromDisplayName}
  {?organizationName}
    {i18n_text_from_display_name_v3|s}
  {:else}
    {?companyName}
      {i18n_text_redesign_from_display_name|s}
    {:else}
      {i18n_text_redesign_from_no_org_display_name|s}
    {/companyName}
  {/organizationName}
{/fromDisplayName}

{<emailCSSTheme}
  {>"flock/email/email_linkedinlearning_activation_em1/partials/css"/}
{/emailCSSTheme}

{<preHeader}
  {>"flock/email/email_linkedinlearning_activation_em1/partials/v3/preheader"/}
{/preHeader}

{<textContent}
  {>"flock/email/email_linkedinlearning_activation_em1/partials/v3/plain_text"/}
{/textContent}

{<content}
  {?global_isRtl}
    {@eq key="{optimizationExperimentResult}" value="control"}
      {>"flock/email/email_linkedinlearning_activation_em1/partials/v3/content" textDirP="rtl"/}
    {:else}
        {>"flock/email/email_linkedinlearning_activation_em1/partials/v4/main" textDirP="rtl"/}
    {/eq}
  {:else}
    {@eq key="{optimizationExperimentResult}" value="control"}
      {>"flock/email/email_linkedinlearning_activation_em1/partials/v3/content" textDirP="ltr"/}
    {:else}
        {>"flock/email/email_linkedinlearning_activation_em1/partials/v4/main" textDirP="ltr"/}
    {/eq}
  {/global_isRtl}
{/content}

