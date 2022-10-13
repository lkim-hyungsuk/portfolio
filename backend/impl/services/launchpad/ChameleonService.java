/**
 * ## Summary
 * We would like to fetch Chameleon configs from Launchpad Custom Card
 * Formatter. Mini-RFC is here: (internal)
 * The new Chameleon schema has been generated per this JIRA ticket: 
 * https://jira01.corp.linkedin.com:8443/browse/SEG-16688
 * 
 * ## Details
 * (add) ChameleonService.java
 * (add) ChameleonCounterService
 */
package com.linkedin.voyager.growth.launchpad.dash.impl.services;

import com.google.common.annotations.VisibleForTesting;
import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableMap;
import com.linkedin.chameleon.client.api.ConfigPipelineMgr;
import com.linkedin.chameleon.client.impl.ConfigTargetingInfo;
import com.linkedin.chameleon.client.impl.pipelines.ConfigPipelineUtils;
import com.linkedin.chameleon.client.impl.pipelines.ConfigQuery;
import com.linkedin.chameleon.client.impl.pipelines.ContentKey;
import com.linkedin.chameleon.client.impl.pipelines.genericpipeline.ChameleonConfig;
import com.linkedin.chameleon.client.impl.pipelines.genericpipeline.ChameleonPayloadObject;
import com.linkedin.common.Locale;
import com.linkedin.common.LocaleUtil;
import com.linkedin.common.urn.MultiProductUrn;
import com.linkedin.common.urn.Urn;
import com.linkedin.featurecustomization.CustomizationConfigMetadata;
import com.linkedin.lix.dsl.v2.api.LixDslFactory;
import com.linkedin.pemberly.api.server.context.CurrentRequestService;
import com.linkedin.pemberly.api.server.context.RequestLocaleService;
import com.linkedin.voyager.common.core.api.helpers.OptionalHelpers;
import com.linkedin.voyager.common.core.api.helpers.VoyagerMemberFinder;
import com.linkedin.voyager.growth.launchpad.dash.impl.monitoring.ChameleonServiceCounterSensor;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


/**
 * Service to get Chameleon config
 * */
abstract class ChameleonService {
  private static final Logger LOG = LoggerFactory.getLogger(ChameleonService.class);
  private static final String CHAMELEON_PREVIEW_HEADER_KEY = "x-li-chameleon-mt-preview";
  private static final String CHAMELEON_PREVIEW_DEFAULT_FALLBACK_HEADER = "x-li-chameleon-preview-default-fallback";
  public static final String PARAM_LOCALE = "locale";

  protected final ConfigPipelineMgr configPipelineManager;
  protected final VoyagerMemberFinder voyagerMemberFinder;
  protected final RequestLocaleService requestLocaleService;
  protected final CurrentRequestService currentRequestService;
  protected final ChameleonServiceCounterSensor chameleonServiceCounterSensor;

  /**
   * Define the name of the service that extends ChameleonService
   * Used for Error logging
   * */
  public abstract String getName();

  protected ChameleonService(
      ConfigPipelineMgr configPipelineManager,
      CurrentRequestService currentRequestService,
      RequestLocaleService requestLocaleService,
      VoyagerMemberFinder voyagerMemberFinder,
      ChameleonServiceCounterSensor chameleonServiceCounterSensor) {
    this.configPipelineManager = configPipelineManager;
    this.currentRequestService = currentRequestService;
    this.requestLocaleService = requestLocaleService;
    this.voyagerMemberFinder = voyagerMemberFinder;
    this.chameleonServiceCounterSensor = chameleonServiceCounterSensor;
  }

  protected List<ChameleonConfig> getConfigsFromChameleon(Urn configTypeUrn, Map<String, Object> configParams) {
    String configFormat = ConfigPipelineUtils.getConfigFormatFromConfigTypeUrn(configTypeUrn);
    MultiProductUrn multiProductUrn = ConfigPipelineUtils.getMultiProductUrnFromConfigTypeUrn(configTypeUrn);
    ConfigQuery configQuery = new ConfigQuery(configFormat, multiProductUrn);
    Map<String, String> requestHeaders = this.currentRequestService.getCurrentRequest().getHeaders();
    if (requestHeaders.containsKey(CHAMELEON_PREVIEW_HEADER_KEY)) {
      requestHeaders.put(CHAMELEON_PREVIEW_DEFAULT_FALLBACK_HEADER, "true");
    }
    return configPipelineManager
        .getConfigsSync(configQuery, voyagerMemberFinder.getMemberUrn(), configParams, null,
            requestHeaders, false);
  }

