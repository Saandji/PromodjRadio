var workspace = {};
$(function () {
   var getLocalStorageItem = function(key) {
        return localStorage.getItem(key)
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
            },
            {
                id: 19,
                name: 'garagefm',
                channelID: 11,
                stream: "http://radio.maases.com:8000/garagefm-192"
            },
            {
                id: 20,
                name: 'mixadancefm',
                channelID: 23,
                stream: "http://radio.maases.com:8000/mixadancefm-192"
            },
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
        ];
    };

    var RadioStationListItemModel = BaseModel.extend({

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
            isActive: false
        },

        initialize: function() {
            var id = this.get('id');
            var isActive = getLocalStorageItem('activeStationId') == id && !isPaused();

            if (isActive && (id < 19)) {
                this.loadTrackInfo();
            }
            this.set({
                isActive: isActive,
                isLoaded: isActive
            });
        },

        loadTrackInfo: function() {
            var self = this;
            if (this.get('id') == 20) {
                this.loadMixadanceInfo();
            } else {
                $.ajax({
                    url: 'http://promodj.com/ajax/radio2_playlist.html',
                    data: {
                        digest: 'digest=1894188:~cf0636b2aafc95faa4aecf20c7df5997',
                        channelID: self.get('channelID')
                    },
                    timeout: 5000,
                    success: function(response) {
                        self.parseResponse(response);
                    }
                });
            }
        },

        loadMixadanceInfo: function() {
            var self = this;
            $.ajax({
                url: 'http://online.mixadance.fm/song.php?tr=2',
                timeout: 5000,
                success: function(response) {
                    console.log("loadMixadance success");
                    if (response) {
                        console.log(response);
                        console.log($(response)[1]);
                        self.set({
                            trackNameHtml: $(response)[1],
                            isLoaded: true
                        });
                    }
                },

                error: function() {
                    console.log("loadMixadance error");
                    self.set({
                        isLoaded: true
                    });
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
        },

        getPromoDJSearchLink: function(trackName) {
            return "http://promodj.com/search?searchfor=" + encodeURIComponent(trackName) + "&mode=all&sortby=relevance&period=all";
        }
    });

    var RadioStationList = Backbone.Collection.extend({
        model: RadioStationListItemModel
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
                    if (this.model.get('id') < 19 || this.model.get('id') == 20) {
                        this.model.loadTrackInfo();
                    }
                    this.model.set({
                        isActive: true
                    });
                    setLocalStorageItem('activeStationId', this.model.get('id'));
                    this.model.get('radioModel').start(this.model.get('stream'));
                }
            } else {
                if (this.model.get('isActive')) {
                    this.model.set({
                        isActive: false,
                        isLoaded: false
                    });
                    removeLocalStorageItem('activeStationId');
                    this.model.get('radioModel').stop();
                } else {
                    if (this.model.get('id') < 19 || this.model.get('id') == 20) {
                        this.model.loadTrackInfo();
                    }
                    this.model.set({
                        isActive: true
                    });
                    this.model.get('radioModel').start(this.model.get('stream'), getLocalStorageItem('activeStationId'));
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
                //if (this.model.get('id') == 20) { //feel mixadance track info
                //    var trackHtml = '<a target="_blank" href="' + this.model.getPromoDJSearchLink($(this.model.get('trackNameHtml')).text()) + '">' + $(this.model.get('trackNameHtml')).text() + '</a>';
                //    $track.find('.title').html(trackHtml);
                //    $track.find('.track').addClass('mixadancefm_track');
                //    $track.find('.icons').remove();
                //}
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
        }
    });

    var RadioStationListView = BaseListView.extend({
        className: "radio-station-list",
        tagName: "ul",
        itemViewType: RadioStationListItemView
    });

    var RadioModel = BaseModel.extend({

        defaults: {
            connecting: false
        },

        initialize: function () {
            var self = this;
            var activeStationId = getLocalStorageItem('activeStationId');
            var radioList = new RadioStationList(getDefaultRadioStations());
            this.set({
                radioList: radioList
            });
            _.each(this.get('radioList').models, function(model) {
                model.set({
                    radioModel: self
                })
            });
        },

        getAudioElement: function () {
            return chrome.extension.getBackgroundPage().document.querySelector('audio');
        },

        start: function (stream, oldStationId) {
            if (oldStationId) {
                this.get('radioList').at(oldStationId).set({
                    isActive: false,
                    isLoaded: false
                });
            }
            var self = this;
            this.connect(stream);
            this.getAudioElement().addEventListener('error', this.connect);
            this.set({
                isPaused: this.getAudioElement().paused,
                connecting: true
            });
            if (this.get('checkConnectedId')) {
                clearInterval(this.get('checkConnectedId'));
            }
            this.set({
                checkConnectedId: setInterval(function () {
                    self.checkConnected();
                }, 1500)
            }, {silent: true});
        },

        stop: function () {
            this.getAudioElement().pause();
            this.getAudioElement().removeEventListener('error', this.connect, false);
            this.getAudioElement().src = null;
            this.set({
                isPaused: isPaused(),
                connecting: false
            });
            if (this.get('checkConnectedId')) {
                clearInterval(this.get('checkConnectedId'));
            }
        },

        getCurrentTime: function () {
            return this.getAudioElement().currentTime;
        },

        prefetch: function(options) {
            options.success();
        },

        connect: function (stream) {
            if (stream) {
                this.getAudioElement().src = stream;
            }
            this.getAudioElement().play();
        },

        XHRequest: function (method, url, async) {
            var xhr = new XMLHttpRequest();
            xhr.open(method, url, async);
            return xhr;
        },

        checkConnected: function () {
            var self = this;
            if (isPaused()) {
                clearInterval(self.get('checkConnectedId'));
            } else {
                if (self.getCurrentTime() == 0) {
                    var cnt = self.get('checksCount') || 0;
                    self.set({
                        checkCount: cnt++,
                        connecting: true
                    });
                    if (cnt > 5) {
                        self.getAudioElement().play();
                    }
                } else {
                    clearInterval(self.get('checkConnectedId'));
                    self.set({
                        connecting: false
                    });
                }
            }
        }
    });

    var radioModel = new RadioModel();

    var RadioView = BaseView.extend({
        el: '.global-container',
        template: "#radio-player-template",

        construct: function () {
            this.addChildAtElement('.radio-list-container', new RadioStationListView({
                collection: this.model.get('radioList')
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
            this.scrollToActive();
        },

        scrollToActive: function() {
            var activeStation = $(this.el).find('.active');
            if (activeStation.length > 0 && !this.model.get('connecting')) {
                $('html, body').animate({scrollTop: $('.active').offset().top - 50}, 'slow');
            }
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
