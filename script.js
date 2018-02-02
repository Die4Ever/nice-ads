//TODO:
//get volume fading up working on youtube
//test youtube more to make sure it's ready for /r/youtube
//add hulu support

var oldVolume = 100;
var oldAdVolume = 10;
var fadingTo = -1;
var fadeTimeout = 0;
var volumeFadeSpeed = 2;
var observer;
var showingAd = 0;
var enabled = 1;

function remoteAttach() {
    try {
        //if ((!Twitch.asyncAds.sra) || (!Twitch.asyncAds.fetchAds) || (!Twitch.ads.fetchAds) || (!Twitch.ads.fetchAll)) throw 'failed to attach';
        if (!googletag.companionAds) throw 'failed to attach';
        var lastCheckAds = 0;
        var old;
        function prepareAd() {
            var t = (new Date()).getTime();
            if ($('.player').attr('data-advertisement') != 'true' && t-$('.player').attr('data-preparing-ad')> 500) $('.player').attr('data-preparing-ad', t);
        }
        old = googletag.companionAds;
        googletag.companionAds = function () {
            var t = (new Date()).getTime();
            if (t - lastCheckAds < 1000) prepareAd();//$('.player').attr('data-preparing-ad', t);
            //console.log('running googletag.companionAds with ', arguments);
            var r = old.apply(this, arguments);
            if (r) prepareAd();//$('.player').attr('data-preparing-ad', t);
            //console.log("googletag.companionAds returned", r);
            lastCheckAds = t;
            return r;
        };
        /*old = Twitch.asyncAds.displayAdLight;
        console.log(old.toString());
        Twitch.asyncAds.displayAdLight = function () {
            $('.player').attr('data-preparing-ad', 'true');
            console.log('running Twitch.asyncAds.displayAdLight with ', arguments);
            var r = old.apply(this, arguments);
            console.log("Twitch.asyncAds.displayAdLight returned", r);
            return r;
        };
        old = Twitch.asyncAds.prepareCompanionAds;
        Twitch.asyncAds.prepareCompanionAds = function () {
            console.log('running Twitch.asyncAds.prepareCompanionAds with ', arguments);
            var r = old.apply(this, arguments);
            console.log("Twitch.asyncAds.prepareCompanionAds returned", r);
            return r;
        };
        old = Twitch.ads.fetchAds;
        Twitch.ads.fetchAds = function () {
            console.log('running Twitch.ads.fetchAds with ', arguments);
            var r = old.apply(this, arguments);
            console.log("Twitch.ads.fetchAds returned", r);
            return r;
        };
        old = Twitch.ads.prepareAd;
        Twitch.ads.prepareAd = function () {
            console.log('running Twitch.ads.prepareAd with ', arguments);
            var r = old.apply(this, arguments);
            console.log("Twitch.ads.prepareAd returned", r);
            return r;
        };*/

        function tracker() {
            var functionLogger = {};

            functionLogger.log = true;//Set this to false to disable logging 

            /**
             * Gets a function that when called will log information about itself if logging is turned on.
             *
             * @param func The function to add logging to.
             * @param name The name of the function.
             *
             * @return A function that will perform logging and then call the function. 
             */
            functionLogger.getLoggableFunction = function (func, name) {
                return function () {
                    if (functionLogger.log) {
                        var logText = name + '(';

                        for (var i = 0; i < arguments.length; i++) {
                            if (i > 0) {
                                logText += ', ';
                            }
                            logText += arguments[i];
                        }
                        logText += ');';

                        console.log(logText);
                    }

                    return func.apply(this, arguments);
                }
            };

            /**
             * After this is called, all direct children of the provided namespace object that are 
             * functions will log their name as well as the values of the parameters passed in.
             *
             * @param namespaceObject The object whose child functions you'd like to add logging to.
             */
            functionLogger.addLoggingToNamespace = function (namespaceObject) {
                for (var name in namespaceObject) {
                    var potentialFunction = namespaceObject[name];
                    if (!name.match(/(ad)|(ready)|(pre)|(fetch)/gi)) continue;
                    if (Object.prototype.toString.call(potentialFunction) === '[object Function]') {
                        namespaceObject[name] = functionLogger.getLoggableFunction(potentialFunction, name);
                    }
                }
            };
            //functionLogger.addLoggingToNamespace(window);
            //functionLogger.addLoggingToNamespace(Twitch);
            //functionLogger.addLoggingToNamespace(Twitch.asyncAds);
            //functionLogger.addLoggingToNamespace(Twitch.ads);
            //functionLogger.addLoggingToNamespace(google_ad_client);
            //functionLogger.addLoggingToNamespace(googletag);
        };
        //tracker();
        console.log('attached');
    } catch (e) {
        console.log('trying attach failed, trying again in 50ms',e);
        setTimeout(remoteAttach, 50);
    }
}

