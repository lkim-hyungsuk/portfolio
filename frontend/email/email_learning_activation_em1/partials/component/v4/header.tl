{@param key="textDirP"/} {! options: ltr, rtl !}

{?custom_header}
  {>"flock/shared/email/mercado/foundation/elements/typography/headline"
    headlineSizeP="title1"
    headlineDirP="{txtDirP}"
    headlineTextP="{custom_header|s}"
    headlineClassP="header-v4"
  /}
{:else}
  {@select key="{optimizationExperimentResult}"}
    {@eq value="template-free-access"}
      {?organizationName}
        {>"flock/shared/email/mercado/foundation/elements/typography/headline"
          headlineSizeP="title1"
          headlineDirP="{txtDirP}"
          headlineTextP="{i18n_header_header_v4_variant_a|s}"
          headlineClassP="header-v4"
        /}
      {:else}
        {>"flock/shared/email/mercado/foundation/elements/typography/headline"
          headlineSizeP="title1"
          headlineDirP="{txtDirP}"
          headlineTextP="{i18n_header_header_v4_variant_a_wo_org_name|s}"
          headlineClassP="header-v4"
        /}
      {/organizationName}
    {/eq}
    {@eq value="template-two-min-setup"}
      {>"flock/shared/email/mercado/foundation/elements/typography/headline"
        headlineSizeP="title1"
        headlineDirP="{txtDirP}"
        headlineTextP="{i18n_header_header_v4_variant_b|s}"
        headlineClassP="header-v4"
      /}
    {/eq}
  {/select}
{/custom_header}
