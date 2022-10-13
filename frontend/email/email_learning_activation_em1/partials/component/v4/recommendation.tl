{@param key="textDirectionP"/} {! options: ltr, rtl !}

{>"flock/shared/email/phoenix/foundation/primitives/table_open" tableAlignP="center" tableValignP="middle" tableClassP="recommendation-table-v4" /}
  {?recommendations}
    <tr>
      <td colspan="2" class="recommendation-title-v4">
        {>"flock/shared/email/phoenix/foundation/elements/typography/headline"
          headlineClassP="course-title-v4"
          headlineSizeP="title2"
          headlineDirP="{textDirectionP}"
          headlineTextP="{i18n_courses_content_recommendations_v4}"/}
      </td>
    </tr>
  {/recommendations}
  {#recommendations}
    {>"flock/shared/email/learning/layouts/grid" countPerRowP=2 /}
    {<gridContent}
      <td width="220" class="card-v4 medium-bottom-space inline-block">
        {#lyndaVideo}
          {>"flock/email/email_linkedinlearning_activation_em1/partials/component/v4/card" cardImgUrlP=thumbnailUrl cardImgAltP=title cardTitleP=title cardInfoP=socialProof cardTypeP="{i18n_courses_type_video}" cardShowPlayBtn="true" cardUrlP=url_account_activation cardTimeP="
          {i18n_text_format_display_friendly_duration}" cardTextDirP="{textDirectionP}"/}
        {/lyndaVideo}
        {#lyndaCourse}
          {>"flock/email/email_linkedinlearning_activation_em1/partials/component/v4/card" cardImgUrlP=thumbnailUrl cardImgAltP=title cardTitleP=title cardInfoP=socialProof cardTypeP="{i18n_courses_type_course}" cardShowPlayBtn="true" cardUrlP=url_account_activation cardTimeP="
          {i18n_text_format_display_friendly_duration}" cardTextDirP="{textDirectionP}"/}
        {/lyndaCourse}
        {#lyndaLearningCollection}
          {>"flock/email/email_linkedinlearning_activation_em1/partials/component/v4/card" cardImgUrlP=thumbnailUrl cardImgAltP=title cardTitleP=title cardInfoP=socialProof cardTypeP="{i18n_courses_type_collection}" cardUrlP=url_account_activation cardTimeP="
          {i18n_text_format_display_friendly_duration}" cardTextDirP="{textDirectionP}"/}
        {/lyndaLearningCollection}
        {#lyndaLearningPath}
          {>"flock/email/email_linkedinlearning_activation_em1/partials/component/v4/card" cardImgUrlP=thumbnailUrl cardImgAltP=title cardTitleP=title cardInfoP=socialProof cardTypeP="{i18n_courses_type_path}" cardUrlP=url_account_activation cardTimeP="
          {i18n_text_format_display_friendly_duration}" cardTextDirP="{textDirectionP}"/}
        {/lyndaLearningPath}
        {#learningCustomContent}
          {>"flock/email/email_linkedinlearning_activation_em1/partials/component/v4/card" cardImgUrlP=thumbnailUrl cardImgAltP=title cardTitleP=title cardInfoP=socialProof cardTypeP="{i18n_courses_type_custom_content}" cardUrlP=url_account_activation cardTextDirP="{textDirectionP}"/}
        {/learningCustomContent}
      </td>
    {/gridContent}
  {/recommendations}
{>"flock/shared/email/phoenix/foundation/primitives/table_close"/}