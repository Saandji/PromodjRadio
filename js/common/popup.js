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
                stream: "http://radio.maases.com:8000/top100-192"
            },
            {
                id: 1,
                name: 'channel5',
                stream: "http://radio.maases.com:8000/channel5-192"
            },
            {
                id: 2,
                name: 'klubb',
                stream: "http://radio.maases.com:8000/klubb-192"
            },
            {
                id: 3,
                name: 'dubstep',
                stream: "http://radio.maases.com:8000/dubstep-192"
            },
            {
                id: 4,
                name: 'pop',
                stream: "http://radio.maases.com:8000/pop-192"
            },
            {
                id: 5,
                name: 'nu',
                stream: "http://radio.maases.com:8000/nu-192"
            },
            {
                id: 6,
                name: 'toonu',
                stream: "http://radio.maases.com:8000/toonu-192"
            },
            {
                id: 7,
                name: 'yo',
                stream: "http://radio.maases.com:8000/yo-192"
            },
            {
                id: 8,
                name: 'fullmoon',
                stream: "http://radio.maases.com:8000/fullmoon-192"
            },
            {
                id: 9,
                name: 'bobina',
                stream: "http://radio.maases.com:8000/bobina-192"
            },
            {
                id: 10,
                name: '300kmh',
                stream: "http://radio.maases.com:8000/300kmh-192"
            },
            {
                id: 11,
                name: '186mph',
                stream: "http://radio.maases.com:8000/186mph-192"
            },
            {
                id: 12,
                name: 'deep',
                stream: "http://radio.maases.com:8000/deep-192"
            },
            {
                id: 13,
                name: 'toodeep',
                stream: "http://radio.maases.com:8000/toodeep-192"
            },
            {
                id: 14,
                name: 'mini',
                stream: "http://radio.maases.com:8000/mini-192"
            },
            {
                id: 15,
                name: 'oldschool',
                stream: "http://radio.maases.com:8000/oldschool-192"
            },
            {
                id: 16,
                name: 'vata',
                stream: "http://radio.maases.com:8000/vata-192"
            },
            {
                id: 17,
                name: 'brainfck',
                stream: "http://radio.maases.com:8000/brainfck-192"
            },
            {
                id: 18,
                name: 'strange',
                stream: "http://radio.maases.com:8000/strange-192"
            },
            {
                id: 19,
                name: 'garagefm',
                stream: "http://radio.maases.com:8000/garagefm-192"
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
            trackHtml: ""
        },

        initialize: function() {
            this.set({isActive: getLocalStorageItem('activeStationId') == this.get('id') && !isPaused()});
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
                    this.model.set({
                        isActive: true
                    });
                    setLocalStorageItem('activeStationId', this.model.get('id'));
                    this.model.get('radioModel').start(this.model.get('stream'));
                }
            } else {
                if (this.model.get('isActive')) {
                    this.model.set({
                        isActive: false
                    });
                    removeLocalStorageItem('activeStationId');
                    this.model.get('radioModel').stop();
                } else {
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
            }
            $(this.el).find('.track-placeholder').html(this.model.get('trackHtml'));
            _.each($track.find('[ambatitle]'), function(elem) {
                var popupText = $(elem).attr('ambatitle');
                $(elem).popover({
                    content: popupText,
                    trigger: 'hover',
                    placement: 'bottom'
                });
            });
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
                this.get('radioList').at(oldStationId).set({isActive: false});
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
            var self = this;
            $.ajax({
                url: 'http://promodj.com/ajax/radio2_playlist.html',
                data: {
                    digest: 'digest=1894188:~cf0636b2aafc95faa4aecf20c7df5997',
                    channelID: 11
                },
                timeout: 5000,
                success: function(response) {
                    self.parseResponse(response, options);
                },

                error: function(response) {
                    options.error(response);
                }
            });
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

        parseResponse: function (responseText, options) {
            if (responseText) {
                for (var i = 0; i < getDefaultRadioStations().length - 1; i++) {
                    this.get('radioList').at(i).set({trackHtml: $(responseText).find('.track')[i]});
                }
                if (_.isFunction(options.success)) {
                    options.success();
                }
            }
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
            var activeStation = $(this.el).find('.active');
            if (activeStation.length > 0) {
                $('html, body').animate({scrollTop: $('.active').offset().top}, 'slow');
            }
        },

        initVolumeSlider: function () {
            var volume = getLocalStorageItem('volume') || 0.7;
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
