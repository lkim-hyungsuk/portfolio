package com.linkedin.voyager.growth.launchpad.dash.impl.formatters.evtgroups;

import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableMap;
import com.linkedin.common.UrnArray;
import com.linkedin.common.url.Url;
import com.linkedin.common.urn.GroupUrn;
import com.linkedin.launchpad.Attribute;
import com.linkedin.launchpad.AttributeArray;
import com.linkedin.launchpad.LaunchpadCard;
import com.linkedin.pemberly.api.server.lix.LixService;
import com.linkedin.pemberly.api.server.url.UrlService;
import com.linkedin.playmt.restliplugin.server.FabricChecker;
import com.linkedin.urls_private.url.aliases.NeptuneUrlAliases;
import com.linkedin.voyager.common.core.api.helpers.VoyagerMemberFinder;
import com.linkedin.voyager.common.core.api.services.VoyagerClientInfoService;
import com.linkedin.voyager.common.dash.api.growth.services.BaseAmbryService;
import com.linkedin.voyager.common.dash.api.infra.formatters.tracking.TrackingKeyFormatter;
import com.linkedin.voyager.common.dash.api.infra.helpers.RenderModelBuilderFactory;
import com.linkedin.voyager.common.dash.api.infra.services.VoyagerLocalizationService;
import com.linkedin.voyager.common.test.helpers.test.VoyagerAsyncTaskUnitTest;
import com.linkedin.voyager.dash.common.SystemImageName;
import com.linkedin.voyager.dash.common.image.ImageViewModel;
import com.linkedin.voyager.dash.common.text.TextViewModel;
import com.linkedin.voyager.dash.common.tracking.PageKey;
import com.linkedin.voyager.dash.launchpad.LaunchpadContext;
import com.linkedin.voyager.dash.launchpad.LaunchpadCta;
import com.linkedin.voyager.dash.launchpad.LaunchpadCtaStyle;
import com.linkedin.voyager.dash.launchpad.PresentationStyle;
import com.linkedin.voyager.growth.launchpad.dash.impl.common.tracking.NeptunePageKeyConstants;
import com.linkedin.voyager.growth.launchpad.dash.impl.common.tracking.VoyagerPageKeyConstants;
import com.linkedin.voyager.growth.launchpad.dash.impl.helpers.LaunchpadCardWrapper;
import com.linkedin.voyager.growth.launchpad.dash.impl.helpers.LaunchpadDecorationUrns;
import com.linkedin.voyager.growth.launchpad.dash.impl.helpers.groups.GroupTrendingHashtagChameleonConfig;
import com.linkedin.voyager.growth.launchpad.dash.impl.services.FakeLaunchpadDashLocalizationService;
import com.linkedin.voyager.growth.launchpad.dash.impl.services.GroupTrendingHashtagChameleonService;
import com.linkedin.voyager.growth.launchpad.dash.impl.test.builders.BackendLaunchpadCardBuilder;
import com.linkedin.voyager.growth.launchpad.dash.impl.test.builders.TextViewModelTestHelper;
import java.util.Map;
import java.util.Optional;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.testng.annotations.Test;
import org.xeril.wafwk.gui.url.UrlAliasParameter;

import static org.mockito.Mockito.*;


public class GroupHashtagPromptCardFormatterTest extends VoyagerAsyncTaskUnitTest {

  @Test
  public void testGetTitle() {
    Mocks mocks = new Mocks();
    MockData mockData = new MockData();
    Stubbing.stubGroupTrendingHashtagChameleonService(mocks, mockData);
    TextViewModel actual = await(mocks.groupHashtagPromptCardFormatter.getTitle(mockData.launchpadCardWrapperWithAttributes));
    assertThat(actual.getText()).isEqualTo(mockData.hashtag);
  }

  @Test
  public void testGetSubtitle() {
    Mocks mocks = new Mocks();
    MockData mockData = new MockData();
    Stubbing.stubGroupTrendingHashtagChameleonService(mocks, mockData);
    Optional<TextViewModel> actual = await(mocks.groupHashtagPromptCardFormatter.getSubtitle(mockData.launchpadCardWrapperWithAttributes));
    assertThat(actual.get().getText()).isEqualTo(mockData.prompt);
  }

