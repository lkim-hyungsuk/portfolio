test('Selecting a GFE pill should update queryParam when voyager.web.segments-group-first-experience lix is enabled', async function (assert) {
  assert.expect(7);

  this.setupLixes({
    'voyager.web.segments-group-first-experience': 'enabled',
  });

  await visit('/');

  assert.equal(
    PretenderManager.getMatchedRequests('/voyager/api/groups/updatesV2')
      .length,
    1,
    'It should fire initial call to fetch group updates'
  );

  await click('[data-test-feed__filter-feed-pill="all"]');

  assert.equal(
    (parseQueryString(currentURL()) || {}).shouldShowGroupFeed,
    'false',
    'isToFetchBreakRoom query param does not exist'
  );

  assert.equal(
    getRequestsToFeedUpdates().length,
    1,
    'It should fire 1 call to fetch feed updates when the `All` pill is selected'
  );

  // Navigate away from Feed page then come back
  await click('[data-test-global-nav-link="mynetwork"]');
  await click('[data-test-global-nav-link="feed"]');

  assert.equal(
    (parseQueryString(currentURL()) || {}).shouldShowGroupFeed,
    'false',
    'shouldShowGroupFeed query param does not exist'
  );

  assert.equal(
    getRequestsToFeedUpdates().length,
    2,
    'Calls one more time when coming back to Feeds page'
  );

  await click('[data-test-feed__filter-feed-pill="The Break Room"]');
  assert.equal(
    (parseQueryString(currentURL()) || {}).shouldShowGroupFeed,
    'true',
    'shouldShowGroupFeed query param exists'
  );

  assert.equal(
    PretenderManager.getMatchedRequests('/voyager/api/groups/updatesV2')
      .length,
    2,
    'It should fire 2 calls to fetch groups updates (one initial call and the other when `The Break Room (beta)` pill is selected'
  );
});

// Remove this when clean up lix voyager.web.segments-group-first-experience
test('It should show All posts after refreshing while `All` GFE Pill is selected when voyager.web.segments-group-first-experience lix is enabled', async function (assert) {
  assert.expect(4);

  this.setupLixes({
    'voyager.web.segments-group-first-experience': 'enabled',
  });

  await visit(addQueryParam('/feed', 'shouldShowGroupFeed', false));

  assert
    .dom('[data-test-feed__filter-feed-pill="all"]')
    .hasAttribute('aria-checked', 'true');

  assert.equal(
    PretenderManager.getMatchedRequests('/voyager/api/groups/updatesV2')
      .length,
    0,
    'It should not fire initial call to fetch group updates'
  );

  assert.equal(
    (parseQueryString(currentURL()) || {}).shouldShowGroupFeed,
    'false',
    'shouldShowGroupFeed query param does not exist'
  );

  assert.equal(
    getRequestsToFeedUpdates().length,
    1,
    'It should fire 1 call to fetch feed updates when the `All` pill is selected'
  );
});

// Remove this when clean up lix voyager.web.segments-group-first-experience
test('It should first load users with `All` GFE Pill pre-selected when voyager.web.segments-group-first-experience lix is `enabled:all-feed`', async function (assert) {
  assert.expect(4);

  this.setupLixes({
    'voyager.web.segments-group-first-experience': 'enabled:all-feed',
  });

  await visit('/');

  assert
    .dom('[data-test-feed__filter-feed-pill="all"]')
    .hasAttribute('aria-checked', 'true');

  assert
    .dom('[data-test-feed__filter-feed-pill]:first-child')
    .hasText(
      'All Posts',
      'All Posts pill show should up first before TBR pill'
    );

  assert.equal(
    PretenderManager.getMatchedRequests('/voyager/api/groups/updatesV2')
      .length,
    0,
    'It should not fire initial call to fetch group updates'
  );

  assert.equal(
    getRequestsToFeedUpdates().length,
    1,
    'It should fire 1 call to fetch feed updates when the `All` pill is selected'
  );
});

// Remove this when clean up lix voyager.web.segments-group-first-experience
test('It should first load users with `TBR` GFE Pill pre-selected when queryParam `shouldShowGroupFeed` is true & voyager.web.segments-group-first-experience lix is `enabled:all-feed`', async function (assert) {
  assert.expect(1);

  this.setupLixes({
    'voyager.web.segments-group-first-experience': 'enabled:all-feed',
  });

  await visit(addQueryParam('/feed', 'shouldShowGroupFeed', true));

  assert
    .dom('[data-test-feed__filter-feed-pill="The Break Room"]')
    .hasAttribute('aria-checked', 'true');
});