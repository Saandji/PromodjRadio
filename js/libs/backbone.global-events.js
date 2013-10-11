/*
 * Backbone.GlobalEvents needs to would not be a garbage code within the Backbone
 * (the other words: within the Backbone should be only a code related to the Backbone)
 * for this we apply patterns IoC (inversion of control)
 *
 * for example: Every time when dom-element is removed we need to hide tooltip associated with it.
 * for this we fire triggers onDisposeView & onTemplateApplied within the appropriate backbone's methods
 * and we bind methods to these triggers where we realize our logic to hide tooltip
 *     within the Backbone
 *     dispose: function () {
 *         Backbone.GlobalEvents.trigger('onDisposeView', this);
 *         ...
 *     }
 *
 *     somewhere in other place
 *     Backbone.GlobalEvents.bind('onDisposeView', function removeTooltip (view) {
 *         ...
 *     });
 */
Backbone.GlobalEvents = _.extend({}, Backbone.Events);