  @Test
  public void testGetBackgroundImage() {
    Mocks mocks = new Mocks();
    MockData mockData = new MockData();
    Stubbing.stubGroupTrendingHashtagChameleonService(mocks, mockData);
    Optional<ImageViewModel> actual = await(mocks.groupHashtagPromptCardFormatter.getBackgroundImage(mockData.launchpadCardWrapperWithAttributes));
    assertThat(
        actual.get().getAttributes().get(0).getDetailDataUnion().getSystemImage().name()
    ).isEqualTo(mockData.backgroundImage.name());
  }

  @Test
  public void testGetBackgroundImageWithDefault() {
    Mocks mocks = new Mocks();
    MockData mockData = new MockData();
    Stubbing.stubGroupTrendingHashtagChameleonService(mocks, mockData);
    Optional<ImageViewModel> actual = await(mocks.groupHashtagPromptCardFormatter.getBackgroundImage(mockData.launchpadCardWrapperWithEmptyImage));
    assertThat(
        actual.get().getAttributes().get(0).getDetailDataUnion().getSystemImage().name()
    ).isEqualTo(mockData.defaultBackgroundImage.name());
  }

//  launchpadCardWithEmptyImage
  @Test
  public void testPopulateLaunchpadCta() {
    Mocks mocks = new Mocks();
    MockData mockData = new MockData();
    Stubbing.stubUrlService(mocks, mockData);
    Stubbing.stubGroupTrendingHashtagChameleonService(mocks, mockData);
    LaunchpadCta actual = await(mocks.groupHashtagPromptCardFormatter.populateLaunchpadCta(
        LaunchpadContext.FEED, mockData.ctaType, mockData.launchpadCta, mockData.launchpadCardWrapperWithAttributes));
    assertThat(actual).isEqualTo(mockData.launchpadCta);
  }

  @Test
  public void testGetDeeplinkUrl() {
    Mocks mocks = new Mocks();
    MockData mockData = new MockData();
    Stubbing.stubUrlService(mocks, mockData);
    Url actual = mocks.groupHashtagPromptCardFormatter.getDeeplinkUrl(mockData.hashtag, mockData.trackingToken);
    assertThat(actual.toString()).isEqualTo(mockData.formattedDeeplinkUrl);
  }

  @Test
  public void testGetPageKey() {
    Mocks mocks = new Mocks();
    MockData mockData = new MockData();
    Stubbing.stubTrackingKeyFormatter(mocks, mockData);
    PageKey actual = mocks.groupHashtagPromptCardFormatter.getPageKey(false);
    assertThat(actual.getPageKey()).isEqualTo(mockData.voyagerPageKey);
  }

  private static final class Mocks {
    @Mock UrlService urlService;
    @Mock FabricChecker fabricChecker;
    @Mock BaseAmbryService ambryService;
    @Mock VoyagerMemberFinder voyagerMemberFinder;
    @Mock LixService lixService;
    @Mock TrackingKeyFormatter trackingKeyFormatter;
    @Mock GroupTrendingHashtagChameleonService groupTrendingHashtagChameleonService;
    VoyagerClientInfoService clientInfoServiceStub;
    VoyagerLocalizationService voyagerLocalizationService = FakeLaunchpadDashLocalizationService.getInstance();
    RenderModelBuilderFactory renderModelBuilderFactory = new RenderModelBuilderFactory();

    private final GroupHashtagPromptCardFormatter groupHashtagPromptCardFormatter;
    Mocks() {
      Map<String, Integer> cardTypeToIndexMap = ImmutableMap.of(
          "evtgroups__actions__start_a_post_1", 0,
          "evtgroups__actions__start_a_post_2", 1,
          "evtgroups__actions__start_a_post_3", 2);

      MockitoAnnotations.openMocks(this);
      groupHashtagPromptCardFormatter = new GroupHashtagPromptCardFormatter(fabricChecker, voyagerLocalizationService,
          ambryService, voyagerMemberFinder, urlService, clientInfoServiceStub, lixService,
          renderModelBuilderFactory, trackingKeyFormatter, groupTrendingHashtagChameleonService, cardTypeToIndexMap);
    }
  }

  private static final class MockData {

