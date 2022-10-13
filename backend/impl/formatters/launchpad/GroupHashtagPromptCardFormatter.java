package com.linkedin.voyager.growth.launchpad.dash.impl.formatters.evtgroups;

import com.basistech.com.google.common.collect.ImmutableMap;
import com.linkedin.common.url.Url;
import com.linkedin.common.urn.Urn;
import com.linkedin.parseq.Task;
import com.linkedin.pemberly.api.server.lix.LixService;
import com.linkedin.pemberly.api.server.url.UrlService;
import com.linkedin.playmt.restliplugin.server.FabricChecker;
import com.linkedin.restli.common.HttpStatus;
import com.linkedin.restli.server.RestLiServiceException;
import com.linkedin.urls_private.url.aliases.NeptuneUrlAliases;
import com.linkedin.voyager.common.VoyagerServiceException;
import com.linkedin.voyager.common.core.api.helpers.VoyagerMemberFinder;
import com.linkedin.voyager.common.core.api.services.VoyagerClientInfoService;
import com.linkedin.voyager.common.dash.api.growth.services.BaseAmbryService;
import com.linkedin.voyager.common.dash.api.infra.formatters.tracking.TrackingKeyFormatter;
import com.linkedin.voyager.common.dash.api.infra.helpers.RenderModelBuilderFactory;
import com.linkedin.voyager.common.dash.api.infra.helpers.image.ImageViewModelBuilder;
import com.linkedin.voyager.common.dash.api.infra.services.VoyagerLocalizationService;
import com.linkedin.voyager.dash.common.SystemImageName;
import com.linkedin.voyager.dash.common.image.ImageViewModel;
import com.linkedin.voyager.dash.common.text.TextViewModel;
import com.linkedin.voyager.dash.common.tracking.PageKey;
import com.linkedin.voyager.dash.launchpad.LaunchpadContext;
import com.linkedin.voyager.dash.launchpad.LaunchpadCta;
import com.linkedin.voyager.dash.launchpad.LaunchpadCtaStyle;
import com.linkedin.voyager.dash.launchpad.PresentationStyle;
import com.linkedin.voyager.growth.launchpad.dash.impl.LaunchpadTranslationKey;
import com.linkedin.voyager.growth.launchpad.dash.impl.common.tracking.NeptunePageKeyConstants;
import com.linkedin.voyager.growth.launchpad.dash.impl.common.tracking.VoyagerPageKeyConstants;
import com.linkedin.voyager.growth.launchpad.dash.impl.formatters.LaunchpadCardFormatter;
import com.linkedin.voyager.growth.launchpad.dash.impl.helpers.LaunchpadCardWrapper;
import com.linkedin.voyager.growth.launchpad.dash.impl.helpers.groups.GroupTrendingHashtagChameleonConfig;
import com.linkedin.voyager.growth.launchpad.dash.impl.services.GroupTrendingHashtagChameleonService;
import graphql.VisibleForTesting;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import javax.annotation.Nullable;
import lombok.NonNull;
import org.jooq.tools.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xeril.wafwk.gui.url.UrlAliasParameter;

import static com.linkedin.voyager.growth.launchpad.dash.impl.services.GroupTrendingHashtagChameleonService.*;


/**
 * This is the card formatter for groups hashtag prompt
 * You can find the PRD here: go/cbc/launchpad/prd
 * Chameleon UI Link: https://chameleon.prod.linkedin.com/#/test/list?configType=group-trending-hashtag&segment=GROWTH%3Aglobal
 * Chameleon SystemImageName/Prompt Creation: https://chameleon.prod.linkedin.com/#/content-system?configType=group-trending-hashtag
 *
 */
public class GroupHashtagPromptCardFormatter extends LaunchpadCardFormatter {

  private static final Logger LOG = LoggerFactory.getLogger(GroupHashtagPromptCardFormatter.class);
  private static final String NEW_LINES_URL_ENCODED = "%0D%0D";
  private static final String GROUP_URN_ATTRIBUTE_KEY = "GROUP_URN";
  private final GroupTrendingHashtagChameleonService groupTrendingHashtagChameleonService;
  private final Map<String, Integer> cardTypeToIndexMap;

