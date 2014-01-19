Package.describe("An analytics package for meteor");

Package.on_use(function (api) {
	api.use(['underscore', 'templating', 'deps', 'jquery', 'random'],'client');
	api.use(['livedata', 'underscore'],'server');
	api.add_files(['hooks_client.js'], 'client');
	api.add_files('client/setup.html', 'server', {isAsset: true});
	api.add_files('lib_server.js', 'server');
	api.add_files('providers/defaults.js', 'server');
	api.add_files('providers/atmosphere.js', 'server');
	api.export('Tail');
});