package com.linkedin.voyager.growth.launchpad.dash.factory.monitoring;

import com.linkedin.util.factory.Scope;
import com.linkedin.util.factory.annotations.Import;
import com.linkedin.util.factory.cfg.ConfigView;
import com.linkedin.voyager.common.core.api.monitoring.Counter;
import com.linkedin.voyager.common.core.factory.monitoring.FrequencyCounterFactory;
import com.linkedin.voyager.common.core.factory.services.VoyagerClientInfoServiceFactory;
import com.linkedin.voyager.growth.launchpad.dash.factory.Scopes;
import com.linkedin.voyager.growth.launchpad.dash.impl.monitoring.GroupTrendingHashtagChameleonServiceCounterSensor;


public class GroupTrendingHashtagChameleonServiceCounterSensorFactory
    extends FrequencyCounterFactory<GroupTrendingHashtagChameleonServiceCounterSensor> {
  public static final Scope SCOPE = Scopes.LAUNCHPAD_DASH.child("groupTrendingHashtagChameleonServiceCounterSensor");

  @Override
  @Import(clazz = VoyagerClientInfoServiceFactory.class)
  protected GroupTrendingHashtagChameleonServiceCounterSensor createSensor(Counter frequencyCounter, ConfigView view) {
    return new GroupTrendingHashtagChameleonServiceCounterSensor(frequencyCounter, getBean(VoyagerClientInfoServiceFactory.class));
  }
}