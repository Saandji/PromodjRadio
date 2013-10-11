var workspace = {};
$(function () {
    var getLocalStorageItem = function(key) {
        return localStorage.getItem(key)
    };

    var setLocalStorageItem = function(key, value) {
        localStorage.removeItem(key);
        localStorage.setItem(key, value);
    };

    var isPaused = function() {
        return chrome.extension.getBackgroundPage().document.querySelector('audio').paused;
    };

    var getDefaultRadioStations = function () {
        return [
        /**
         * specify next fields:
         *
         * radioId - radio identifier
         * stream - radio stream src
         * name -  radio name to display
         *
         * @type {RadioStationListItem}
         */
            {
                id: 0,
                name: 'channel5',
                stream: "http://radio.maases.com:8000/channel5-192"
            },
            {
                id: 1,
                name: 'fullmoon',
                stream: "http://radio.maases.com:8000/fullmoon-192"
            },
            {
                id: 2,
                name: 'nu',
                stream: "http://radio.maases.com:8000/nu-192"
            },
            {
                id: 3,
                name: 'deep',
                stream: "http://radio.maases.com:8000/deep-192"
            },
            {
                id: 4,
                name: '300kmh',
                stream: "http://radio.maases.com:8000/300kmh-192"
            },
            {
                id: 5,
                name: 'mini',
                stream: "http://radio.maases.com:8000/mini-192"
            },
            {
                id: 6,
                name: 'oldschool',
                stream: "http://radio.maases.com:8000/oldschool-192"
            },
            {
                id: 7,
                name: 'vata',
                stream: "http://radio.maases.com:8000/vata-192"
            },
            {
                id: 8,
                name: 'brainfck',
                stream: "http://radio.maases.com:8000/brainfck-192"
            },
            {
                id: 9,
                name: 'strange',
                stream: "http://radio.maases.com:8000/strange-192"
            },
            {
                id: 10,
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
            audioElement: null,
            connecting: false,
            songUpdateIntervalId: 0,
            checkConnectedId: null,
            trackName: "",
            trackUrl: null,
            commentsCount: "",
            commentsUrl: null,
            downloadCount: "",
            downloadUrl: null,
            ballsCount: "",
            ballsUrl: null,
            bitRate: "",
            biyRateUrl: null,
            trackTime: "",
            trackHtml: ""
        },

        initialize: function() {
            this.set({isActive: getLocalStorageItem('activeStationId') == this.get('id') && isPaused()});
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
            this.model.set({
                isActive: true
            });
            setLocalStorageItem('activeStationId', this.model.get('id'));
            this.model.get('radioModel').start(this.model.get('stream'));
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

        initialize: function () {
            var self = this;
            var activeStationId = getLocalStorageItem('activeStationId');
            var radioList = new RadioStationList(getDefaultRadioStations());
            this.set({
                radioList: radioList
            });
            _.each(this.get('radioList'), function(model) {
                model.set({
                    radioModel: self
                })
            });
        },

        getAudioElement: function () {
            return chrome.extension.getBackgroundPage().document.querySelector('audio');
        },

        start: function (stream) {
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
                isPaused: isPaused()
            });
        },

        getCurrentTime: function () {
            return this.getAudioElement().currentTime;
        },

        prefetch: function(options) {
            var self = this;
            $.ajax({
                url: 'http://promodj.com/ajax/radio2_playlist.html',
                digest: 'digest=1894188:~cf0636b2aafc95faa4aecf20c7df5997',
                channelID: 11,

                success: function(response) {
                    self.parseResponse(response, options);
                }
            });
        },

        connect: function (stream) {
            this.getAudioElement().src = stream;
            this.getAudioElement().play();
        },

        XHRequest: function (method, url, async) {
            var xhr = new XMLHttpRequest();
            xhr.open(method, url, async);
            return xhr;
        },

        downloadTrackInfo: function () {
            var self = this;
            if (this.get('domain') != "") {
                var request = this.XHRequest("get", this.get('domain'), true);
                request.onreadystatechange = function () {
                    if (request.readyState === 4 && request.status === 200) {
                        self.parseResponse(request.responseText);
                    }
                };
                request.send();
            } else {
                window.clearInterval(this.get('songUpdateIntervalId'));
                $('.covered-container').css('background-image', "url(" + this.get('bigLogoImageUrl') + ")");
            }
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

        compareTrackInfo: function (artist, song) {
            if (this.get('artist') != artist && this.get('song') != song) {
                this.set({
                    artist: artist,
                    song: song
                });
                this.downloadCover("track", 3, escape(artist.replace(/\s/g, '+')), escape(song.replace(/\s/g, '+')));
            }
        },

        downloadCover: function (coverType, size, artist, song) {
            var self = this;
            var url = 'http://ws.audioscrobbler.com/2.0/?method=' + coverType + '.getinfo&api_key=' + this.get('apiKey') + '&artist=' + artist + '&track=' + song;
            var request = this.XHRequest("get", url, false);
            request.onload = function () {
                self.saveCoverUrl(request.responseXML, coverType, size, artist, song);
            };
            request.send();
        },

        saveCoverUrl: function (coverXML, coverType, size, artist, song) {
            if (coverXML) {
                var coverTag = coverXML.getElementsByTagName("image")[size];
                if (coverTag && coverTag.textContent) {
                    this.set({
                        cover: coverTag.textContent
                    });
                } else if (coverType == 'track') {
                    this.downloadCover('artist', 3, artist, song);
                } else {
                    this.set({
                        cover: null
                    });
                }
            }
        },

        checkConnected: function () {
            var self = this;
            if (this.isPaused()) {
                clearInterval(self.get('checkConnectedId'));
            } else {
                if (self.getCurrentTime() == 0) {
                    self.set({
                        connecting: true
                    });
                } else {
                    //self.downloadTrackInfo();
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
                chrome.tabs.create({url: $(this).attr('href')});
                return false;
            });
        },

        initVolumeSlider: function () {
            var volume = getLocalStorageItem('volume') ? getLocalStorageItem('volume') : 0.7;
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
                    setLocalStorageItem(ui.volume / 100);
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
        }
    });

//    var player = new RadioView({
//        model: radioModel
//    });
//    radioModel.trigger('change');
});

//http://stream04.media.rambler.ru/megapolis128.mp3



