package com.linkedin.voyager.growth.launchpad.dash.impl.services;

import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableMap;
import com.linkedin.chameleon.client.api.ConfigPipelineMgr;
import com.linkedin.chameleon.client.impl.pipelines.ConfigQuery;
import com.linkedin.chameleon.client.impl.pipelines.ContentKey;
import com.linkedin.chameleon.client.impl.pipelines.genericpipeline.ChameleonConfig;
import com.linkedin.common.urn.MemberUrn;
import com.linkedin.common.urn.Urn;
import com.linkedin.learning.common.helpers.LocaleHelper;
import com.linkedin.pemberly.api.server.context.CurrentRequestService;
import com.linkedin.pemberly.api.server.context.RequestFacade;
import com.linkedin.pemberly.api.server.context.RequestLocaleService;
import com.linkedin.voyager.dash.common.SystemImageName;
import com.linkedin.voyager.common.core.api.helpers.VoyagerMemberFinder;
import com.linkedin.voyager.common.core.api.services.VoyagerLixServiceSync;
import com.linkedin.voyager.common.test.helpers.test.VoyagerAsyncTaskUnitTest;
import com.linkedin.voyager.growth.launchpad.dash.impl.helpers.groups.GroupTrendingHashtagChameleonConfig;
import com.linkedin.voyager.growth.launchpad.dash.impl.monitoring.GroupTrendingHashtagChameleonServiceCounterSensor;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import org.jooq.tools.StringUtils;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.testng.annotations.Test;

import static com.linkedin.voyager.growth.launchpad.dash.impl.helpers.groups.GroupTrendingHashtagChameleonConstants.*;
import static org.mockito.Mockito.*;


/**
 * Unit test for {@link GroupTrendingHashtagChameleonServiceTest}.
 * */
public class GroupTrendingHashtagChameleonServiceTest extends VoyagerAsyncTaskUnitTest {
  private static final MemberUrn MEMBER_URN = new MemberUrn(100L);
  private static final Locale US_LOCALE = Locale.US;
  private static final Map<String, String> CHAMELEON_REQUEST_HEADERS = ImmutableMap.of("x-li-chameleon-ec-test_id", "1");

  @Test(description = "Test fetch group-trending-hashtag config and parsing logic")
  public void testFetchGroupTrendingHashtags() throws Exception {
    Mocks mocks = new Mocks();
    MockData mockData = new MockData();

    Urn chameleonConfigUrn = new Urn(GROUP_TRENDING_HASHTAG_CONFIG_TYPE_URN);
    JSONObject parentJsonObject = readMockData();

    ChameleonConfig config = new ChameleonConfig(chameleonConfigUrn, parentJsonObject.toJSONString());
    Map<String, Object> configParams =
        ImmutableMap.of(PARAM_GROUP_ID, PARAM_GROUP_ID_VALUE_PREFIX + mockData.groupId);
    when(mocks.configPipelineManager.getConfigsSync(any(ConfigQuery.class), eq(MEMBER_URN), eq(configParams), any(),
        eq(CHAMELEON_REQUEST_HEADERS), anyBoolean()))
        .thenReturn(ImmutableList.of(config));

    for (String key : mockData.chameleonKeyToValueMap.keySet()) {
      if (key.startsWith("urn")) {
        Urn objectUrn = new Urn(key);
        ContentKey contentKey = new ContentKey(objectUrn, LocaleHelper.toLocale(Locale.US));
        ChameleonConfig contentConfig = new ChameleonConfig(objectUrn, mockData.chameleonKeyToValueMap.get(key));
        when(mocks.configPipelineManager.getContentConfigSync(eq(contentKey), any(Urn.class), any(Optional.class), any(), any(), any(), anyBoolean()))
            .thenReturn(contentConfig);
      }
    }

    List<GroupTrendingHashtagChameleonConfig>
        result = mocks.service.fetchGroupTrendingHashtags(mockData.groupId);

    assertThat(result.get(0).getHashtag()).isEqualTo(mockData.expectedHashtag);
    assertThat(result.get(0).getPrompt()).isEqualTo(mockData.expectedPrompt);
    assertThat(result.get(0).getCta()).isEqualTo(mockData.expectedCta);
    assertThat(result.get(0).getCardImage().toString()).isEqualTo(mockData.expectedCardImage.toString());
  }

