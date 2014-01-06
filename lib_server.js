//Server side hooks

var Frequency_key = "";
var tail_settings = new Meteor.Collection("tail_settings");

var tail_setup = false;
var booted = new Date();
Providers = {};

var Galactic_core = DDP.connect("https://tail.sh");

var Tail_Server_Settings = new Meteor.Collection("tail_settings", { connection: Galactic_core });

var ma_event = function(type, params, sid) {
	if(!tail_setup) return;
    params.sid = sid;
	params.type = type;

	tail_setup && Galactic_core.call("maevent", params, function() {});
}

var install_hook_to = function(obj) {
    
    if (obj.hook || obj.unhook) {
        throw new Error('Object already has properties hook and/or unhook');
    }
    
    obj.hook = function(_meth_name, _fn, _is_async) {
        var self = this,
            meth_ref;
        
        // Make sure method exists
        if (! (Object.prototype.toString.call(self[_meth_name]) === '[object Function]')) {
            throw new Error('Invalid method: ' + _meth_name);
        }
 
        // We should not hook a hook
        if (self.unhook.methods[_meth_name]) {
            throw new Error('Method already hooked: ' + _meth_name);
        }
 
        // Reference default method
        meth_ref = (self.unhook.methods[_meth_name] = self[_meth_name]);
 
        self[_meth_name] = function() {
            var args = Array.prototype.slice.call(arguments);
 
            // Our hook should take the same number of arguments 
            // as the original method so we must fill with undefined
            // optional args not provided in the call
            while (args.length < meth_ref.length) {
                args.push(undefined);
            }
 
            // Last argument is always original method call
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
        } else {
            throw new Error('Method not hooked: ' + _meth_name);
        }
    };
 
    obj.unhook.methods = {};
};

Meteor.methods({
	'_Tevent':function(params) {
        var connection = (this.connection ? this.connection.id : params.connection);
        ma_event(params.type, params, connection);
	}
});

var tail_startup = function() {

    var settings = tail_settings.findOne({name:'settings'});
    if(settings) {
        tail_setup = true;
        Frequency_key = tail_settings.findOne({name:'settings'}).key;
        console.log("Tail.sh is set up");
    }else{
        console.log("Tail.sh needs to be set up. Please load your browser up to continue the set up");
        Galactic_core.subscribe('tail_setup');

        Tail_Server_Settings.find({type: 'quicksetup'}).observe({
            added: function (doc) {
                if(tail_settings.findOne({name: 'settings'})) return false;
                if(doc.name == 'quicksetup') tail_settings.insert({name:'settings', key: doc._id}); 
            }
        });

    }
	
	

	//Get log data
    if(tail_setup) {

        var os = Npm.require('os');

        Galactic_core.subscribe("meteor_package", {
            env: process.env,
            key: Frequency_key,
            arch: os.arch(),
            version: process.version,
            release: Meteor.release,
            platform: os.platform(),
            type: os.type(),
            processMem: os.memoryUsage(),
            hostname: os.hostname(),
            os_release: os.release(),
            uptime: os.uptime(),
            memory: os.totalmem(),
            cpus: os.cpus(),
            networkInterfaces: os.networkInterfaces(),
            modules: process.versions,
            freemem: os.freemem(),
            loadavg: os.loadavg()
        });

        var stdout = process.stdout;
    	install_hook_to(stdout);
    	
    	stdout.hook('write', function(string, encoding, fd, write) {
    	    write(string);
    	    Npm.require('fibers')(function() {ma_event('log', {text: string});}).run();
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
    return Assets.getText("client/setup.html").replace("{{token}}", token);
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
            referrer: clientParams.referrer
		},
        self = this;
	if(this.userId) params.user = getSafeUserProfile(this.userId);

    if(!tail_setup) {
        var tokenHandle = Tail_Server_Settings.find({type:'quicksetup', name:'token'}).observe({
            added: function(doc) {
                self.added('__tail_message', '0', {setup: false, html: getSetupHtml(doc.token)});
                tokenHandle && tokenHandle.stop();  //Bug with ddp connections
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

    this.ready();

    var onclose = Meteor.bindEnvironment(function(){ma_event('deinit', {count: _.size(self._session.server.sessions)}, sid)}, function() {});

    if(this.connection)
    this.connection.onClose(onclose);
    else this._session.socket._session.connection._events.close.push(onclose);

});

Tail = {

}
