getSafeUserProfile = function(userId) {

	var user = Meteor.users.findOne({_id: userId});

	if(!user) return null;

	for(var service in user.services) {
		if(service in Providers) return Providers[service](user);
	}
}

_.extend(Providers, {
	facebook: function(user) {
		var service = user.services.facebook;
		return {
			fbid: service.id,
			type: 'facebook',
			first_name: service.first_name,
			last_name: service.last_name,
			name: service.name,
			userId: user._id,
			roles: user.roles,
			email: service.email
		}
	},
	password: function(user) {
		var email = user.emails && user.emails[0] && user.emails[0].address;

		var doc = {
			email: email,
			userId: user._id,
			roles: user.roles,
			type: 'password'
		}

		if(user.profile && user.profile.name) doc.name = user.profile.name;
		if(user.profile && user.profile.first_name) doc.first_name = user.profile.first_name;
		if(user.profile && user.profile.firstName) doc.first_name = user.profile.firstName;
		if(user.profile && user.profile.lastName) doc.last_name = user.profile.lastName;
		if(user.profile && user.profile.last_name) doc.last_name = user.profile.last_name;
		if(user.profile && user.profile.email && !doc.email) doc.email = user.profile.email;

		return doc;
	},
	twitter: function(user) {
		var service = user.services.twitter;

		var large_avatar = service.profile_image_url.replace('_normal.', '.');

		return {
			id: service.id,
			name: service.screenName,
			avatar: large_avatar,
			userId: user._id,
			roles: user.roles,
			type: "twitter"
		}
	},
	github: function(user) {
		var service = user.services.github;
		var profile = user.profile;

		return {
			id: service.id,
			name: (profile && profile.name) || service.username,
			email: service.email,
			username: service.username,
			avatar: service.avatar_url,
			userId: user._id,
			roles: user.roles,
			type: "github"
		}
	},
	google: function(user) {
		var service = user.services.google;
		var profile = user.profile;

		return {
			id: service.id,
			name: (profile && profile.name) || service.name,
			email: service.email,
			given_name: service.given_name,
			gender: service.gender,
			roles: user.roles,
			avatar: service.picture,
			userId: user._id,
			type: "google"
		}
	},
	weibo: function(user) {
		var service = user.services.weibo;
		var profile = user.profile;

		return {
			id: service.id,
			name: (profile && profile.name) || service.name,
			gender: service.Gender,
			roles: user.roles,
			avatar: service.Avatar_large,
			userId: user._id,
			type: "weibo"
		}
	}
});