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
			email: service.email
		}
	},
	password: function(user) {
		var email = user.emails && user.emails[0] && user.emails[0].address;

		return {
			email: email,
			userId: user._id,
			type: 'password'
		}
	},
	twitter: function(user) {
		var service = user.services.twitter;
		
		console.log("Twitter");

		return {
			id: service.id,
			name: service.screenName,
			avatar: service.profile_image_url,
			type: "twitter"
		}
	}
});