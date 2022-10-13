package controllers;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionStage;
import javax.inject.Inject;
import javax.inject.Singleton;
import com.linkedin.data.template.SetMode;
import com.linkedin.guest.play.frontend.views.NodeGlimmerViewSpec;
import com.linkedin.guest.play.frontend.views.ViewFactory;
import com.linkedin.playplugins.security.j.Authenticated;
import com.linkedin.ssr.client.MemberToGuestInvitationsQuery;
import com.linkedin.ssr.client.MemberToGuestInvitationsQueryVariables;
import com.linkedin.ssr.client.SsrDataServiceClient;
import helpers.RedirectHelper;
import play.mvc.Result;
import play.mvc.Controller;
import models.OnboardingStep;
import models.OnboardingStepPageDataReader;
import play.libs.concurrent.HttpExecutionContext;
import services.ConfigService;
import urls.UrlHelper;


@Authenticated
@Singleton 
public class MemberToGuestInvitationsController extends Controller {
  static final NodeGlimmerViewSpec MEMBER_TO_GUEST_INVITATIONS_SPEC = new NodeGlimmerViewSpec("MemberToGuestInvitations");

  private final ViewFactory _viewFactory;
  private final ConfigService _configService;
  private final UrlHelper _urlHelper;
  private final SsrDataServiceClient _ssrDataServiceClient;
  private final HttpExecutionContext _httpExecutionContext;


  @Inject
  public MemberToGuestInvitationsController(
    ViewFactory viewFactory,
    ConfigService configService,
    UrlHelper urlHelper,
    SsrDataServiceClient ssrDataServiceClient,
    HttpExecutionContext httpExecutionContext
  ) {
    _viewFactory = viewFactory;
    _configService = configService;
    _urlHelper = urlHelper;
    _ssrDataServiceClient = ssrDataServiceClient;
    _httpExecutionContext = httpExecutionContext;
  }

  public CompletionStage<Result> render(final String currentStep, final String stepOverride) {
    MemberToGuestInvitationsQueryVariables memberToGuestInvitationsQueryVariables = new MemberToGuestInvitationsQueryVariables()
    .setSource(_configService.getOnboardingAppName())
    .setCurrentStep(currentStep, SetMode.REMOVE_IF_NULL)
    .setStepOverride(stepOverride, SetMode.REMOVE_IF_NULL);

    MemberToGuestInvitationsQuery memberToGuestInvitationsQuery = new MemberToGuestInvitationsQuery(memberToGuestInvitationsQueryVariables);
    
    return _ssrDataServiceClient.fetchQueryResult(memberToGuestInvitationsQuery)
        .thenComposeAsync((pageData) -> {
          final OnboardingStepPageDataReader pageDataReader = new OnboardingStepPageDataReader(pageData);
          if (!pageDataReader.isValidOnboardingStep(OnboardingStep.MEMBER_TO_GUEST_INVITATIONS)) {
            return CompletableFuture.completedFuture(redirect(RedirectHelper.getRedirectPath(pageDataReader, _urlHelper)));
          }
      pageData.put("source", _configService.getOnboardingAppName());
      return _viewFactory.getView(MEMBER_TO_GUEST_INVITATIONS_SPEC).render(pageData);
    }, _httpExecutionContext.current());
  }
}