//Server side hooks

var tail_version = "0.9.1",
    Frequency_key = "",
    default_server = "https://tail.sh",
    tail_settings = new Mongo.Collection("tail_settings"),
    tail_setup = false,
    booted = new Date(),
    ignoreLoad = false,
    Galactic_core = DDP.connect(serverUrl()),
    Tail_Server_Settings = new Mongo.Collection("tail_settings", { connection: Galactic_core });

Providers = {};

var ma_event = function(type, params, sid) {
	if(!tail_setup) return;
    params.sid = sid;
	params.type = type;
	tail_setup && Galactic_core.call("maevent", params, function() {});
}

var install_hook_to = function(obj) {
    if (obj.hook || obj.unhook) 
        throw new Error('Object already has properties hook and/or unhook');
    
    obj.hook = function(_meth_name, _fn, _is_async) {
        var self = this,
            meth_ref;
        
        if (! (Object.prototype.toString.call(self[_meth_name]) === '[object Function]'))
            throw new Error('Invalid method: ' + _meth_name);
 
        if (self.unhook.methods[_meth_name])
            throw new Error('Method already hooked: ' + _meth_name);
 
        meth_ref = (self.unhook.methods[_meth_name] = self[_meth_name]);
 
        self[_meth_name] = function() {
            var args = Array.prototype.slice.call(arguments);
 
            while (args.length < meth_ref.length) {
                args.push(undefined);
            }
 
            args.push(function() {
                var args = arguments;
                
                if (_is_async) {
                    process.nextTick(function() {
                        meth_ref.apply(self, args);
                    });
                } else {
                    meth_ref.apply(self, args);
                }
            });
 
            _fn.apply(self, args);
        };
    };
    
    obj.unhook = function(_meth_name) {
        var self = this,
            ref  = self.unhook.methods[_meth_name];
 
        if (ref) {
            self[_meth_name] = self.unhook.methods[_meth_name];
            delete self.unhook.methods[_meth_name];
        }
        else throw new Error('Method not hooked: ' + _meth_name);
    };
 
    obj.unhook.methods = {};
};

Meteor.methods({
	'_Tevent':function(params) {
        ma_event(params.type, params, this.connection ? this.connection.id : params.connection);
	}
});

var tail_startup = function() {
    var settings = tail_settings.findOne({name:'settings'});
    
    if(Frequency_key != "") settings = { key: "Frequency_key" }

    if(settings) {
        tail_setup = true;
        Frequency_key = settings.key;
    }else{
        if(ignoreLoad) return;
        console.log(serverUrl() == default_server ? "Tail.sh needs to be set up. Please load your browser up to continue the set up" : "Meteor Analytics: Load your app up in the browser to begin setup");
        Galactic_core.subscribe('tail_setup');

        Tail_Server_Settings.find({type: 'quicksetup'}).observe({
            added: function (doc) {
                if(doc.type=="quicksetup") {
                    if(tail_settings.findOne({name: 'settings'})) return false;
                    if(doc.name == 'quicksetup') tail_settings.insert({name:'settings', key: doc._id}); 
                }else if(doc.type=="user_state") ModifyUserState(doc.userId, doc.newState);
            }
        });

    }
	
	

	//Get log data
    if(tail_setup) {


        var os = Npm.require('os');

        var galactic_auth = function() {
	        Galactic_core.subscribe("meteor_package", {
	            env: process.env,
	            key: Frequency_key,
	            arch: os.arch(),
	            version: process.version,
	            tail_version: tail_version,
	            release: Meteor.release,
	            platform: os.platform(),
	            type: os.type(),
	            processMem: process.memoryUsage().rss,
	            hostname: os.hostname(),
	            os_release: os.release(),
	            webapp: typeof WebApp != "undefined" && WebApp.clientProgram ? WebApp.clientProgram : null,
	            uptime: os.uptime(),
	            memory: os.totalmem(),
	            cpus: os.cpus(),
	            networkInterfaces: os.networkInterfaces(),
	            modules: process.versions,
	            freemem: os.freemem(),
	            loadavg: os.loadavg()
	        });
    	}

    	galactic_auth();

    	Galactic_core.onReconnect = galactic_auth;

        var stdout = process.stdout;
    	install_hook_to(stdout);
    	
    	stdout.hook('write', function(string, encoding, fd, write) {
    	    write(string);
    	    Npm.require('fibers')(function() {ma_event('log', {text: string.length > 1000 ? string.substr(0,1000) + ". . . [truncated]" : string });}).run();
    	});

        healthCheck = Meteor.setInterval(function() {
            var os = Npm.require('os');
            ma_event('health', {cpus: os.cpus(), loadavg: os.loadavg(), totalmem: os.totalmem(), memory: (os.totalmem()-os.freemem()), processMem: process.memoryUsage().rss});
        }, 300000);

    } else
    var handle = tail_settings.find({name: 'settings'}).observe({
        added: function (document) {
            handle.stop();
                tail_startup();
            }
    });
}

var getSetupHtml = function(token) {
    return Assets.getText("client/setup.html").replace("{{token}}", token).replace("{{serverUrl}}", serverUrl);
}

Meteor.startup(tail_startup);

Meteor.publish("_aurora", function(clientParams) {
    var sid = (this.connection && this.connection.id) || this._session.id,
		params = {
			ip: this._session.socket.remoteAddress,
			headers: this._session.socket.headers,
			ddp: this._session.version,
			key: Frequency_key,
            secure: clientParams.secure,
            preview: clientParams.preview,
            language: clientParams.language,
            referrer: clientParams.referrer,
            uid: clientParams.uid
		},
        self = this;
	if(this.userId) params.user = getSafeUserProfile(this.userId);

    if(!tail_setup) {
        var tokenHandle = Tail_Server_Settings.find({type:'quicksetup', name:'token'}).observe({
            added: function(doc) {
                self.added('__tail_message', '0', {setup: false, html: getSetupHtml(doc.token)});
                tokenHandle && tokenHandle.stop();
                tokenHandle = null;
            }
        });
        
        var handle = tail_settings.find({name: 'settings'}).observe({
            added: function (document) {
                self.removed('__tail_message', '0');
                ma_event('init', params, sid);   
            }
        });

        self.onStop(function () {
            handle.stop();
            tokenHandle && tokenHandle.stop();
        });
    }else
        ma_event('init', params, sid);

    var onclose = Meteor.bindEnvironment(function(){ma_event('deinit', {count: _.size(self._session.server.sessions)}, sid)}, function() {});

    if(this.connection)
    this.connection.onClose(onclose);
    else this._session.socket._session.connection._events.close.push(onclose);

    this.ready();
});

Tail = {
    ignore: function(newState) {
        ignoreLoad = newState;
    },
    setup: function(appId) {
        Frequency_key = appId;
    }
}

function serverUrl() {
    return process.env.TAIL_URL || default_server
}