function remoteSetVolume(vol) {
    try {
        localStorage.volume = (vol / 100);
        var value = vol;
        var volSlider = $('div.player-volume__slider');
        volSlider.slider('value', value);
        volSlider.slider('option', 'slide')(null, { value: volSlider.slider('value') });
    } catch (e) { }
}

function remoteSetVolumeYT(vol) {
    try {
        localStorage.volume = (vol / 100);
        var value = vol;
    } catch (e) { }
}

function _setVolume(vol) {
    //console.log('setVolume to ' + vol);
    if (enabled == 0) return;
    if (vol != vol) return;
    if (vol < 0) vol = 0;
    if (vol > 100) vol = 100;
    if (currSite == 'youtube') {
        localStorage.volume = vol / 100;
        localStorage.muted = false;
		var ls = JSON.parse(localStorage['yt-player-volume']);
		ls.data = JSON.stringify({volume:vol, muted:false});
		localStorage['yt-player-volume'] = JSON.stringify(ls);
        $('video').each(function () {
            $(this)[0].volume = vol / 100;
			$(this)[0].muted=false;
        });
        /*var script = document.createElement("script");
        script.async = false;
        script.textContent = "localStorage['yt-player-volume'] =\'" + JSON.stringify(ls) + "\';";
        console.log("localStorage['yt-player-volume'] =\'" + JSON.stringify(ls) + "\';");
        document.documentElement.appendChild(script);
        document.documentElement.removeChild(script);*/
    } else if(currSite == 'twitch') {
        localStorage.volume = vol / 100;
        localStorage.muted = false;
        var script = document.createElement("script");
        script.async = false;
        script.textContent = remoteSetVolume.toString() + "remoteSetVolume(" + vol + ");";
        document.documentElement.appendChild(script);
        document.documentElement.removeChild(script);
    }
    //console.log('setVolume to ' + vol);
}

function fadeVolUp(end, speed, last) {
    if (enabled == 0) return setVolume(end, 'cancel fade up');
    fadingTo = end;
    var vol = localStorage.volume * 100;
    if (last >= 0 && Math.abs(vol - last) > speed) {
        fadingTo = -1;
        return;
    }
    if ( (currSite=='twitch' && $('.player[data-loading=true]').length > 0)
	||
	(($('#movie_player.unstarted-mode').length>0 && currSite=='youtube') || ($('#movie_player').length==0) && currSite=='youtube')
	) {
        _setVolume(vol);
        fadeTimeout = setTimeout(function () { fadeVolUp(end, speed, last); }, 50);
        return;
    }
    vol += speed;
    if (vol >= end) {
        _setVolume(end, speed);
        fadingTo = -1;
        return;
    }
    _setVolume(vol);
    fadeTimeout = setTimeout(function () { fadeVolUp(end, speed, vol); }, 25);
}