    private final String hashtag = "latteArt";
    private final String prompt = "sample prompt";
    private final String ctaType = "start_post";
    private final String ctaTitle = "Start a post";
    private final String trackingToken = "tracking token";
    private final String deeplinkUrl = "http://www.linkedin-ei.com/share?text=" + hashtag
        + "&hint=" + ctaTitle + "&trk=" + trackingToken;
    private final String formattedDeeplinkUrl = "http://www.linkedin-ei.com/share?text=%0D%0D" + hashtag
        + "&hint=" + ctaTitle + "&trk=" + trackingToken;
    private final Map<UrlAliasParameter, String> deeplinkParams =
        ImmutableMap.of(NeptuneUrlAliases.NeptuneShare.Parameters.text, hashtag,
            NeptuneUrlAliases.NeptuneShare.Parameters.hint, ctaTitle);
    private final LaunchpadCta launchpadCta = new LaunchpadCta()
        .setCtaStyle(LaunchpadCtaStyle.PRIMARY)
        .setCtaType(ctaType)
        .setCtaTitle(TextViewModelTestHelper.buildTextViewModel(ctaTitle))
        .setPresentationStyle(PresentationStyle.REDIRECT)
        .setDeeplinkUrl(new Url(formattedDeeplinkUrl));
    private final int groupId = 12345;
    private final GroupUrn groupUrn = new GroupUrn(groupId);
    private final Attribute attribute = new Attribute()
        .setType("GROUP_URN")
        .setRelatedEntities(new UrnArray(ImmutableList.of(groupUrn)));
    private final LaunchpadCard launchpadCardWithAttributes =
        BackendLaunchpadCardBuilder.completeAndAttributes(true, new AttributeArray(attribute),
            "evtgroups__actions__start_a_post_1", trackingToken);
    private final LaunchpadCard launchpadCardWithEmptyImage =
        BackendLaunchpadCardBuilder.completeAndAttributes(true, new AttributeArray(attribute),
            "evtgroups__actions__start_a_post_2", trackingToken);
    private final LaunchpadCardWrapper launchpadCardWrapperWithAttributes =
        new LaunchpadCardWrapper(launchpadCardWithAttributes, new LaunchpadDecorationUrns.LaunchpadDecorationUrnsBuilder().build());
    private final LaunchpadCardWrapper launchpadCardWrapperWithEmptyImage =
        new LaunchpadCardWrapper(launchpadCardWithEmptyImage, new LaunchpadDecorationUrns.LaunchpadDecorationUrnsBuilder().build());
    private final String neptunePageKey =
        NeptunePageKeyConstants.LAUNCHPAD_CARD_EVTGROUPS_ACTIONS_PAGE_KEY;
    private final String voyagerPageKey =
        VoyagerPageKeyConstants.LAUNCHPAD_CARD_EVTGROUPS_ACTIONS_PAGE_KEY;
    private final SystemImageName backgroundImage = SystemImageName.ILL_SPT_MAIN_CONVERSATION_SMALL;
    private final SystemImageName defaultBackgroundImage = GroupTrendingHashtagChameleonService.DEFAULT_SYSTEM_IMAGE;

  }

  private static final class Stubbing {
    public static void stubUrlService(Mocks mocks, MockData mockData) {
      when(mocks.urlService.link(NeptuneUrlAliases.NeptuneShare.instance, Optional.of(mockData.trackingToken), mockData.deeplinkParams))
          .thenReturn(mockData.deeplinkUrl);
    }

    public static void stubTrackingKeyFormatter(Mocks mocks, MockData mockData) {
      when(mocks.trackingKeyFormatter.formatPageKey(mockData.neptunePageKey, mockData.voyagerPageKey))
          .thenReturn(new PageKey().setPageKey(mockData.voyagerPageKey));
    }

    public static void stubGroupTrendingHashtagChameleonService(Mocks mocks, MockData mockData) {
      when(mocks.groupTrendingHashtagChameleonService.fetchGroupTrendingHashtags(new Long(mockData.groupId)))
          .thenReturn(ImmutableList.of(
              new GroupTrendingHashtagChameleonConfig()
                  .setHashtag(mockData.hashtag).setPrompt(mockData.prompt).setCardImage(mockData.backgroundImage).setCta(mockData.ctaTitle),
              new GroupTrendingHashtagChameleonConfig()
                  .setHashtag(mockData.hashtag).setPrompt(mockData.prompt),
              new GroupTrendingHashtagChameleonConfig()
                  .setHashtag(mockData.hashtag).setPrompt(mockData.prompt)
          ));
    }
  }
}