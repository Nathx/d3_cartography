function Relations() {
	this.items = {};
	this.locked = false;
	this.eventAutorise = null;
}

Relations.prototype = {
	add: function(id, element) {
		return this.items[id] = new Connector(element, id, this);
	},
	
	remove: function(id) {
		
	},
	
	get: function(id) {
		return this.items[id];
	},
	
	execute: function(id, event, eventParameters) {
		if (!this.locked || event==this.eventAutorise) {
			var functions = this.get(id).listenedEvents[event];
			for(var i =0; i<functions.length; ++i) {
				functions[i][1](this.get(functions[i][0]).element, eventParameters);
			}
		}
	},
	
	lock: function(event) {
		if (undefined==event) {
			event = "default";
		}
		
		if (!this.locked) {
			this.locked = true;
			this.eventAutorise = event;
			return true;
		}
		else {
			return false;
		}
	},
	
	unlock: function(event) {
		if (undefined==event) {
			event = "default";
		}
		
		if (this.locked && event==this.eventAutorise) {
			this.locked = false;
			return true;
		}
		else {
			return false;
		}
	}
}

function Connector(object, id, manager) {
	this.manager = manager;
	this.element = object;
	this.id = id;
	this.listenedEvents = {};
}

Connector.prototype = {
	bind: function(event, id, action) {
		if (undefined==action) {
			this.bind(event, this.id, id);
		}
		else {
			if (undefined!=this.listenedEvents[event]) {
				this.listenedEvents[event].push([id, action]);
			}
			else {
				var object = this;
				this.listenedEvents[event] = [[id, action]];
				this.element.on(event, function() {
					object.manager.execute(object.id, event, arguments);
				}) ;
			}
		}
		
		return this;
	},
	
	bindTo: function(event, id, action) {
		this.manager.get(id).bind(event, this.id, action);
		
		return this;
	},
	
	unbind: function(id, event) {
		return this;
	},
	
	click: function(id, action) {
		return this.bind("click", id, action);
	},
	
	dblclick: function(id, action) {
		return this.bind("dblclick", id, action);
	},
	
	mouseover: function(id, action) {
		return this.bind("mouseover", id, action);
	},
	
	mouseout: function(id, action) {
		return this.bind("mouseout", id, action);
	}
}
