package com.linkedin.voyager.growth.launchpad.dash.impl.services;

import com.google.common.collect.ImmutableMap;
import com.linkedin.chameleon.client.api.ConfigPipelineMgr;
import com.linkedin.chameleon.client.impl.ConfigTargetingInfo;
import com.linkedin.chameleon.client.impl.pipelines.genericpipeline.ChameleonConfig;
import com.linkedin.chameleon.client.impl.pipelines.genericpipeline.ChameleonPayloadObject;
import com.linkedin.common.urn.Urn;
import com.linkedin.pemberly.api.server.context.CurrentRequestService;
import com.linkedin.pemberly.api.server.context.RequestLocaleService;
import com.linkedin.voyager.common.core.api.helpers.UrnHelpers;
import com.linkedin.voyager.common.core.api.helpers.VoyagerMemberFinder;
import com.linkedin.voyager.common.core.api.services.VoyagerLixServiceSync;
import com.linkedin.voyager.common.dash.api.infra.helpers.RenderModelBuilderFactory;
import com.linkedin.voyager.dash.common.SystemImageName;
import com.linkedin.voyager.growth.launchpad.dash.impl.helpers.groups.GroupTrendingHashtagChameleonConfig;
import com.linkedin.voyager.growth.launchpad.dash.impl.monitoring.GroupTrendingHashtagChameleonServiceCounterSensor;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;
import org.apache.commons.lang3.EnumUtils;
import org.jetbrains.annotations.Nullable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import static com.linkedin.voyager.growth.launchpad.dash.impl.helpers.groups.GroupTrendingHashtagChameleonConstants.*;


/**
 * Service to get Group Trending Hashtag config from Chameleon
 */
public class GroupTrendingHashtagChameleonService extends ChameleonService {
  private static final Logger LOG = LoggerFactory.getLogger(GroupTrendingHashtagChameleonService.class);
  private static final String NAME = "GroupTrendingHashtagChameleonService";
  public static final SystemImageName DEFAULT_SYSTEM_IMAGE = SystemImageName.ILL_SPT_MAIN_COWORKERS_4_SMALL;

  private final RenderModelBuilderFactory renderModelBuilderFactory;
  private final GroupTrendingHashtagChameleonServiceCounterSensor groupTrendingHashtagChameleonServiceCounterSensor;
  private final VoyagerLixServiceSync lixServiceSync;

  // TODO SEG-16762 Replace LaunchpadCardsGroupConfigFallback with GroupTrendingHashtagChameleonConfigFallback
  public GroupTrendingHashtagChameleonService(ConfigPipelineMgr configPipelineManager, CurrentRequestService currentRequestService,
      VoyagerLixServiceSync lixServiceSync, RequestLocaleService requestLocaleService,
      VoyagerMemberFinder voyagerMemberFinder,
      GroupTrendingHashtagChameleonServiceCounterSensor groupTrendingHashtagChameleonServiceCounterSensor,
      RenderModelBuilderFactory renderModelBuilderFactory) {
    super(configPipelineManager, currentRequestService, requestLocaleService, voyagerMemberFinder, groupTrendingHashtagChameleonServiceCounterSensor);
    this.lixServiceSync = lixServiceSync;
    this.groupTrendingHashtagChameleonServiceCounterSensor = groupTrendingHashtagChameleonServiceCounterSensor;
    this.renderModelBuilderFactory = renderModelBuilderFactory;
  }

  public String getName() {
    return NAME;
  }

  private Optional<Urn> getGroupTrendingHashtagConfigTypeUrn() {
    return Optional.of(UrnHelpers.createFromString(GROUP_TRENDING_HASHTAG_CONFIG_TYPE_URN));
  }

