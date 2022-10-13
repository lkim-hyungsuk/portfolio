{@param key="cardTypeP"/}
{@param key="cardImgUrlP"/}
{@param key="cardImgAltP"/}
{@param key="cardTitleP"/}
{@param key="cardInfoP"/}
{@param key="cardInfoIconP"/}
{@param key="cardUrlP" defaultVal="#"/}
{@param key="cardTimeP"/}
{@param key="cardShowPlayBtn"/}
{@param key="cardTextDirP"/}


{>"flock/shared/email/phoenix/foundation/primitives/table_open" tableClassP="max-width-220"/}
<tr>
  <td width="220" height="125">
    <a href={cardUrlP} target="_blank" aria-label="{i18n_header_cta_unlock_access}">
      {?cardImgUrlP}
        <img class="card-image" width="150" src="{cardImgUrlP}" alt="{cardImgAltP}" />
      {:else}
        <img class="card-image" width="150" src="{img_default_custom_content}" alt="{cardImgAltP}" />
      {/cardImgUrlP}
    </a>
  </td>
</tr>
<tr>
  <td valign="top">
    <a href={cardUrlP} target="_blank" aria-label="{i18n_header_cta_unlock_access}">
      {>"flock/shared/email/phoenix/foundation/primitives/table_open" tableClassP="card-type" tableAlignP="left" tableValignP="middle"/}
        <tr>
          <td>
            {?cardTimeP}
              {>"flock/shared/email/phoenix/foundation/elements/typography/headline" headlineSizeP="subhead" headlineStyleP="light" headlineDirP="{cardTextDirP}" headlineTextP="{cardTypeP} &bull; {cardTimeP}"/}
            {:else}
              {>"flock/shared/email/phoenix/foundation/elements/typography/headline" headlineSizeP="subhead" headlineStyleP="light" headlineDirP="{cardTextDirP}" headlineTextP="{cardTypeP}"/}
            {/cardTimeP}
          </td>
        </tr>
        <tr>
          <td>
            {>"flock/shared/email/phoenix/foundation/elements/typography/headline" headlineSizeP="title2" headlineStyleP="bold" headlineDirP="{cardTextDirP}" headlineTextP="{cardTitleP}"/}
          </td>
        </tr>
        <tr>
          <td>
            {?cardInfoP}
              {>"flock/shared/email/phoenix/foundation/elements/typography/headline" headlineSizeP="subhead" headlineDirP="{cardTextDirP}" headlineStyleP="light" headlineTextP="{cardInfoP|s}"/}
            {/cardInfoP}
          </td>
        </tr>
      {>"flock/shared/email/phoenix/foundation/primitives/table_close"/}
    </a>
  </td>
</tr>
{>"flock/shared/email/phoenix/foundation/primitives/table_close" /}

