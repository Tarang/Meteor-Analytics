Package.describe({
	summary: "An analytics package for meteor",
	version: "0.5.0",
	git: "https://github.com/Tarang/Meteor-Analytics.git",
	name: "analytics:analytics"
});

Package.on_use(function (api) {
	if(api.versionsFrom) api.versionsFrom("METEOR@0.9.0");
	api.use(['underscore', 'templating', 'deps', 'jquery', 'random'],'client');
	api.use(['livedata', 'underscore'],'server');
	api.add_files(['hooks_client.js'], 'client');
	api.add_files('client/setup.html', 'server', {isAsset: true});
	api.add_files('lib_server.js', 'server');
	api.add_files('providers/defaults.js', 'server');
	api.add_files('providers/atmosphere.js', 'server');
	api.export('Tail');
});