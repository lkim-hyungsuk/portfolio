import EmberRouter from '@ember/routing/router';
import config from 'inline-translation-web/config/environment';

export default class Router extends EmberRouter {
  override location = config.locationType;
  override rootURL = config.rootURL;
}

Router.map(function () {
  this.route(
    'authentication',
    { path: '/', resetNamespace: true },
    function authRoute() {
      this.route('translate', { path: '/' }); // index route
      this.route('my-proposals');
      this.route('search');
      this.route('approve');
    }
  );

  this.route('error');
});
