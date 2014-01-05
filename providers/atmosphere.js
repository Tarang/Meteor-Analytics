_.extend(Providers, {
	steam: function(user) {
		var service = user.services.steam,
			profile = user.profile;

		return {
			fbid: service.id,
			type: 'steam',
			usernamename: service.username,
			name: profile.personaname,
			userId: user._id,
			roles: user.roles,
			avatar: service.avatar.full
		}
	},
	vk: function(user) {
		var service = user.services.vk,
			profile = user.profile;

		return {
			id: service.id,
			name: profile.name,
			nickname: service.nickname,
			first_name: service.first_name,
			last_name: service.last_name,
			avatar: service.photo_big,
			dob: service.bdate,
			roles: user.roles,
			country: service.country,
			city: service.city,
			type: "vk"
		}
	},
	foursquare: function(user) {
		var service = user.services.foursquare,
			profile = user.profile;

		return {
			id: service.id,
			name: profile.firstName + ' ' + profile.lastName,
			email: service.email,
			first_name: profile.firstName,
			last_name: profile.lastName,
			roles: user.roles,
			type: "foursquare"
		}
	},
	fogbugz: function(user) {
		var service = user.services.fogbugz,
			profile = user.profile;

		return {
			id: service.id,
			name: (profile && profile.name) || service.email,
			email: service.email,
			roles: user.roles,
			type: "fogbugz"
		}
	},
	asana: function(user) {
		var service = user.services.asana,
			profile = user.profile;

		return {
			id: service.id,
			name: (profile && profile.name) || service.email,
			email: service.email,
			roles: user.roles,
			type: "asana"
		}
	},
	stripe: function(user) {
		var service = user.services.stripe,
		profile = user.profile;

		return {
			id: service.id,
			name: profile.first_name + ' ' + profile.last_name,
			first_name: profile.first_name,
			last_name: profile.last_name,
			roles: user.roles,
			type: "stripe"
		}
	},
	yammer: function(user) {
		var service = user.services.yammer,
			profile = user.profile,
			contact = service.contact,
			email = contact && contact.email_addresses && contact.email_addresses && contact.email_addresses[0] && contact.email_addresses[0].address;

		return {
			id: service.id,
			name: service.full_name,
			email: email,
			avatar: service.mugshot_url,
			dob: service.birth_date,
			roles: user.roles,
			type: "yammer"
		}
	},
	linkedin: function(user) {
		var service = user.services.linkedin;

		return {
			id: service.id,
			name: service.firstName + ' ' + service.firstName,
			email: service['email-address'],
			first_name: service.firstName,
			last_name: service.lastName,
			avatar: service['picture-url'],
			roles: user.roles,
			type: "linkedin"
		}
	},
	yahoo: function(user) {
		var service = user.services.yahoo,
			profile = user.profile;

		return {
			id: service.id,
			name: profile.name,
			avatar: service.profile_image_url,
			roles: user.roles,
			type: "yahoo"
		}
	},
	salesforce: function(user) {
		var service = user.services.salesforce,
			profile = user.profile;

		return {
			id: service.id,
			name: profile.name,
			email: service.email,
			roles: user.roles,
			type: "salesforce"
		}
	},
	soundcloud: function(user) {
		var service = user.services.soundcloud,
			profile = user.profile;

		return {
			id: service.id,
			name: profile.name,
			username: service.username,
			type: "soundcloud",
			roles: user.roles,
			avatar: service.avatar_url,
			country: service.country
		}
	},
	trello: function(user) {
		var service = user.services.trello,
			profile = user.profile;

		return {
			id: service.id,
			email: service.email,
			name: profile.name,
			roles: user.roles,
			type: "trello",
		}
	}
});