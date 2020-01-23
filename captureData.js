/**
 * Video Analytics API for HTML5 video players
 */

// Options available - TODO
var __videoanalytics_def_options = {
	UserID: 0,
	ContentID: 0,
	ContentName: "Not set",
	ContentCategory: "Not set",
	// Live or VOD tracking
	ContentType: "VOD",
	CookieKey: "VideoAnalytics",
	// Current position rewrite period
	CookieInterval: 30000,
	// Bandwidth test URL - should be > 200Kb to have reasonable results
	ContentType: "VOD",
	// Video Start Time levels in seconds
	vslevels: [4,8],
	vsalert: 8
};

//
// Function to enable video analytics tracking of VideoJS player
//
function trackVideo(vplayer, options) {
	// Only one concurrent video tracking!
	//if (__videoanalyticsobj!=null) {
	//	return;
	//}
	__videoanalyticsobj = new Object();
	__videoanalyticsobj.vp = vplayer;
	// Apply default options if needed
	if (options==null) {
		options = __videoanalytics_def_options;
	} else {
		for(var prop in __videoanalytics_def_options) {
		    if(options.hasOwnProperty(prop)) {
		        options[prop] = __videoanalytics_def_options[prop];
		    	console.log
			}
		}
	}
	__videoanalyticsobj.options = options;

	// Add event listeners
    vplayer.addEventListener("loadeddata", onLoadedData);
    vplayer.addEventListener("loadstart", onLoadStart);
    vplayer.addEventListener("seeking", function(obg) {console.log("seeking event");});
    vplayer.addEventListener("seeked", function(val) {console.log("seeked event "+val);});
    vplayer.addEventListener("canplay", onCanPlay);
    vplayer.addEventListener("canplaythrough", onCanPlayThrough);
    vplayer.addEventListener("waiting", onWaiting);
    vplayer.addEventListener("stalled", function(obg) {console.log("stalled event ");});
    vplayer.addEventListener("suspend", onSuspend);
    vplayer.addEventListener("playing", onPlaying);
    vplayer.addEventListener("timeupdate", onTimeUpdate);
    vplayer.addEventListener("ended", onEnded);
}

function stopTrackingVideo(vplayer) {
    vplayer.removeEventListener("loadeddata", onLoadedData);
    vplayer.removeEventListener("loadstart", onLoadStart);
    vplayer.removeEventListener("seeking", function(obg) {console.log("seeking event");});
    vplayer.removeEventListener("seeked", function(val) {console.log("seeked event "+val);});
    vplayer.removeEventListener("canplay", onCanPlay);
    vplayer.removeEventListener("canplaythrough", onCanPlayThrough);
    vplayer.removeEventListener("waiting", onWaiting);
    vplayer.removeEventListener("stalled", function(obg) {console.log("stalled event ");});
    vplayer.removeEventListener("suspend", onSuspend);
    vplayer.removeEventListener("playing", onPlaying);
    vplayer.removeEventListener("timeupdate", onTimeUpdate);
    vplayer.removeEventListener("ended", onEnded);
}

//
// Function to enable video analytics (tracking) for HTML5 video element
//
function trackVideoElement(vplayer, options)
{
	// TODO
}

// internal log function
function __analyticsLog(data) {
	console.log("[Video Analytics] "+data);
}

// One time initialization
function __initializeVideoAnalytics() {
	if (__videoanalyticsobj.ready != true) {
		__analyticsLog("__initializeVideoAnalytics()");
		// Delivery server matching
		var server_re = /http:\/\/(.+)\//i;
		var v_server = server_re.exec(__videoanalyticsobj.vp.currentSrc);
		if (v_server && v_server[1]){
			__analyticsLog("Video server address: "+v_server[1]);
			__videoanalyticsobj.vserver = v_server[1];
		}
		// Init vars
		__videoanalyticsobj.buffering_count = 0;
		__videoanalyticsobj.buffering_time = 0;

		// Remember video duration
		__videoanalyticsobj.duration = __videoanalyticsobj.vp.duration;

		// Duration levels
		__videoanalyticsobj.duration_level1 = __videoanalyticsobj.duration * 0.3;
		__videoanalyticsobj.duration_level2 = __videoanalyticsobj.duration * 0.6;
		__videoanalyticsobj.duration_level3 = __videoanalyticsobj.duration * 0.9;

		// Periodic timeout
		__videoanalyticsobj.__t = setTimeout(__updateStats, __videoanalyticsobj.options.CookieInterval);

		// Ready flag
		__videoanalyticsobj.ready = true;

		// Flush previously collected statistics, a.e. from previous web page view with a video player
		__flushStatistics();
	}
}

