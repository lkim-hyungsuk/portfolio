package com.linkedin.voyager.growth.launchpad.dash.factory.services;

import com.linkedin.chameleon.client.factory.ConfigPipelineMgrFactory;
import com.linkedin.pemberly.api.server.context.CurrentRequestServiceFactory;
import com.linkedin.pemberly.api.server.context.RequestLocaleServiceFactory;
import com.linkedin.util.factory.Scope;
import com.linkedin.util.factory.SimpleSingletonFactory;
import com.linkedin.util.factory.annotations.Import;
import com.linkedin.util.factory.cfg.ConfigView;
import com.linkedin.voyager.common.core.factory.helpers.VoyagerMemberFinderFactory;
import com.linkedin.voyager.common.core.factory.services.VoyagerLixServiceSyncFactoryV2;
import com.linkedin.voyager.common.dash.factory.infra.helpers.RenderModelBuilderFactoryFactory;
import com.linkedin.voyager.growth.launchpad.dash.factory.Scopes;
import com.linkedin.voyager.growth.launchpad.dash.factory.monitoring.GroupTrendingHashtagChameleonServiceCounterSensorFactory;
import com.linkedin.voyager.growth.launchpad.dash.impl.services.GroupTrendingHashtagChameleonService;


public class GroupTrendingHashtagChameleonServiceFactory
    extends SimpleSingletonFactory<GroupTrendingHashtagChameleonService> {
  private static final Scope SCOPE = Scopes.LAUNCHPAD_DASH.child("groupTrendingHashtagChameleonService");

  @Import(clazz = ConfigPipelineMgrFactory.class)
  @Import(clazz = CurrentRequestServiceFactory.class)
  @Import(clazz = VoyagerLixServiceSyncFactoryV2.class)
  @Import(clazz = RequestLocaleServiceFactory.class)
  @Import(clazz = VoyagerMemberFinderFactory.class)
  @Import(clazz = GroupTrendingHashtagChameleonServiceCounterSensorFactory.class)
  @Import(clazz = RenderModelBuilderFactoryFactory.class)
  @Override
  protected GroupTrendingHashtagChameleonService createInstance(ConfigView view) {
    return new GroupTrendingHashtagChameleonService(
        getBean(ConfigPipelineMgrFactory.class),
        getBean(CurrentRequestServiceFactory.class),
        getBean(VoyagerLixServiceSyncFactoryV2.class),
        getBean(RequestLocaleServiceFactory.class),
        getBean(VoyagerMemberFinderFactory.class),
        getBean(GroupTrendingHashtagChameleonServiceCounterSensorFactory.class),
        getBean(RenderModelBuilderFactoryFactory.class));
  }
}