function setVolume(vol, context) {
    clearTimeout(fadeTimeout);
    fadeTimeout = 0;
    fadingTo = -1;
    if (enabled == 0) return;
    var currVol = getVolume();//getVolume looks at fadingTo as well
	var currVol2 = localStorage.volume * 100;

	//console.log($('#movie_player')[0]);
    if ( (currSite=='twitch' && $('.player[data-loading=true]').length > 0)
	||
	(($('#movie_player.unstarted-mode').length>0 && currSite=='youtube') || ($('#movie_player').length==0) && currSite=='youtube')
	) {
        _setVolume(vol);
        fadeTimeout = setTimeout(function () { setVolume(vol, context); }, 50);
        return;
    }
    if (vol - currVol2 > volumeFadeSpeed && currSite!='youtube') {
		if (currSite == 'youtube') localStorage.volume=currVol/100;
        console.log('fading volume up from ' + currVol + ' to ' + vol, context);
        fadeVolUp(vol, volumeFadeSpeed);
        return;
    }
    //console.log('setVolume('+vol+', '+context+')');
    _setVolume(vol);
}

function getVolume() {
    var vol = 100;
    vol = localStorage.volume * 100;
    if (localStorage.muted == "true") vol = 0;

    if (currSite == 'youtube') {
        try {
            vol = JSON.parse(JSON.parse(localStorage['yt-player-volume']).data).volume;
            if (JSON.parse(JSON.parse(localStorage['yt-player-volume']).data).muted == true) vol = 0;
        } catch (e) { console.log(e); }
        try {
            vol = $('video')[0].volume * 100;
            if ($('video')[0].muted == true) vol = 0;
        } catch (e) { console.log(e); }
    } else if (currSite == 'twitch') {
        try {
            var s = $('.player-volume__slider a.ui-slider-handle');
            var p = s.position();
            var w = $('div.player-volume__slider').width();
            vol = p.left;
            vol *= 100 / w;
        } catch (e) {
            vol = localStorage.volume * 100;
            if (localStorage.muted == "true") vol = 0;
        }
    }
    vol = Math.max(0, Math.min(100, vol));
    if (fadingTo >= 0) {
        vol = fadingTo;
    }
	//console.log('getVolume() == '+vol);
    return vol;
}

function isAd() {
    if (currSite == 'youtube') {
	//html5-video-player ad-created iv-module-created iv-module-loaded endscreen-created captions-created ytp-hide-info-bar playing-mode ytp-autohide ad-showing ytp-ad-overlay-open
	//html5-video-player ad-created ad-showing ad-interrupting videoAdUiRedesign ytp-video-ad-learn-more-ui iv-module-created iv-module-loaded captions-created playing-mode ytp-autohide
        if ($('.ad-interrupting').length > 0) {
            //$('.quietads-version').text('Ad showing');
            return true;
        }
        //$('.quietads-version').text('video showing');
    } else if (currSite == 'twitch') {
        if ($('.player[data-advertisement=true]').length > 0) {
            if ($('.player').attr('data-preparing-ad') != '0') {
                $('.player').attr('data-preparing-ad', '0');
                console.log('ad found for real');
            }
            return true;
        }
        if (parseInt($('.player').attr('data-preparing-ad')) > (new Date()).getTime() - 1000 * 3) {
            setTimeout(checkAd, 3100);
            console.log('preparing ad');
            return true;
        } else if (parseInt($('.player').attr('data-preparing-ad')) > 0) {
            console.log('false positive ad?');
            $('.player').attr('data-preparing-ad', '0');
        }
        //if ($('.player').attr('data-advertisement') == 'true') {
        //console.log('woa, this is faster');
        //return true;
        //}
    }
    return false;
}