  @VisibleForTesting
  protected Optional<String> getI18NStringContent(ChameleonConfig config, String fieldToGet, ChameleonPayloadObject payloadObject,
      String keyType, String key) {
    try {
      Locale locale = LocaleUtil.fromJavaLocale(requestLocaleService.getLocale());
      ImmutableMap<String, Object> i18nKeyParams = new ImmutableMap.Builder<String, Object>()
          .put(PARAM_LOCALE, locale)
          .build();
      ContentKey contentKey;
      if (!payloadObject.hasChameleonContentUrn(ImmutableList.of(fieldToGet))) {
        // This optional field is not present in the data, returning empty
        return Optional.empty();
      }
      contentKey = new ContentKey(payloadObject.getChameleonContentUrn(ImmutableList.of(fieldToGet)), locale);
      ChameleonConfig objectConfig = configPipelineManager.getContentConfigSync(contentKey, voyagerMemberFinder.getMemberUrn(),
          config.getIdOption(), i18nKeyParams, LixDslFactory.createUserContext(), Collections.emptyMap(), false);
      ChameleonPayloadObject object = new ChameleonPayloadObject(objectConfig);

      return Optional.of(object.getString(Collections.emptyList()));
    } catch (Exception e) {
      LOG.error("Not able to resolve I18N string for field " + fieldToGet + " in config " + config + "in a service " + getName(), e);
      chameleonServiceCounterSensor.increment(
          ChameleonServiceCounterSensor.Attribute.CHAMELEON_I18N_RESOLVE_FAILED, keyType, key, fieldToGet);
      return Optional.empty();
    }
  }

  protected void fireChameleonEvent(ChameleonConfig chameleonConfig, Optional<ConfigTargetingInfo> maybeTargetingInfo) {
    Optional<CustomizationConfigMetadata> maybeMetadata = chameleonConfig.getConfigMetadataOption();
    if (OptionalHelpers.allPresent(maybeMetadata, maybeTargetingInfo)) {
      // Manually fire lix tracking event
      configPipelineManager.fireAllTracking(chameleonConfig.getTrackingInfo());
    }
  }

  protected Optional<String> getPlainStringContent(ChameleonConfig config, String fieldToGet,
      ChameleonPayloadObject payloadObject, String keyType, String key) {
    try {
      List<String> fieldsToGet = ImmutableList.of(fieldToGet);

      if (payloadObject.hasString(fieldsToGet)) {
        return Optional.ofNullable(new ContentKey(payloadObject.getChameleonContentUrn(ImmutableList.of(fieldToGet)).toString()).getKey());
      }
      return Optional.empty();
    } catch (Exception e) {
      LOG.warn("Not able to resolve plain string content for field " + fieldToGet + " in config " + config + "in a service " + getName(), e);
      chameleonServiceCounterSensor.increment(
          ChameleonServiceCounterSensor.Attribute.CHAMELEON_STRING_CONTENT_RESOLVE_FAILED, keyType, key, fieldToGet);
      return Optional.empty();
    }
  }

  protected Optional<String> getPlainString(ChameleonConfig config, String fieldToGet,
      ChameleonPayloadObject payloadObject, String cardType, String cardKey) {
    try {
      List<String> fieldsToGet = ImmutableList.of(fieldToGet);

      if (payloadObject.hasString(fieldsToGet)) {
        return Optional.ofNullable(payloadObject.getString(Collections.singletonList(fieldToGet)));
      }
      return Optional.empty();
    } catch (Exception e) {
      LOG.warn("Not able to resolve plain string for field " + fieldToGet + " in config " + config + "in a service " + getName(), e);
      chameleonServiceCounterSensor.increment(
          ChameleonServiceCounterSensor.Attribute.CHAMELEON_STRING_RESOLVE_FAILED,
          cardType, cardKey, fieldToGet);
      return Optional.empty();
    }
  }
}