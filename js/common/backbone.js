/**
 * Created with IntelliJ IDEA.
 * User: sshendyapin
 * Date: 06.10.13
 * Time: 15:57
 * To change this template use File | Settings | File Templates.
 */

var BaseModel = Backbone.Model.extend({

    /**
     * Default options that will be send with each fetch request (i.e. dataType)
     */
    fetchOptions: {},

    /**
     * Function that is used to prepare model (without firing reset event)
     */
    prefetch: function (options) {

        try {
            return this.fetch(options);
        } catch (ex) {
            if (options && options.success) {
                options.success(this);
            }
        }
    },

    /**
     * Fetches model from the server.
     *
     * @param options
     */
    fetch: function (options) {
        options = _.extend({}, this.fetchOptions, options);
        return Backbone.Model.prototype.fetch.call(this, options);
    }
});

var BaseView = Backbone.View.extend({

    /**
     * Sets model events bindings in declarative manner
     */
    modelEvents: {
        'change': 'render',
        'destroy': 'dispose'
    },

    /**
     * Event, that are dispatched through jquery.trigger.
     * Associative array, where the key is Backbone's event selector (like in "events" property),
     * and value is the name of the event to be triggered.
     */
    viewEvents: null,

    /**
     * Callbacks for DOM events. This collection is filled with "bind" function calls.
     * The actual binding is created after element has been added to DOM.
     */
    domEvents: null,

    initialize: function (options) {
        if (options) {
            this.controller = options.controller;
            if (options.anchor) {
                this.anchor = options.anchor;
            }
        }
        this.viewEvents = this.viewEvents || {};
        this.domEvents = this.domEvents || {};
        this._childViews = {};
        this.construct.apply(this, arguments);
        this._bindModelEvents();
    },

    /******************************************************************
     * Methods that could be overrided in classes that extends BaseView.
     ******************************************************************/

    construct: function () {
        // Do something after initialize
    },

    /**
     * Called after render has been finished
     */
    afterRender: function () {
    },

    /**
     * Called before render has been started
     */
    beforeRender: function () {
    },

    /**
     * Called if there was an error during render
     */
    onRenderError: function (ex) {
        Backbone.GlobalEvents.trigger("onRenderError", this, ex);
        if (Backbone.onRenderError) {
            Backbone.onRenderError(ex);
        }
    },

    /**
     * Called when jquery tmpl has been applied to this view's template.
     * If template is not set -- "rendered" parameter is null or undefined.
     *
     * @param rendered
     */
    onTemplateApplied: function (rendered) {
        if (rendered) {
            Backbone.GlobalEvents.trigger('onTemplateApplied', this, rendered);
            this.$el.html(rendered);
        }
    },

    /**
     * Called after view template has been applied.
     * Appends and renders all child views.
     * Resolves deferred object after this.
     */
    appendChildViews: function (dfd) {
        // Filling collection of deferreds and than waiting for them to finish.
        // We are doing this with one purpose: to call "afterRender"
        // after all childs has been  rendered only.
        var deferred = [];
        if (this._childViews) {
            var self = this;
            _(this._childViews).each(function (view) {
                deferred.push(self._appendChild(view));
            });
        }
        if (deferred.length === 0) {
            // No child views, resolving deferred
            dfd.resolve();
        } else {
            $.when.apply($, deferred).done(function () {
                // Resolving deferred after all childs has been rendered
                dfd.resolve();
            }).fail(function (ex) //noinspection JSLint
                {
                    dfd.reject(ex);
                });
        }
    },

    /**
     * Asynchronously loading and rendering specified template.
     * After template has been loaded -- rendering each of the child views.
     */
    renderView: function () {
        var self = this;
        var dfd = $.Deferred();

        try {
            TemplateManager.tmpl(this.template, this.modelJSON(), this.templateOptions()).done(function (rendered) {
                try {
                    self.onTemplateApplied(rendered);
                    self.appendChildViews(dfd);
                } catch (ex) {
                    console.log(ex);
                    console.log(self.template || self.el);
                    console.log(self.modelJSON());
                    dfd.reject(ex);
                }
            }).fail(function (ex) //noinspection JSLint
                {
                    // An error has happened while applying template
                    console.log(ex);
                    console.log(self.template);
                    console.log(self.modelJSON());
                    dfd.reject(ex);
                });
        } catch (ex) {
            console.log(ex);
            console.log(self.template);
            console.log(self.modelJSON());
            dfd.reject(ex);
        }

        return dfd.promise();
    },


    renderAsync: function () {
        var self = this;
        this.beforeRender();
        return this.renderView().done(function () {
            self._bindDomEvents();
            self.afterRender();
        }).fail(function (ex) //noinspection JSLint
            {
                self.onRenderError(ex);
            });
    },

    /**
     * Starts rendering this view asynchronously.
     * Returns "this".
     * You can use "renderAsync" function to get a deferred object
     */
    render: function () {
        this.renderAsync();
        // Returning this just after render has been started.
        return this;
    },

    /**
     * Returns model's json data.
     */
    modelJSON: function () {
        return this.model ? this.model.toJSON() : {};
    },

    /**
     * Returns template options you can use to render this map
     */
    templateOptions: function () {
        return {};
    },

    /******************************************************************
     * Methods, clearing resources being used.
     * Do not forget to call supertype's dispose if you override it.
     ******************************************************************/

    dispose: function () {
        Backbone.GlobalEvents.trigger('onDisposeView', this);
        this._unbindModelEvents();

        if (this.parent) {
            this.parent.removeChild(this);
        }

        this.remove();
        this.unbind();
        this.clear();
        /* Rewrite this method for custom model unbindings */
        if (this.onDispose) {
            this.onDispose();
        }
    },

    clear: function () {
        if (this._childViews) {
            _.each(this._childViews, function (view) {
                if (view && view.dispose) {
                    view.dispose();
                }
            });
            this._childViews = {};
        }
    },

    /******************************************************************
     * Using jquery to trigger and bind events (for bubbling to work).
     ******************************************************************/

    trigger: function (event) {
        if (arguments.length > 1) {
            this.$el.trigger(event, Array.prototype.slice.call(arguments).slice(1));
        } else {
            this.$el.trigger(event, this);
        }
    },

    /**
     * Binds DOM events
     * @param event
     * @param handler
     * @param context
     */
    bind: function (event, handler, context) {
        context = context || this;
        var callback = function (e) {
            handler.apply(context, Array.prototype.slice.call(arguments).slice(1));
        };
        this.domEvents[event] = callback;
        if (this._isElementInDom()) {
            this.$el.unbind(event);
            this.$el.bind(event, callback);
        }
    },

    /**
     * Does an actual binding to DOM events.
     * This function is called after this view's element
     * has been appended to the render tree
     */
    _bindDomEvents: function () {
        if (this.domEvents) {
            var self = this;
            _(this.domEvents).each(function (callback, event) {
                $(self.el).unbind(event);
                $(self.el).bind(event, callback);
            });
        }
    },

    /******************************************************************
     * Methods that should not be overrided
     * in classes that extend BaseView
     ******************************************************************/

    /**
     * Adds a nested view. Appends view's element to the child's element
     */
    addChild: function (view) {
        this.addChildAsync(view);
        return view;
    },

    /**
     * Async version of addChild.
     * Returns deferred object that signals when view has been added and rendered.
     * @param view
     */
    addChildAsync: function (view) {
        if (this._childViews[view.cid]) {
            return $.Deferred().resolve();
        }

        // Setting child view's controller
        if (this.controller && !view.controller) {
            view.controller = this.controller;
        }

        // Adding view to the child views collection
        this._childViews[view.cid] = view;
        view.parent = this;
        if (this._isElementInDom() || (jQuery && jQuery.browser && jQuery.browser.msie)) {
            return this._appendChild(view);
        }

        return $.Deferred().resolve();
    },

    addChildAtElement: function (selector, view, replaceAnchor) {
        view.anchor = selector;
        view.replaceAnchor = _.isBoolean(replaceAnchor) ? replaceAnchor : false;
        return this.addChild(view);
    },

    createChildView: function (Constructor, options) {
        var view = new Constructor(options);
        this.addChild(view);
        return view;
    },

    removeChild: function (view) {
        if (this._childViews) {
            var viewToRemove = this._childViews[view.cid];

            if (viewToRemove) {
                viewToRemove.remove();
            }

            delete this._childViews[view.cid];
        }

        view.parent = null;
    },

    /******************************************************************
     * Private methods (yeah, I know, there's no private in js).
     * Methods that should not be called from anywhere except BaseView.
     ******************************************************************/

    /**
     * Delegates events on all views tree
     */
    delegateEventsRecursive: function () {
        this.delegateEvents();
        _(this._childViews).each(function (view) {
            view.delegateEventsRecursive();
        });
    },

    /**
     * Overriding delegate events (to utilize viewEvents).
     */
    delegateEvents: function () {
        this.events = _.extend({}, this.events);
        if (this.viewEvents) {
            var self = this;
            _.each(this.viewEvents, function (value, key) {
                self._addViewEvent(key, value);
            });
        }
        Backbone.View.prototype.delegateEvents.call(this);
    },

    _addViewEvent: function (key, eventName) {
        var self = this;
        var func = function (e) {
            e.preventDefault();
            e.stopPropagation();
            self.trigger(eventName, self);
        };
        var funcName = '__' + this.cid + '_' + eventName;
        this[funcName] = func;
        this.events[key] = funcName;
    },


    /**
     * Binds model events to this view
     */
    _bindModelEvents: function () {
        var self = this;
        _(this.modelEvents).each(function (functionName, event) {
            var parts = event.split(' ');
            var bindTarget = parts.length > 1 ? parts[0] : 'model';
            var bindEvent = parts.length > 1 ? parts[1] : parts[0];

            // Getting binding target
            if (bindTarget === "this") {
                bindTarget = self;
            } else {
                bindTarget = self[bindTarget];
            }

            if (!bindTarget) {
                return;
            }

            // Getting callback function by its name
            var bindCallback = self[functionName];
            if (!bindCallback) {
                throw new Error('Callback function for event ' + event + ' is not found');
            }

            // Adding callback function to the inner collection
            self._modelCallbacks = self._modelCallbacks || [];
            function _bind(bindEvent) {
                var callback = {
                    target: bindTarget,
                    event: bindEvent,
                    callback: function () {
                        bindCallback.apply(self, arguments);
                    }
                };
                self._modelCallbacks.push(callback);

                // Binding to the target
                bindTarget.bind(bindEvent, callback.callback, self);
            }

            if (bindEvent.indexOf("change:") === 0) {
                var fields = bindEvent.substring(7);
                _.each(fields.split(','), function (field) {
                    _bind("change:" + field);
                });
            } else {
                _bind(bindEvent);
            }
        });
    },

    /**
     * Unbinds all model events
     */
    _unbindModelEvents: function () {
        if (!this._modelCallbacks) {
            // Callbacks are not set, returning
            return;
        }

        _(this._modelCallbacks).each(function (binding) {
            binding.target.unbind(binding.event, binding.callback);
        });
    },
    /**
     * Replaces targetEl element to replacementEl.
     * @param targetEl - target element.
     * @param replacementEl - replacement element.
     */
    _replaceWithElement: function (targetEl, replacementEl) {
        $(targetEl).replaceWith(replacementEl);
    },

    /**
     * Appends an element to the parentNode.
     * Could be overriden (for example -- if you need to prepend instead of append)
     * @param parentNode
     * @param el
     */
    _appendElement: function (parentNode, el) {
        $(parentNode).append(el);
    },

    /**
     * Appends child view to the parent element.
     * First appending the element to DOM,
     * then rendering view (<b>practice shows that this can be important</b>).
     * Returns deferred object that will be resolved when
     * child view is fully rendered.
     */
    _appendChild: function (view) {
        var parentNode = this.el;
        if (view.anchor) {
            parentNode = this.$(view.anchor).get(0);
        }

        // Double check on parent node
        if (view.el.parentNode !== parentNode) {

            // Adding or replacing view.el to the anchorElement
            if (view.replaceAnchor) {
                this._replaceWithElement(parentNode, view.el);
            } else {
                this._appendElement(parentNode, view.el);
            }
            if (this._isElementInDom()) {
                view.delegateEventsRecursive();
            }
        }
        return view.renderAsync();
    },

    _ensureElement: function () {
        var isDefinedEl = !!this.el;
        Backbone.View.prototype._ensureElement.apply(this, arguments);
    },

    _isElementInDom: function (el) {
        var element = el || this.el;
        if (el instanceof jQuery) {
            if (!el.length) {
                return false;
            }
            element = element[0];
        }
        while (element) {
            if (element === document) {
                return true;
            }
            element = element.parentNode;
        }

        return false;
    },

    insertInto: function (parentView, anchor, replaceAnchor) {
        if (anchor === undefined) {
            anchor = '.' + this.className.replace(/ +/g, '.');
            replaceAnchor = true;
        }
        parentView.addChildAtElement(anchor, this, replaceAnchor);
        return this;
    }
});