function checkAd() {
    //console.log('checkAd()');
    if (enabled == 0) return;

    if (isAd()) {
        if (showingAd == 0) {
            showingAd = 1;
            if(currSite!='youtube') oldVolume = getVolume();
            if (oldAdVolume > oldVolume) oldAdVolume = oldVolume;
            setVolume(oldAdVolume, 'start ad');
            console.log('started ad');
            setTimeout(checkAd, 100);
            setTimeout(checkAd, 500);
            setTimeout(checkAd, 1000);
            setTimeout(checkAd, 2000);
        } else {
            //oldAdVolume = getVolume();
            setVolume(oldAdVolume, 'continue ad');
            //setTimeout(checkAd, 100);
        }
    } else {
        if (showingAd == 1) {
            showingAd = 0;
            if (currSite != 'youtube') oldAdVolume = getVolume();
            if (oldAdVolume > oldVolume) oldVolume = oldAdVolume;
			if(currSite == 'youtube') setVolume(oldAdVolume, 'proper fade');
            setVolume(oldVolume, 'end ad');
            console.log('back to stream');
        } else {
			oldVolume = getVolume();
		}
    }
}

var oldobserver;
var oldurl = '';
var currSite = '';
//interval = setInterval(checkAd, 500);

function badgeTooltipText() {
    var tooltip = "Disable QuietAds on Twitch";
    if (currSite == "twitch" && enabled == 1) tooltip = "Disable QuietAds on Twitch";
    if (currSite == "twitch" && enabled == 0) tooltip = "Enable QuietAds on Twitch";
    if (currSite == "youtube" && enabled == 1) tooltip = "Disable QuietAds on Youtube";
    if (currSite == "youtube" && enabled == 0) tooltip = "Enable QuietAds on Youtube";
    return tooltip;
}

function createBadge(p) {
    var checked = 'checked="checked"';
    if (enabled == 0) checked = '';

    var tooltip = badgeTooltipText();

    var e = $('<div style="display:inline-block;vertical-align:middle;height:100%;" class="quietads-version">(<input type="checkbox" name="quiteads-enabled" title="'+tooltip+'" value="enabled" ' + checked + '> QuietAds v' + chrome.runtime.getManifest().version + ')</div>');
    p.append(e);
    p.find('.quietads-version input').change(function () {
        if ($(this).is(':checked')) {
            console.log('QuietAds enabled!');
            var settings = { twenabled: 1 };
            if (currSite == 'youtube') settings = { ytenabled: 1 };
            chrome.storage.sync.set(settings, function () { console.log('setting saved!'); });
            $('.quietads-version input').attr('title', badgeTooltipText());
        }
        else {
            console.log('QuietAds disabled!');
            var settings = { twenabled: 0 };
            if (currSite == 'youtube') settings = { ytenabled: 0 };
            chrome.storage.sync.set(settings, function () { console.log('setting saved!'); });
            $('.quietads-version input').attr('title', badgeTooltipText());
        }
    });

    chrome.storage.onChanged.addListener(function (changes, namespace) {
        for (key in changes) {
            var storageChange = changes[key];
            console.log(key + ' changed', storageChange);
            if (currSite == 'twitch' && key == 'twenabled') {
                enabled = storageChange.newValue;
            }
            else if (currSite == 'youtube' && key == 'ytenabled') {
                enabled = storageChange.newValue;
            }
        }
        if (enabled == 1) {
            $('.quietads-version input').prop("checked", true);
        } else if (enabled == 0) {
            $('.quietads-version input').prop("checked", false);
        }
        $('.quietads-version input').attr('title', badgeTooltipText());
    });

    return p;
}