// Internal function for getting text level name
function __getLevel(levels, value){
	if (value<levels[0]) {
		return "less than "+levels[0];
	} else if (value>levels[1]) {
		return "more than "+levels[1];
	} else {
		return "between "+levels[0]+" and "+levels[1];
	}
}

// Track data through Google Analytics events
function __trackData(evt, p1, p2, val) {
	// Check whether tracker is ready
	__initializeVideoAnalytics();
	// Track
	__analyticsLog("Track Event: " + evt + " -> " + p1 + " -> " + p2 + " = " + val);
	// TrackEvent

	_gaq.push(['_trackEvent', evt, p1, p2, val]);
    __trackData("Video Quality", "Video start time", vslevel, Math.round(__videoanalyticsobj.vstime));
}

//
function __updateStats() {
	if (__videoanalyticsobj.playing) {
		__analyticsLog("Regular: last time:"+__videoanalyticsobj.lastpos+" last percent: "+ __videoanalyticsobj.lastpos/__videoanalyticsobj.duration );
		__putCookieData("ContentName", __videoanalyticsobj.options.ContentName);
		__putCookieData("ViewTime", Math.round(__videoanalyticsobj.lastpos));
	}
	__videoanalyticsobj.__t = setTimeout(__updateStats, __videoanalyticsobj.options.CookieInterval);
}
// Event listeners for statistics tracking
// Video data loaded
function onLoadedData(evt) {
	__analyticsLog("loadeddata event");
}

// Video load started
function onLoadStart(evt) {
	__analyticsLog("HTML5 loadstart event");
	__videoanalyticsobj.lstime = new Date();
}

// Video can be played
function onCanPlay(evt) {
	// mark the start of the video.
	document.getElementsByTagName("body")[0].setAttribute("id", "playStart");

	__analyticsLog("HTML5 canplay event");
	__initializeVideoAnalytics();

	// Fire video start time only once
	if (__videoanalyticsobj.video_start_time_trigger==null) {
		// Calculate video start delay (until video became ready for playing)
		__videoanalyticsobj.cptime = new Date();
		__videoanalyticsobj.vstime = (__videoanalyticsobj.cptime.getTime() - __videoanalyticsobj.lstime.getTime())/1000;
		var vslevel = __getLevel(__videoanalyticsobj.options.vslevels, __videoanalyticsobj.vstime) + " sec";
		__trackData("Video Quality", "Video start time", vslevel, Math.round(__videoanalyticsobj.vstime));
		__videoanalyticsobj.video_start_time_trigger = true;
		if (__videoanalyticsobj.vstime > __videoanalyticsobj.options.vsalert) {
			__trackData("Video Quality", "Alerts", "Start time more than "+__videoanalyticsobj.options.vsalert+" seconds", 1);
		}
	}
}

// Video can be played through
function onCanPlayThrough(evt) {
	__analyticsLog("HTML5 canplaythrough event");
}

// Video started playing
function onPlaying(evt) {
	__analyticsLog("HTML5 playing event");

	__videoanalyticsobj.playing = true;

	// Detect bufferization
	if (__videoanalyticsobj.buffering_start) {
		++__videoanalyticsobj.buffering_count;
		var buf_delay = new Date().getTime() - __videoanalyticsobj.buffering_start.getTime();
		__videoanalyticsobj.buffering_time += buf_delay/1000;
		__analyticsLog("Video buffering finished: counter="+__videoanalyticsobj.buffering_count+" total delay="+__videoanalyticsobj.buffering_time);
		__putCookieData("BufferingCounter", __videoanalyticsobj.buffering_count);
		__putCookieData("BufferingTime", __videoanalyticsobj.buffering_time);

		// print cookie values
		//var node = document.createElement("div");        
		//var textnode = document.createTextNode(__videoanalyticsobj.buffering_time);   
		//node.appendChild(textnode);                          
		//document.getElementById("printValues").appendChild(node);



	} else if (__videoanalyticsobj.watch_trigger != true) {
		// track watch event
		__trackData("Video Metrics", "Watch "+__videoanalyticsobj.options.ContentCategory, __videoanalyticsobj.options.ContentName, 1);
		__videoanalyticsobj.watch_trigger = true;
	}
}

