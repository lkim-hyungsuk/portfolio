{@param key="textDirP"/} {! options: ltr, rtl !}

{?custom_message}
  {>"flock/shared/email/mercado/foundation/elements/typography/body" bodyClassP="body-v4" bodySizeP="body1" bodyDirP="{txtDirP}" bodyStyleP="light" bodyTextP="{custom_message}"/}
{:else}
  {@select key="{optimizationExperimentResult}"}
    {@eq value="template-free-access"}
      {>"flock/shared/email/mercado/foundation/elements/typography/body" bodyClassP="body-v4" bodySizeP="body1" bodyDirP="{txtDirP}" bodyStyleP="light" bodyTextP="{i18n_header_message_v4_variant_a}"/}
    {/eq}
    {@eq value="template-two-min-setup"}
      {>"flock/shared/email/mercado/foundation/elements/typography/body" bodyClassP="body-v4" bodySizeP="body1" bodyDirP="{txtDirP}" bodyStyleP="light" bodyTextP="{i18n_header_message_v4_variant_b}"/}
    {/eq}
    {@default}
      {>"flock/shared/email/mercado/foundation/elements/typography/body" bodyClassP="body-v4" bodySizeP="body1" bodyDirP="{txtDirP}" bodyStyleP="light" bodyTextP="{i18n_header_salutation_unlock_learning_experiences}"/}
    {/default}
  {/select}
{/custom_message}

{! Main CTA !}
{@select key="{optimizationExperimentResult}"}
  {@ne value="control"}
    {>"flock/shared/email/phoenix/foundation/elements/button/regular"
      buttonTypeP="primary" buttonTextP=i18n_header_cta_activate_now buttonUrlP="{url_account_activation}" buttonSizeP="large"/}
  {/ne}
  {@default}
    {>"flock/shared/email/phoenix/foundation/elements/button/regular" buttonTypeP="primary" buttonTextP=i18n_header_cta_get_started buttonUrlP="{url_account_activation}" buttonSizeP="large"/}
  {/default}
{/select}

{! Expiration Date !}
{>"flock/shared/email/phoenix/foundation/elements/typography/headline"
  headlineClassP="expiration-v4"
  headlineSizeP="title2"
  headlineDirP="{textDirectionP}"
  headlineTextP="{i18n_expiration_date|s}"
/}

{! Multi Locale selection !}
{?useGlobalPassport}
  {>"flock/shared/email/phoenix/foundation/primitives/table_open"/}
    <tr>
      <td>
        {#globalPassport}
          <a href="{activationUrl}" class="t-14>
            {>"flock/shared/email/phoenix/foundation/elements/typography/body"
              bodyClassP="text"
              bodySizeP="caption1"
              bodyInsideLinkP="true" bodyTextP=localeDisplayName
            /}
            {@ne key="{$idx}" value="5" type="number"}
              <span class="pipe">&nbsp;|&nbsp;</span>
            {/ne}
          </a>
        {/globalPassport}
      </td>
    </tr>
  {>"flock/shared/email/phoenix/foundation/primitives/table_close"/}
{/useGlobalPassport}
