{?custom_subject}
  {custom_subject|s}
{:else}
  {@select key="{emailType}"}
    {@eq key="{emailType}" value="ACTIVATION_REMINDER"}
      {?global_recipient.firstName}
        {i18n_text_activation_reminder_subject_account_is_waiting|s}
      {:else}
        {i18n_text_activation_reminder_subject_account_is_waiting_no_name|s}
      {/global_recipient.firstName}
    {/eq}
    {@default}
      {?global_recipient.firstName}
        {@select key="{optimizationExperimentResult}"}
          {@eq value="template-free-access"}
            {i18n_text_activation_subject_variant_a|s}
          {/eq}
          {@eq value="template-two-min-setup"}
            {i18n_text_activation_subject_variant_b|s}
          {/eq}
          {@default}
            {i18n_text_activation_subject_unlock_access|s}
          {/default}
        {/select}
      {:else}
        {@select key="{optimizationExperimentResult}"}
          {@eq value="template-free-access"}
            {i18n_text_activation_subject_variant_a_no_name|s}
          {/eq}
          {@eq value="template-two-min-setup"}
            {i18n_text_activation_subject_variant_b_no_name|s}
          {/eq}
          {@default}
            {i18n_text_activation_subject_unlock_access_no_name|s}
          {/default}
        {/select}
      {/global_recipient.firstName}
    {/default}
  {/select}
{/custom_subject}
