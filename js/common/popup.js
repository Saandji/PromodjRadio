var workspace = {};
$(function () {
    var getLocalStorageItem = function(key) {
        return localStorage.getItem(key)
    };

    var showLoader = function(show) {
        var $loader = $('.hide-loader-container');
        if (show) {
            $loader.show();
        } else {
            $loader.hide();
        }
    };

    var setLocalStorageItem = function(key, value) {
        localStorage.setItem(key, value);
    };

    var removeLocalStorageItem = function(key) {
        localStorage.removeItem(key);
    };

    var isPaused = function() {
        return chrome.extension.getBackgroundPage().document.querySelector('audio').paused;
    };

    var getDefaultRadioStations = function () {
        return [
        /**
         * specify next fields:
         *
         * id - radio identifier
         * stream - radio stream src
         * name -  radio name to display
         *
         * @type {RadioStationListItem}
         */
            {
                id: 0,
                name: 'top100',
                channelID: 21,
                stream: "http://radio.maases.com:8000/top100-192"
            },
            {
                id: 1,
                name: 'channel5',
                channelID: 1,
                stream: "http://radio.maases.com:8000/channel5-192"
            },
            {
                id: 2,
                name: 'klubb',
                channelID: 15,
                stream: "http://radio.maases.com:8000/klubb-192"
            },
            {
                id: 3,
                name: 'dubstep',
                channelID: 20,
                stream: "http://radio.maases.com:8000/dubstep-192"
            },
            {
                id: 4,
                name: 'pop',
                channelID: 19,
                stream: "http://radio.maases.com:8000/pop-192"
            },
            {
                id: 5,
                name: 'nu',
                channelID: 14,
                stream: "http://radio.maases.com:8000/nu-192"
            },
            {
                id: 6,
                name: 'toonu',
                channelID: 16,
                stream: "http://radio.maases.com:8000/toonu-192"
            },
            {
                id: 7,
                name: 'yo',
                channelID: 13,
                stream: "http://radio.maases.com:8000/yo-192"
            },
            {
                id: 8,
                name: 'fullmoon',
                channelID: 4,
                stream: "http://radio.maases.com:8000/fullmoon-192"
            },
            {
                id: 9,
                name: 'bobina',
                channelID: 22,
                stream: "http://radio.maases.com:8000/bobina-192"
            },
            {
                id: 10,
                name: '300kmh',
                channelID: 3,
                stream: "http://radio.maases.com:8000/300kmh-192"
            },
            {
                id: 11,
                name: '186mph',
                channelID: 18,
                stream: "http://radio.maases.com:8000/186mph-192"
            },
            {
                id: 12,
                name: 'deep',
                channelID: 2,
                stream: "http://radio.maases.com:8000/deep-192"
            },
            {
                id: 13,
                name: 'toodeep',
                channelID: 17,
                stream: "http://radio.maases.com:8000/toodeep-192"
            },
            {
                id: 14,
                name: 'mini',
                channelID: 5,
                stream: "http://radio.maases.com:8000/mini-192"
            },
            {
                id: 15,
                name: 'oldschool',
                channelID: 6,
                stream: "http://radio.maases.com:8000/oldschool-192"
            },
            {
                id: 16,
                name: 'vata',
                channelID: 7,
                stream: "http://radio.maases.com:8000/vata-192"
            },
            {
                id: 17,
                name: 'strange',
                channelID: 9,
                stream: "http://radio.maases.com:8000/strange-192"
            },
            {
                id: 18,
                name: 'brainfck',
                channelID: 8,
                stream: "http://radio.maases.com:8000/brainfck-192"
            }
        ];
    };

    var getMixadanceRadioStations = function() {
        return [
            {
                id: 19,
                name: 'garagefm',
                channelID: 11,
                stream: "http://radio.maases.com:8000/garagefm-192",
                trackInfoUrl: "http://www.garagefm.ru/",
                trackInfoParseFunc: function(response) {
                    return $(response).find('#now_playing_track_name').text();
                }
            },
            {
                id: 20,
                name: 'mixadancefm',
                channelID: 23,
                stream: "http://radio.maases.com:8000/mixadancefm-192",
                trackInfoUrl: "http://online.mixadance.fm/song.php?tr=2",
                trackInfoParseFunc: function(response) {
                    return $($(response)[1]).text();
                }
            }
        ]
    };

    var getRadioStationsWithoutTrackInfo = function() {
        return [
            {
                id: 21,
                name: 'pioneerdj',
                channelID: 24,
                stream: "http://radio.maases.com:8000/pioneerdj-192"
            },
            {
                id: 22,
                name: 'vanillaninja',
                channelID: 29,
                stream: "http://radio.maases.com:8000/vanillaninja-192"
            },

            {
                id: 23,
                name: 'groove',
                channelID: 25,
                stream: "http://radio.maases.com:8000/groove-192"
            },
            {
                id: 24,
                name: 'pacha',
                channelID: 26,
                stream: "http://radio.maases.com:8000/pacha-192"
            }
        ]
    };

    var PromoDJStationItem = BaseModel.extend({

        /*
         *  all custom model fields
         */
        defaults: {
            id: null,
            stream: null,
            name: null,
            connecting: false,
            trackHtml: "",
            trackNameHtml: "",
            isLoaded: false,
            isActive: false,
            backboneClass:  "RadioStationListItemModel"
        },

        fetch: function(options) {
            var self = this;
            var isActive = getLocalStorageItem('activeStationId') == this.get('id') && !isPaused();
            var myOptions = {
                success: function() {
                    self.set({
                        isActive: isActive
                    });
                    if (options && options.success) {
                        options.success();
                    }
                }
            };


            if (isActive) {
                this.loadTrackInfo(myOptions);
            } else {
                myOptions.success();
            }
        },

        loadTrackInfo: function(options) {
            var self = this;
            $.ajax({
                url: 'http://promodj.com/ajax/radio2_playlist.html',
                data: {
                    digest: 'digest=1894188:~cf0636b2aafc95faa4aecf20c7df5997',
                    channelID: self.get('channelID')
                },
                timeout: 5000,
                success: function(response) {
                    self.parseResponse(response);
                    if (options && options.success) {
                        options.success();
                    }
                }
            });
        },

        parseResponse: function (responseText, options, trackId) {
            if (responseText) {
                this.set({
                    trackHtml: $(responseText).find('.track')[0],
                    isLoaded: true
                });
            }
        }
    });

    var RadioStationItemWithoutTrackInfo = PromoDJStationItem.extend({
        loadTrackInfo: function(options) {
            var self = this;
            var isActive = getLocalStorageItem('activeStationId') == this.get('id') && !isPaused();
            var myOptions = {
                success: function() {
                    self.set({
                        isLoaded: isActive,
                        isActive: isActive
                    });
                    if (options && options.success) {
                        options.success();
                    }
                }
            };
            myOptions.success();
        }
    });

    var OtherStationItem = PromoDJStationItem.extend({

        fetch: function(options) {
            var self = this;
            var id = this.get('id');
            var isActive = getLocalStorageItem('activeStationId') == id && !isPaused();
            var myOptions = {
                success: function() {
                    self.set({
                        isActive: isActive
                    });
                    if (options && options.success) {
                        options.success();
                    }
                }
            };


            if (isActive) {
                this.loadTrackInfo(myOptions);
            } else {
                myOptions.success();
            }
        },

        loadTrackInfo: function(options) {
            var self = this;
            $.ajax({
                url: self.get('trackInfoUrl'),
                type: "GET",
                timeout: 5000,
                success: function(response) {
                    if (response) {
                        var trackName =  self.get('trackInfoParseFunc');
                        trackName = trackName(response).trim();
                        self.set({
                            trackUrl: self.getPromoDJSearchLink(trackName),
                            trackName: trackName,
                            isLoaded: true
                        });
                    }
                    if (options && options.success) {
                        options.success();
                    }
                }
            });
        },

        getPromoDJSearchLink: function(trackName) {
            return "http://promodj.com/search?searchfor=" + encodeURIComponent(trackName) + "&mode=all&sortby=relevance&period=all";
        }
    });

    var RadioStationList = Backbone.Collection.extend({
        model: PromoDJStationItem
    });
    //ugly
    var RadioStationMixadanceList = Backbone.Collection.extend({
        model: OtherStationItem
    });
    var RadioStationListWithoutTrackInfo = Backbone.Collection.extend({
        model: RadioStationItemWithoutTrackInfo
    });

    var RadioStationListItemView = BaseView.extend({
        tagName: "li",
        className: 'radio-station-item',
        template: "#radio-station-template",

        events: {
            'click .radio_logo': 'onLogoClicked'
        },

        onLogoClicked: function (e) {
            if (isPaused()) {
                if (!this.model.get('isActive')) {
                    this.model.loadTrackInfo();
                    this.model.set({
                        isActive: true
                    });
                    setLocalStorageItem('activeStationId', this.model.get('id'));
                    player.model.start(this.model.get('stream'));
                }
            } else {
                if (this.model.get('isActive')) {
                    this.model.set({
                        isActive: false,
                        isLoaded: false
                    });
                    removeLocalStorageItem('activeStationId');
                    player.model.stop();
                } else {
                    this.model.loadTrackInfo();
                    this.model.set({
                        isActive: true
                    });
                    player.model.start(this.model.get('stream'), getLocalStorageItem('activeStationId'));
                    setLocalStorageItem('activeStationId', this.model.get('id'));
                }
            }
        },

        afterRender: function() {
            $(this.el).find('.radio_logo').addClass("radio_" + this.model.get('name'));
            if ($(this.el).find('.track').length == 0) {
                var $track = $(this.model.get('trackHtml'));
                var $stamp = $track.find('.radiostamp');
                $track.find('.avatar').remove();
                $stamp.remove();
                $track.find('a').first().prepend($stamp);
                $track.find('.tizer').remove();
                $track.find('.styles_list').remove();
                $track.find('[onclick]').attr('onclick', '');
                $track.find('.filepodsafe').remove();
                var $title = $track.find('.title').find('a').prop('type', '_blank').removeAttr('onclick').removeAttr('amba');;
            }
            $(this.el).find('.track-placeholder').html(this.model.get('trackHtml'));
            if ($track.find('[ambatitle]').length > 0) {
                _.each($track.find('[ambatitle]'), function(elem) {
                    var popupText = $(elem).attr('ambatitle');
                    $(elem).popover({
                        content: popupText,
                        trigger: 'hover',
                        placement: 'bottom'
                    });
                });
            }
            this.scrollToActive();
        },


        scrollToActive: function() {
            if ($(this.el).find('.active').length > 0 && $(player.el).find('.active').length == 1) {
                if (!player.model.get('connecting')) {
                    $('html, body').animate({scrollTop: $('.active').offset().top - 50}, 'slow');
                }
            }
        }
    });

    var MixadanceView = RadioStationListItemView.extend({
        template: "#otherfm-template",

        onLogoClicked: function (e) {
            if (isPaused()) {
                if (!this.model.get('isActive')) {
                    this.model.loadTrackInfo();
                    this.model.set({
                        isActive: true
                    });
                    setLocalStorageItem('activeStationId', this.model.get('id'));
                    player.model.start(this.model.get('stream'));
                }
            } else {
                if (this.model.get('isActive')) {
                    this.model.set({
                        isActive: false,
                        isLoaded: false
                    });
                    removeLocalStorageItem('activeStationId');
                    player.model.stop();
                } else {
                    this.model.loadTrackInfo();
                    this.model.set({
                        isActive: true
                    });
                    player.model.start(this.model.get('stream'), getLocalStorageItem('activeStationId'));
                    setLocalStorageItem('activeStationId', this.model.get('id'));
                }
            }
        },

        afterRender: function() {
            $(this.el).find('.radio_logo').addClass("radio_" + this.model.get('name'));
            this.scrollToActive();
            var $title = $(this.el).find('.title');
            if ($title.length > 0) {
                $title.marquee({
                    //speed in milliseconds of the marquee
                    speed: 10000,
                    //gap in pixels between the tickers
                    gap: 20,
                    //'left' or 'right'
                    direction: 'left',
                    //true or false - should the marquee be duplicated to show an effect of continues flow
                    duplicated: true
                });
            }
        }
    });

    var DefaultRadioStationListView = BaseListView.extend({
        className: "radio-station-list",
        tagName: "ul",
        itemViewType: RadioStationListItemView
    });

    var MixadanceRadioStationListView = BaseListView.extend({
        className: "radio-station-list",
        tagName: "ul",
        itemViewType: MixadanceView
    });

    var RadioModel = BaseModel.extend({

        defaults: {
            connecting: false
        },

        initialize: function () {
            var activeStationId = getLocalStorageItem('activeStationId');
            this.defaultRadioList = new RadioStationList(getDefaultRadioStations());
            this.mixadanceRadioList = new RadioStationMixadanceList(getMixadanceRadioStations());
            this.othersRadioList = new RadioStationListWithoutTrackInfo(getRadioStationsWithoutTrackInfo());
        },

        getAudioElement: function () {
            return chrome.extension.getBackgroundPage().document.querySelector('audio');
        },

        start: function (stream, oldStationId) {
            if (oldStationId) {
                var model = this.findModelInRadioLists(oldStationId);
                model.set({
                    isActive: false,
                    isLoaded: false
                });
            }
            var self = this;
            this.connect(stream);
            //this.getAudioElement().addEventListener('error', this.connect);
            this.set({
                isPaused: this.getAudioElement().paused,
                connecting: true
            }, {silent: true});
            showLoader(true);
            chrome.extension.sendRequest({ msg: "startChecking" });
            if (this.get('checkConnectedId')) {
                clearInterval(this.get('checkConnectedId'));
            }
            this.set({
                checkConnectedId: setInterval(function () {
                    self.checkConnected();
                }, 1500)
            }, {silent: true});
        },

        findModelInRadioLists: function(id) {
            var model =  _.find(this.defaultRadioList.models, function(model) { return model.get('id') == id});
            if (model == undefined) {
                model = _.find(this.mixadanceRadioList.models, function(model) { return model.get('id') == id});
            }
            if (model == undefined) {
                model = _.find(this.othersRadioList.models, function(model) { return model.get('id') == id});
            }
            return model;
        },

        stop: function () {
            this.getAudioElement().pause();
            //this.getAudioElement().removeEventListener('error', this.connect, false);
            this.getAudioElement().src = null;
            this.set({
                isPaused: isPaused(),
                connecting: false
            }, {silent: true});
            showLoader(false);
            if (this.get('checkConnectedId')) {
                clearInterval(this.get('checkConnectedId'));
            }
            chrome.extension.sendRequest({ msg: "stopChecking" });
        },

        getCurrentTime: function () {
            return this.getAudioElement().currentTime;
        },

        prefetch: function(options) {
            this.parallel([this.defaultRadioList, this.mixadanceRadioList, this.othersRadioList, this], options);
        },

        fetch: function(options) {
            options.success();
        },

        parallel: function (params, options) {
            var self = this;
            var parallelStatus = 0;
            var length = params.length;
            var funcOptions = {
                success: function () {
                    parallelStatus += 1;
                    if (parallelStatus === length) {
                        if (options && options.success) {
                            options.success(self);
                        }
                    }
                },

                error: function () {
                    if (options && options.error) {
                        options.error(self);
                    }
                }
            };

            _(params).each(function (param) {
                if (_.isFunction(param)) {
                    param(funcOptions);
                } else {

                    if (param instanceof Backbone.Collection) {
                        var modelsLength = param.models.length;
                        var status = 0;
                        _.each(param.models, function(model) {
                            var myOptions = {
                                success: function(response) {
                                    status += 1;
                                    if (status == modelsLength) {
                                        if (funcOptions && funcOptions.success) {
                                            funcOptions.success(self);
                                        }
                                    }
                                }
                            };
                            model.fetch(myOptions);
                        });
                    } else {
                        param.fetch(funcOptions);
                    }
                }
            });
        },

        connect: function (stream) {
            if (_.isFunction(this.getAudioElement)) {
                if (stream) {
                    if (_.isFunction(this.getAudioElement)) {
                        this.getAudioElement().src = stream;
                    }
                }
            } else {
                chrome.extension.getBackgroundPage().document.querySelector('audio').play();
            }

        },

        XHRequest: function (method, url, async) {
            var xhr = new XMLHttpRequest();
            xhr.open(method, url, async);
            return xhr;
        },

        checkConnected: function () {
            var self = this;
            if (isPaused() && this.get('connecting') == false) {
                console.log("isPaused");
                clearInterval(self.get('checkConnectedId'));
            } else {
                console.log("currentTime is : " + self.getCurrentTime());
                if (self.getCurrentTime() == 0) {
                    var cnt = self.get('checksCount') || 0;
                    self.set({
                        checkCount: cnt++,
                        connecting: true
                    }, {silent: true});
                    console.log("showloader(true)");
                    showLoader(true);
                    //if (cnt > 5) {
                    //    self.getAudioElement().play();
                    //}
                } else {
                    clearInterval(self.get('checkConnectedId'));
                    self.set({
                        connecting: false
                    }, {silent: true});
                    console.log("showloader(false)");
                    showLoader(false);
                }
            }
        }
    });

    var radioModel = new RadioModel();

    var RadioView = BaseView.extend({
        el: '.global-container',
        template: "#radio-player-template",

        construct: function () {
            this.addChildAtElement('.radio-list-container', new DefaultRadioStationListView({
                collection: this.model.defaultRadioList
            }));

            this.addChildAtElement('.radio-list-container', new MixadanceRadioStationListView({
                collection: this.model.mixadanceRadioList
            }));

            this.addChildAtElement('.radio-list-container', new DefaultRadioStationListView({
                collection: this.model.othersRadioList
            }));
        },

        afterRender: function() {
            this.initVolumeSlider();
            $('a').click(function(){
                var href = $(this).attr('href');
                if (href != '#') {
                    chrome.tabs.create({url: href});
                }
                return false;
            });
        },

        initVolumeSlider: function () {
            var storageVolume = getLocalStorageItem('volume');
            if (storageVolume != this.model.getAudioElement().volume) {
                this.model.getAudioElement().volume = getLocalStorageItem('volume') == null ? 0.3 : storageVolume;
            }
            var volume = this.model.getAudioElement().volume;
            var $slider = $(".volume");
            this.initSlider($slider, this.model.get('isPaused'), volume);
        },

        initSlider: function (slider, paused, volume) {
            var self = this;
            slider.slider({
                range: "min",
                value: volume * 100,
                min: 0,
                max: 100,
                slide: function (event, ui) {
                    self.model.getAudioElement().volume = (ui.value / 100);
                    setLocalStorageItem('volume', ui.value / 100);
                }
            });
        }
    });

    var player;
    radioModel.prefetch({
        success: function (result) {
            try {
                player = new RadioView({
                    model : radioModel
                });
                player.render();
                workspace.radio = radioModel;
            } catch (ex) {
                console.log('Ошибка отрисовки страницы');
                console.log(ex);
            }
        },
        error: function(result) {
            //create error View here ^)
        }
    });

});