/**
 * Base class for a simple list view
 */
var BaseListView = BaseView.extend({

    modelEvents: {
        'collection add': 'onAdd',
        'collection reset': 'onReset',
        'collection remove': 'onRemove'
    },

    /**
     * Optional template for "pager" element.
     * If set -- pager is rendered just after this.el.
     */
    pagerTemplate: null,

    /**
     * This template is used when collection is loading next page
     */
    pagerLoadingTemplate: null,

    /**
     * This template is used when collection is empty
     */
    emptyListTemplate: null,

    /**
     * This template is used when collection has been loaded
     */
    pagerAllLoadedTemplate: null,

    /**
     * Pager can be positioned outside of the view element (before or after it)
     * or it can be positioned inside it.
     */
    pagerPosition: 'outside',

    /***************************************************************************************
     * ListView items rendering, adding and removing logic
     **************************************************************************************/

    /**
     * Initializes list view
     *
     * @param itemViewType View type that is used to render collection item.
     * @param sortDirection Defines where new element is added (to the head or tail)
     * @param collection Collection to be rendered
     */
    initialize: function (options) {
        options = options || {};
        this._itemViews = [];
        this.itemViewType = this.itemViewType || options.itemViewType;
        this.sortDirection = this.sortDirection || options.sortDirection || 'asc';
        BaseView.prototype.initialize.apply(this, arguments);

        if (this.collection.length > 0) {
            this._shouldInitialize = true;
        }
    },

    /**
     * Overriding modelJSON for BaseListView (we could need collection properties)
     */
    modelJSON: function () {
        var json = BaseView.prototype.modelJSON.call(this);
        json.collection = {};
        json.collection.length = this.collection.length;
        json.collection.allLoaded = this.collection.allLoaded;
        return json;
    },

    /**
     * Overriding _appendElement (because BaseListView can be sorted different ways)
     */
    _appendElement: function (parentNode, el) {
        // Calling either prepend or append depending on sortDirection
        if (this.sortDirection !== 'asc') {
            $(parentNode).prepend(el);
        } else {
            $(parentNode).append(el);
        }
    },

    createItemView: function (itemModel) {
        var itemView = new this.itemViewType({
            model: itemModel,
            controller: this.controller
        });
        return itemView;
    },

    /**
     * Overriding dispose to delete pagerElement if it is present
     */
    dispose: function () {
        if (this.pagerElement) {
            this.pagerElement.remove();
        }
        this._itemViews = [];
        BaseView.prototype.dispose.call(this);
    },

    renderView: function () {
        var dfd = BaseView.prototype.renderView.call(this);

        if (this._shouldInitialize) {
            this._shouldInitialize = false;
            return dfd.pipe(this.onReset());
        }
        return dfd.promise();
    },

    afterRender: function () {
        this.renderPager();
    },

    clearItems: function () {
        _(this._itemViews).each(function (view) {
            if (view && view.dispose) {
                view.dispose();
            }
        });
        this._itemViews = [];
    },

    onReset: function () {
        this.clearItems();
        var self = this;
        var deferred = [];
        this.collection.each(function (itemModel) {
            deferred.push(self.onAdd(itemModel));
        }, this);

        return $.when.apply($, deferred).done(self.renderPager());
    },

    onAdd: function (itemModel, collection, options) {
        //todo need to add view by options.index instead of option.at
        try {
            var view = this.createItemView(itemModel);
            if (view && options && options.at >= 0 && this._itemViews.length > 0) {
                this._itemViews.splice(options.at, 0, view);

                if (options.at == 0) {

                    var nextView = this._itemViews[options.at + 1];
                    if (this.sortDirection == 'asc') {
                        $(nextView.el).before(view.el);
                    } else {
                        $(nextView.el).after(view.el);
                    }
                } else {

                    var prevView = this._itemViews[options.at - 1];
                    if (this.sortDirection == 'asc') {
                        $(prevView.el).after(view.el);
                    } else {
                        $(prevView.el).before(view.el);
                    }
                }
            } else {
                this._itemViews.push(view);
            }
            return this.addChildAsync(view);
        } catch (ex) {
            if (Backbone.onRenderError) {
                this.onRenderError(ex);
            }
            return ex;
        }
    },

    onRemove: function (itemModel) {
        var self = this;
        _(this._itemViews).each(function (view, index) {
            if (view.model == itemModel) {
                view.dispose();
                self._itemViews.splice(index, 1);
            }
        });
    },

    findViewByModel: function (model) {
        return _.find(this._itemViews, function (view) {
            return view.model == model;
        });
    },

    getViews: function () {
        return _.clone(this._itemViews);
    },

    /***************************************************************************************
     * ListView paging logic
     **************************************************************************************/

    addPagerElement: function (pager) {
        if (this.pagerElement) {
            this.pagerElement.remove();
        }
        this.pagerElement = pager;

        if (!this.pagerElement) {
            return;
        }

        if (this.sortDirection != 'asc') {
            if (this.pagerPosition == 'outside') {
                this.$el.before(this.pagerElement);
            } else {
                this.$el.prepend(this.pagerElement);
            }
        } else {
            if (this.pagerPosition == 'outside') {
                this.$el.after(this.pagerElement);
            } else {
                this.$el.append(this.pagerElement);
            }
        }
    },

    renderPagerElement: function () {
        if (this.pagerElement) {
            this.pagerElement.remove();
        }
        if (this.pagerTemplate && !this.collection.allLoaded) {
            var self = this;
            $.when(TemplateManager.tmpl(this.pagerTemplate, this.modelJSON(), this)).done(function (pager) {
                pager.click(function (e) {
                    self.onPagerClicked(e);
                });
                self.addPagerElement(pager);
            });
        }
    },

    renderLoaderElement: function () {
        if (this.pagerLoadingTemplate && !this.collection.allLoaded) {
            var self = this;
            $.when(TemplateManager.tmpl(this.pagerLoadingTemplate, this.modelJSON(), this)).done(function (pager) {
                self.addPagerElement(pager);
            });
        } else {
            this.addPagerElement(null);
        }
    },

    renderEmptyListElement: function () {
        if (this.emptyListTemplate && this.collection.allLoaded && this.collection.length == 0) {
            var self = this;
            $.when(TemplateManager.tmpl(this.emptyListTemplate, this.modelJSON(), this)).done(function (pager) {
                self.addPagerElement(pager);
            });
        }
    },

    renderAllLoadedElement: function () {
        var self = this;
        if (this.pagerAllLoadedTemplate && this.collection.allLoaded) {
            $.when(TemplateManager.tmpl($(this.pagerAllLoadedTemplate).template(), this.modelJSON(), this)).done(function (pager) {
                self.addPagerElement(pager);
            });
        } else if (this.collection.allLoaded && this.collection.length == 0 && this.emptyListTemplate) {
            $.when(TemplateManager.tmpl($(this.emptyListTemplate).template(), this.modelJSON(), this)).done(function (pager) {
                self.addPagerElement(pager);
            });
        } else {
            this.addPagerElement(null);
        }
    },

    renderPager: function () {
        if (this.collection.length >= this.collection.limit && this.collection.limit > 0) {
            // Double check on collection length (because allLoaded property is set after 'reset' event is invoked)
            this.renderPagerElement();
        } else {
            this.renderAllLoadedElement();
        }
    },

    onPagerClicked: function (e) {
        e.preventDefault();
        this.loadNext();
    },

    loadNext: function () {
        if (this._loading) {
            return;
        }
        this._loading = true;
        this.renderLoaderElement();
        var self = this;
        this.collection.loadNext({
            success: function () {
                self.onPageLoaded();
                self._loading = false;
            },
            error: function () {
                self._loading = false;
            }
        });
    },

    onPageLoaded: function () {
        if (this.collection.allLoaded) {
            this.renderAllLoadedElement();
        } else {
            this.renderPagerElement();
        }
    }
});