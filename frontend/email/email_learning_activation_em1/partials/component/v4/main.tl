{@param key="textDirP"/} {! options: ltr, rtl !}

<div class="main-v4">
  {! Logo with Org name !}
  {@eq key=lix_activation_email_show_logo value="enabled"}
    {>"flock/shared/email/phoenix/foundation/primitives/table_open" tableClassP="main-logo-v4"/}
      {?organizationLogo}
        {?organizationName}
          <tr>
            <td class="org-logo">
              <img alt="{i18n_logo_alt}" src="{organizationLogo}" width="64" height="64" />
            </td>
            <td>
              {>"flock/shared/email/phoenix/foundation/elements/typography/headline" headlineSizeP="headline1" headlineStyleP="bold" headlineClassP="org-logo-name" headlineTextP=i18n_organization_name/}
            </td>
          </tr>
        {/organizationName}
      {/organizationLogo}
    {>"flock/shared/email/phoenix/foundation/primitives/table_close"/}
  {/eq}
  {>"flock/shared/email/phoenix/foundation/primitives/table_open" tableClassP="main-header-v4"/}
    <tr>
      <td>
        {! Header !}
        {>"flock/email/email_linkedinlearning_activation_em1/partials/v4/header" textDirectionP="{textDirP}"/}
      </td>
    </tr>
  {>"flock/shared/email/phoenix/foundation/primitives/table_close"/}

  {>"flock/shared/email/phoenix/foundation/primitives/table_open" tableClassP="main-message-v4"/}
    <tr>
      <td>
        {! Body !}
        {>"flock/email/email_linkedinlearning_activation_em1/partials/v4/message" textDirectionP="{textDirP}"/}
      </td>
    </tr>
  {>"flock/shared/email/phoenix/foundation/primitives/table_close"/}
</div>

{?recommendations}
  {>"flock/email/email_linkedinlearning_activation_em1/partials/v4/recommendation" textDirectionP="{textDirP}"/}
{/recommendations}