function initTwitch() {
    //currSite = 'twitch';
    //console.log('QuietTwitchAds is still running, new url');
    //alert("init function");

    var startVol = 0;
    var endVol = oldVolume;
    try {
        endVol = localStorage.volume * 100;
        if (!(endVol >= 0 && endVol <= 100)) endVol = oldVolume;
        if (localStorage.muted == "true") endVol = 0;
    } catch (e) { }
    console.log('muted and endVol', localStorage.muted, endVol);
    oldVolume = endVol;
    startVol = Math.min(startVol, endVol);
    _setVolume(startVol);
    fadingTo = endVol;
    clearInterval(fadeTimeout);
    clearTimeout(fadeTimeout);//overloading...
    fadeTimeout = setInterval(function () {
        _setVolume(startVol);
        localStorage.muted = true;
        if ($('.player[data-loading=true]').length > 0) return;

        clearInterval(fadeTimeout);
        setTimeout(function () {
            localStorage.muted = false;
            setVolume(endVol, 'init');
            try {
                var target = document.querySelector('.player');
                observer.observe(target, {
                    attributes: true, attributeFilter: ['data-advertisement', 'data-preparing-ad']
                });
                checkAd();
                //if ($('.info .channel span.quietads-version').length == 0) createBadge($('.info .channel'));
            } catch (e) { console.log(e); }
        }, 500);
    }, 5);

    $('.player').attr('data-preparing-ad', 0);

    var script = document.createElement("script");
    script.async = false;
    script.textContent = remoteAttach.toString() + "remoteAttach();";
    document.documentElement.appendChild(script);
    document.documentElement.removeChild(script);
}

function initYoutube() {
    //currSite = 'youtube';

    _setVolume(0);
    if ($('video').length == 0) {
        setTimeout(initYoutube, 100);
        return;
    }
	//var interval = setInterval(function(){setVolume(0);}, 5);
	setTimeout(function(){
    try {
		//clearInterval(interval);
		//setVolume(0);
        var target = document.querySelector('#movie_player');
        observer.observe(target, {
            attributes: true, attributeFilter: ['class']
        });
		target = document.querySelector('.ytp-volume-panel');
		observer.observe(target, {
            attributes: true, attributeFilter: ['aria-valuenow']
		});
		//_setVolume(0);
		setVolume(oldVolume, 'init');
        checkAd();
        //if ($('quietads-version').length == 0) $('.watch-secondary-actions').append('<div style="display:inline-block;" class="quietads-version">Youtube Support Coming Soon!</div>');
    } catch (e) { console.log(e); }
	//$('.ytp-volume-control').on('click mousedown mouseup mousemove', function(){console.log('volume');});
	}, 1000);
}

function init2() {
    if (currSite=='twitch') {
        initTwitch();
    } else if (currSite=='youtube') {
        initYoutube();
    }
}

function init() {
    if (oldurl == window.location.href) return;
    if ($('.player').length == 0 && $('#player-api').length == 0) return;
    oldurl = window.location.href;

    try {
        observer = new MutationObserver(function (mutations) {
            checkAd();
        });
    } catch (e) { console.log(e); }
    try { if (oldobserver) oldobserver.disconnect(); } catch (e) { }
    oldobserver = observer;

    if (oldurl.match(/http(s)?\:\/\/[^\/]*twitch\.tv/i)) {
        currSite = 'twitch';
    } else if (oldurl.match(/http(s)?\:\/\/[^\/]*youtube\.com/i)) {
        currSite = 'youtube';
    }

    var settings = { twenabled: 1 };
    if (currSite == 'youtube') settings = { ytenabled: 1 };
    chrome.storage.sync.get(settings, function (items) {
        enabled = items.twenabled;
        if (currSite == 'youtube') enabled = items.ytenabled;
        console.log('enabled == ',enabled);

        if (currSite=='twitch') {
            var initInterval = setInterval(function () {
                if ($('.info .channel').length == 0) return;
                clearInterval(initInterval);
                if ($('.info .channel .quietads-version').length == 0) createBadge($('.info .channel'));
                init2();
            }, 100);
        } else if (currSite=='youtube') {
            var initInterval = setInterval(function () {
                if ($('.watch-secondary-actions').length == 0) return;
                clearInterval(initInterval);
                if ($('.watch-secondary-actions .quietads-version').length == 0) createBadge($('.watch-secondary-actions'));
                init2();
            }, 100);
        }
    });
}

setInterval(init, 200);
//init();
//console.log('QuietTwitchAds is running!');