// Time position updated
function onTimeUpdate(evt) {
        __putCookieData("ViewTime", Math.round(__videoanalyticsobj.lastpos));
	//__putCookieData("BufferingCounter", __videoanalyticsobj.buffering_count);
	//__putCookieData("BufferingTime", __videoanalyticsobj.buffering_time);
	
	__analyticsLog("HTML5 timeupdate event " + __videoanalyticsobj.vp.currentTime);
	// Remember last position
	__videoanalyticsobj.lastpos = __videoanalyticsobj.vp.currentTime;
	// View time thresholds
	if (__videoanalyticsobj.vp.currentTime > __videoanalyticsobj.duration_level1) {
		if (__videoanalyticsobj.duration_level1_trigger == null) {
			__videoanalyticsobj.duration_level1_trigger = true;
			__trackData("Video Metrics", "View Percent: 30%", __videoanalyticsobj.options.ContentName, 1);
		}
	} else if (__videoanalyticsobj.vp.currentTime > __videoanalyticsobj.duration_level2) {
		if (__videoanalyticsobj.duration_level2_trigger == null) {
			__videoanalyticsobj.duration_level2_trigger = true;
			__trackData("Video Metrics", "View Percent: 60%", __videoanalyticsobj.options.ContentName, 1);
		}
	} else if (__videoanalyticsobj.vp.currentTime > __videoanalyticsobj.duration_level3) {
		if (__videoanalyticsobj.duration_level3_trigger == null) {
			__videoanalyticsobj.duration_level3_trigger = true;
			__trackData("Video Metrics", "View Percent: 90%", __videoanalyticsobj.options.ContentName, 1);
		}
	}
}

// Video playback suspended
function onSuspend(evt) {
	__analyticsLog("HTML5 suspend event");
}

// Waiting for a video
function onWaiting(evt) {
	__analyticsLog("HTML5 waiting event");
	if (__videoanalyticsobj.playing) {
		__analyticsLog("Video buffering started");
		__videoanalyticsobj.buffering_start = new Date();
	}
}

//Video playback ended
function onEnded(evt) {
	__analyticsLog("HTML5 ended event");
	__putCookieData("ViewTime", Math.round(__videoanalyticsobj.duration));
	__videoanalyticsobj.flushed = false;
	__flushStatistics();
}

function __flushStatistics() {
	var cname = __getCookieData("ContentName");
	if (cname==null || cname=='') {
		return;
	}
	__analyticsLog("Flushing collected statistics...");
	var vtime = parseInt(__getCookieData("ViewTime"));
	var bcounter = parseInt(__getCookieData("BufferingCounter"));
	var btime = parseInt(__getCookieData("BufferingTime"));
	if (vtime>0) {
		__trackData("Video Metrics", "View Time", cname, vtime);
	}
	if (bcounter>0) {
		__trackData("Video Metrics", "Buffering Counter", cname, bcounter);
	}
	if (btime>0) {
		__trackData("Video Metrics", "Buffering Time", cname, btime);
	}
	__putCookieData("ContentName", "");
	__putCookieData("ViewTime", "");
	__putCookieData("BufferingCounter", "");
	__putCookieData("BufferingTime", "");
}

function __putCookieData(key, value) {
	__analyticsLog("put cookie: ["+key+"],["+value+"]");
	document.cookie = encodeURIComponent(__videoanalyticsobj.options.CookieKey+key) + '=' + encodeURIComponent(value);
}

function __getCookieData(key) {
	var value = (result = new RegExp('(?:^|; )' + encodeURIComponent(__videoanalyticsobj.options.CookieKey+key) + '=([^;]*)').exec(document.cookie)) ? decodeURIComponent(result[1]) : null;
	__analyticsLog("get cookie: ["+key+"],["+value+"]");
	return value;
}
// Our video analytics object
var __videoanalyticsobj = null;