  /**
   * Fetch Chameleon config as the List of GroupTrendingHashtagChameleonConfig
   * @param groupId - groupId to fetch the corresponding GroupTrendingHashtag config
   * @return GroupTrendingHashtagChameleonConfig
   */
  public List<GroupTrendingHashtagChameleonConfig> fetchGroupTrendingHashtags(Long groupId) {
    // Create a map of input params to chameleon
    Map<String, String> configParams = new HashMap<>();
    configParams.put(PARAM_GROUP_ID, PARAM_GROUP_ID_VALUE_PREFIX + groupId);

    // Monitoring
    groupTrendingHashtagChameleonServiceCounterSensor.increment(String.valueOf(groupId), getName(),
        GroupTrendingHashtagChameleonServiceCounterSensor.Attribute.GROUP_TRENDING_HASHTAG_CHAMELEON_CONFIG_REQUEST);

    List<ChameleonConfig> chameleonConfigs = new ArrayList<>();
    try {
      chameleonConfigs = getConfigsFromChameleon(getGroupTrendingHashtagConfigTypeUrn().get(), ImmutableMap.copyOf(configParams));
    } catch (Exception ex) {
      LOG.error("Chameleon group config request throw exception for groupId: {} with exception: {} ",
          groupId, ex.getMessage());
      groupTrendingHashtagChameleonServiceCounterSensor.increment(String.valueOf(groupId), getName(),
          GroupTrendingHashtagChameleonServiceCounterSensor.Attribute.GROUP_TRENDING_HASHTAG_CHAMELEON_CONFIG_ERROR);
    }

    if (chameleonConfigs.isEmpty()) {
      // TODO SEG-16762 Add GroupTrendingHashtag Fallback logic here
      LOG.warn("No chameleon configs found for groupId:" + groupId);
      groupTrendingHashtagChameleonServiceCounterSensor.increment(String.valueOf(groupId), getName(),
          GroupTrendingHashtagChameleonServiceCounterSensor.Attribute.GROUP_TRENDING_HASHTAG_CHAMELEON_CONFIG_NOT_FOUND);
    }

    if (chameleonConfigs.size() > 1) {
      LOG.warn("Multiple chameleon configs found for groupId:" + groupId + ". Only 1st config will be used.");
      groupTrendingHashtagChameleonServiceCounterSensor.increment(String.valueOf(groupId), getName(),
          GroupTrendingHashtagChameleonServiceCounterSensor.Attribute.GROUP_TRENDING_HASHTAG_CHAMELEON_CONFIG_DUPLICATE);
    }

    // Convert chameleon configs to GroupTrendingHashtagChameleonConfig object.
    return chameleonConfigs.stream()
        .findFirst()
        .map(chameleonConfig -> {
          Optional<ConfigTargetingInfo> maybeTargetingInfo =
              Optional.ofNullable(chameleonConfig.getTrackingInfo().getConfigTargetingInfo());
          fireChameleonEvent(chameleonConfig, maybeTargetingInfo);
          return buildGroupTrendingHashtagConfigList(chameleonConfig);
        }).orElseGet(Collections::emptyList);
  }

  private List<GroupTrendingHashtagChameleonConfig> buildGroupTrendingHashtagConfigList(ChameleonConfig chameleonConfig) {
    ChameleonPayloadObject chameleonPayloadObject = new ChameleonPayloadObject(chameleonConfig);
    String key = GROUP_TRENDING_HASHTAG_CONFIG_HASHTAG_CARDS;

    return chameleonPayloadObject.getChameleonPayloadObjectList(Collections.singletonList(key)).stream()
        .map(payloadObject -> buildGroupTrendingHashtagConfig(chameleonConfig, key, payloadObject))
        .filter(Objects::nonNull).collect(Collectors.toList());
  }

  @Nullable
  private GroupTrendingHashtagChameleonConfig buildGroupTrendingHashtagConfig(
      ChameleonConfig chameleonConfig,
      String key,
      ChameleonPayloadObject chameleonPayloadObject) {
    GroupTrendingHashtagChameleonConfig config = new GroupTrendingHashtagChameleonConfig();
    try {
      getPlainString(chameleonConfig, GROUP_TRENDING_HASHTAG_CONFIG_HASHTAG, chameleonPayloadObject,
          GroupTrendingHashtagChameleonServiceCounterSensor.CHAMELEON_GROUP_ID_TYPE, key)
          .ifPresent(config::setHashtag);
      getI18NStringContent(chameleonConfig, GROUP_TRENDING_HASHTAG_CONFIG_PROMPT, chameleonPayloadObject,
          GroupTrendingHashtagChameleonServiceCounterSensor.CHAMELEON_GROUP_ID_TYPE, key)
          .ifPresent(config::setPrompt);
      getPlainStringContent(chameleonConfig, GROUP_TRENDING_HASHTAG_CONFIG_CTA, chameleonPayloadObject,
          GroupTrendingHashtagChameleonServiceCounterSensor.CHAMELEON_GROUP_ID_TYPE, key)
          .ifPresent(ctaValueInput -> {
            config.setCta(ctaValueInput);
          });
      getPlainStringContent(chameleonConfig, GROUP_TRENDING_HASHTAG_CONFIG_CARD_IMAGE, chameleonPayloadObject,
          GroupTrendingHashtagChameleonServiceCounterSensor.CHAMELEON_GROUP_ID_TYPE, key)
          .ifPresent(systemImageNameValueInput -> {
            SystemImageName systemImageName = EnumUtils.getEnumIgnoreCase(
                SystemImageName.class, systemImageNameValueInput, DEFAULT_SYSTEM_IMAGE);
            config.setCardImage(systemImageName);
          });
      return config;
    } catch (Exception e) {
      LOG.error("Not able to get GroupTrendingHashtag config for cardKey {}: , with exception {}", key, e);
    }
    return config;
  }
}