  public GroupHashtagPromptCardFormatter(FabricChecker fabricChecker,
      VoyagerLocalizationService voyagerLocalizationService,
      BaseAmbryService ambryService,
      VoyagerMemberFinder voyagerMemberFinder,
      UrlService urlService,
      VoyagerClientInfoService clientInfoService,
      LixService lixService,
      RenderModelBuilderFactory renderModelBuilderFactory,
      TrackingKeyFormatter trackingKeyFormatter,
      GroupTrendingHashtagChameleonService groupTrendingHashtagChameleonService,
      Map<String, Integer> cardTypeToIndexMap) {
    super(fabricChecker, voyagerLocalizationService, renderModelBuilderFactory, ambryService, voyagerMemberFinder,
        urlService, clientInfoService, lixService, trackingKeyFormatter);
    this.groupTrendingHashtagChameleonService = groupTrendingHashtagChameleonService;
    this.cardTypeToIndexMap = cardTypeToIndexMap;
  }

  /**
   * @param launchpadCardWrapper the internal launchpad card includes launchpad mt launchpad card and decorationUrns
   * @return a task of {@link TextViewModel}
   */
  @Override
  public Task<TextViewModel> getTitle(LaunchpadCardWrapper launchpadCardWrapper) {
    GroupTrendingHashtagChameleonConfig targetChameleonConfig = findTargetChameleonConfig(launchpadCardWrapper);
    String title = targetChameleonConfig.getHashtag();
    return Task.value(renderModelBuilderFactory.getDashTextViewModelBuilder().setLocalizedTextV2(title).build());
  }

  /**
   * @param launchpadCardWrapper backend launchpad card from launchpad-mt
   * @return a task of {@link TextViewModel}
   */
  @Override
  public Task<Optional<TextViewModel>> getSubtitle(LaunchpadCardWrapper launchpadCardWrapper) {
    GroupTrendingHashtagChameleonConfig targetChameleonConfig = findTargetChameleonConfig(launchpadCardWrapper);
    String subtitle = StringUtils.defaultIfNull(targetChameleonConfig.getPrompt(), "");
    return Task.value(Optional.of(renderModelBuilderFactory.getDashTextViewModelBuilder().setLocalizedTextV2(subtitle).build()));
  }

  /**
   * Launchpad crt will open a post share box, deeplink url of clicking on crt will in the format of
   * "/share?text=%0D%0D%23[hashtag]&hint=Start+a+post&trk=.."
   * @param launchpadContext {@link LaunchpadContext}
   * @param ctaType the type of the CTA.
   * @param launchpadCta the launchpadCta we want to populate
   * @param launchpadCardWrapper the launchpad card from launchpad mt
   * @return a task of {@link LaunchpadCta}
   */
  @Override
  public Task<LaunchpadCta> populateLaunchpadCta(
      LaunchpadContext launchpadContext, String ctaType, LaunchpadCta launchpadCta, LaunchpadCardWrapper launchpadCardWrapper) {
    String legoTrackingToken = launchpadCardWrapper.getBackendLaunchpadCard().getLegoTrackingToken();
    GroupTrendingHashtagChameleonConfig targetChameleonConfig = findTargetChameleonConfig(launchpadCardWrapper);
    String hashtag = targetChameleonConfig.getHashtag();

    return Task.value(new LaunchpadCta().setCtaTitle(
            getTextViewModelByContent(LaunchpadTranslationKey.CARDS_GROUP_TRENDING_HASHTAG_PROMPT_STARTPOSTS))
        .setCtaStyle(LaunchpadCtaStyle.PRIMARY)
        .setCtaType(ctaType)
        .setPresentationStyle(PresentationStyle.REDIRECT)
        .setDeeplinkUrl(getDeeplinkUrl(hashtag, legoTrackingToken)));
  }