  private JSONObject readMockData() throws IOException, ParseException {
    return readMockData(StringUtils.EMPTY);
  }

  /**
   * Need both ways to open the file since IntelliJ and Gradle behave differently.
   */
  private JSONObject readMockData(String suffix) throws IOException, ParseException {

    JSONParser parser = new JSONParser();
    try {
      // use path without launchpad-dash-impl
      String dir = System.getProperty("user.dir")
          + "/src/test/java/com/linkedin/voyager/growth/launchpad/dash/impl/services/groupTrendingHashtagChameleonConfigMockData"
          + suffix + ".json";
      FileReader fileReader = new FileReader(dir);
      return (org.json.simple.JSONObject) parser.parse(fileReader);
    } catch (FileNotFoundException e) {
      // use path with launchpad-dash-impl
      String dir = System.getProperty("user.dir")
          + "/launchpad-dash-impl/src/test/java/com/linkedin/voyager/growth/launchpad/dash/impl/services/groupTrendingHashtagChameleonConfigMockData"
          + suffix + ".json";
      FileReader fileReader = new FileReader(dir);
      return (org.json.simple.JSONObject) parser.parse(fileReader);
    }
  }

  private static final class Mocks {
    private final GroupTrendingHashtagChameleonService service;
    @Mock
    private ConfigPipelineMgr configPipelineManager;
    @Mock private CurrentRequestService currentRequestService;
    @Mock private VoyagerLixServiceSync lixServiceSync;
    @Mock private VoyagerMemberFinder memberFinder;
    @Mock private RequestLocaleService requestLocaleService;
    @Mock private GroupTrendingHashtagChameleonServiceCounterSensor launchpadChameleonServiceCounterSensor;

    private Mocks() {
      MockitoAnnotations.openMocks(this);

      when(memberFinder.getMemberUrn()).thenReturn(MEMBER_URN);
      when(requestLocaleService.getLocale()).thenReturn(US_LOCALE);
      when(currentRequestService.getCurrentRequest()).thenReturn(mock(RequestFacade.class));
      when(currentRequestService.getCurrentRequest().getHeaders()).thenReturn(CHAMELEON_REQUEST_HEADERS);

      service = new GroupTrendingHashtagChameleonService(configPipelineManager, currentRequestService, lixServiceSync, requestLocaleService,
          memberFinder, launchpadChameleonServiceCounterSensor);
    }
  }

  private static final class MockData {
    Long groupId = Long.valueOf("12345");
    String expectedHashtag = "#FirstHashtag";
    String expectedPrompt = "View your posts";
    Optional<String> expectedCta = Optional.of("viewPosts");
    Optional<SystemImageName> expectedCardImage = Optional.of(SystemImageName.ILL_SPT_MAIN_COWORKERS_4_SMALL);

    /*
     * Keys are copied from curli output of chameleon call.
     */
    Map<String, String> chameleonKeyToValueMap = ImmutableMap.<String, String>builder()
        .put("#FirstHashtag", expectedHashtag)
        .put("urn:li:chameleon:language-pack:voyager-api:group-trending-hashtag-prompt:1662514814632-mpykbrfukki", expectedPrompt)
        .put("urn:li:chameleon:external:voyager-api:group-trending-hashtag-cta:viewPosts", expectedCta.get())
        .put("urn:li:chameleon:external:voyager-api:group-trending-hashtag-cardImage:systemImageName",
            String.valueOf(expectedCardImage))
        .build();
  }
}