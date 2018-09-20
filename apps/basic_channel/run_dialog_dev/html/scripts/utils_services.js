/**********************************************************************
 * This logs to QiMessaging, and adds a few useful functions to the
 * JQuery namespace.
 *********************************************************************/

//alert("Loaded utils_services.js");

$(function () {
	//alert("Connecting!");
	$.qim = new QiSession("http://" + window.location.host, "libs/qimessaging/1.0/socket.io");

	$.qim.socket().on('connect', function() {
		log('Qimessaging: connected!');
	});

	$.qim.socket().on('disconnect', function() {
		log('Qimessaging: disconnected!');
	});

	$.onQimError = function (data) {
		if (console) {
			console.log("Service error: " + data);
		}
	}
	
	// A helper function that just makes some syntax shorter (to avoid adding fail handlers all the time)
	$.getService = function(serviceName, doneCallback) {
		return $.qim.service(serviceName).done(doneCallback).fail(function (data) {
			if (console) {
				console.log("Failed getting " + serviceName + ": " + data);
			}
		});
	}
	
	// Since ALMemory is frequently used, you can raise events with this.
	$.raiseALMemoryEvent = function(event, value) {
		return $.getService("ALMemory", function(ALMemory) {
			ALMemory.raiseEvent(event, value).fail($.onQimError);
		});
	}
 
	$.subscribeToALMemoryEvent = function(event, eventCallback, subscribeDoneCallback) {
		return $.getService("ALMemory", function(ALMemory) {
			ALMemory.subscriber(event).done(function (sub) {
				sub.signal.connect(eventCallback);
				if (subscribeDoneCallback) {
					subscribeDoneCallback();
				}
			}).fail($.onQimError);
		});
	}

	// Some debug helpers:
	// if utils_debug.js is loaded, we check the preferences to see if we want to enable the log
	// (that way by default we can ship apps with log off, and activate it on a per-robot basis)
	if (window.DEBUG_LOG_ALLOWED == false) {
		$.getService("ALPreferenceManager", function(preferences) {
			preferences.getValue("com.aldebaran.system", "TabletDebugAllowed").done(function(isAllowed) {
				if (isAllowed && (isAllowed != "0")) {
					log("Activating debug: pref is " + isAllowed);
					window.DEBUG_LOG_ALLOWED = true;
				} else {
					log("Not activating debug: pref is " + isAllowed);
				}
			}).fail($.onQimError);
		});
	}
});