  /**
   * @param launchpadCardWrapper the launchpad card from launchpad mt
   * @return a task of {@link ImageViewModel}
   */
  @Override
  public Task<Optional<ImageViewModel>> getBackgroundImage(LaunchpadCardWrapper launchpadCardWrapper) {
    GroupTrendingHashtagChameleonConfig targetChameleonConfig = findTargetChameleonConfig(launchpadCardWrapper);
    SystemImageName systemImageName = targetChameleonConfig.hasCardImage() ? targetChameleonConfig.getCardImage().get() : DEFAULT_SYSTEM_IMAGE;
    try {
      return Task.value(Optional.of(
          renderModelBuilderFactory.getDashImageViewModelBuilder().addSystemImage(systemImageName).build()));
    } catch (ImageViewModelBuilder.BuildVerificationFailure e) {
      // adding this since intelliJ complains about the very fact that we are using ImageViewModelBuilder
      throw VoyagerServiceException.buildNoStacktraceException(HttpStatus.S_500_INTERNAL_SERVER_ERROR,
          String.format("Invalid image", systemImageName), e);
    }
  }

  /**
   * Get page key of this launchpad card
   * @param isCardCompleted a boolean value indicates the complete status
   * @return {@link PageKey}
   */
  @Override
  public PageKey getPageKey(boolean isCardCompleted) {
    return trackingKeyFormatter.formatPageKey(
        NeptunePageKeyConstants.LAUNCHPAD_CARD_EVTGROUPS_ACTIONS_PAGE_KEY,
        VoyagerPageKeyConstants.LAUNCHPAD_CARD_EVTGROUPS_ACTIONS_PAGE_KEY);
  }

  @VisibleForTesting
  protected Url getDeeplinkUrl(String hashtag, String trackingToken) {
    Map<UrlAliasParameter, String> params = ImmutableMap.of(
        NeptuneUrlAliases.NeptuneShare.Parameters.hint, voyagerLocalizationService.plainText(
            LaunchpadTranslationKey.CARDS_GROUP_TRENDING_HASHTAG_PROMPT_STARTPOSTS),
        NeptuneUrlAliases.NeptuneShare.Parameters.text, hashtag);
    String url = StringUtils.replace(urlService.link(NeptuneUrlAliases.NeptuneShare.instance, Optional.of(trackingToken), params),
        "text=", "text=" + NEW_LINES_URL_ENCODED);
    return new Url(url);
  }

  /**
   * Find the target launchpad card config given the group ID that's stored inside launchpadCardWrapper
   * @param launchpadCardWrapper
   * @return GroupTrendingHashtagChameleonConfig
   */
  GroupTrendingHashtagChameleonConfig findTargetChameleonConfig(LaunchpadCardWrapper launchpadCardWrapper) {
    Urn groupUrn;
    try {
      groupUrn = launchpadCardWrapper.getBackendLaunchpadCard()
          .getAttributes()
          .stream()
          .filter(attribute -> GROUP_URN_ATTRIBUTE_KEY.equals(attribute.getType()))
          .findFirst()
          .get().getRelatedEntities().stream().findFirst().get();
    } catch (RestLiServiceException e) {
      LOG.error("groupUrn is not found");
      throw new RestLiServiceException(HttpStatus.S_404_NOT_FOUND);
    }

    try {
      Long groupId = groupUrn.getIdAsLong();
      List<GroupTrendingHashtagChameleonConfig> maybeChameleonConfigs =
          groupTrendingHashtagChameleonService.fetchGroupTrendingHashtags(groupId);
      if (maybeChameleonConfigs == null || maybeChameleonConfigs.isEmpty()) {
        LOG.error("maybeChameleonConfigs is not found or empty");
        throw new RestLiServiceException(HttpStatus.S_404_NOT_FOUND);
      }
      String cardType = launchpadCardWrapper.getBackendLaunchpadCard().getCardType(); // getCardType throws error internally
      GroupTrendingHashtagChameleonConfig targetConfig = maybeChameleonConfigs.get(cardTypeToIndexMap.getOrDefault(cardType, 1));
      if (targetConfig == null) {
        LOG.error("target GroupTrendingHashtagChameleonConfig is not found");
        throw new RestLiServiceException(HttpStatus.S_404_NOT_FOUND);
      }
      return targetConfig;
    } catch (RestLiServiceException e) {
      throw new RestLiServiceException(HttpStatus.S_404_NOT_FOUND,
          String.format("Could not fetch groupUrn {} from launchpadCardWrapper for {}", groupUrn, launchpadCardWrapper));
    }
  }
}