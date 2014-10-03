Package.describe({
	summary: "An analytics package for meteor",
	version: "0.5.1",
	git: "https://github.com/Tarang/Meteor-Analytics.git",
	name: "analytics:analytics"
});

Package.on_use(function (api) {
	if(api.versionsFrom) api.versionsFrom("METEOR@0.9.3");

	api.use(['templating', 'jquery'],'client');
	api.use(['ddp'],'server');
	api.use(['underscore', 'mongo', 'tracker', 'random', 'accounts-base'], ['server', 'client']);

	api.add_files(['hooks_client.js'], 'client');
	api.add_files('client/setup.html', 'server', {isAsset: true});
	api.add_files('lib_server.js', 'server');
	api.add_files('providers/defaults.js', 'server');
	api.add_files('providers/atmosphere.js', 'server');
	api.export('Tail');
});