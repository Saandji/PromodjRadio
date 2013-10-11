/**
 * Created with IntelliJ IDEA.
 * User: sshendyapin
 * Date: 11.08.13
 * Time: 0:16
 * To change this template use File | Settings | File Templates.
 */
var TemplateManager = {

    /**
     * Compiled templates cache
     */
    compiledTemplates: {},

    tmpl: function (template, data, options) {
        var dfd = $.Deferred();

        if (!template) {
            // Template is not set, resolving deferred immediately
            dfd.resolve();
        } else if (typeof (template) != 'string') {

            // This is compiled template.
            // Resolving or rejecting depending on render result
            TemplateManager.applyTemplate(template, data, options, dfd);
        } else if (TemplateManager.compiledTemplates[template]) {

            // Template is already compiled, applying it
            TemplateManager.applyTemplate(TemplateManager.compiledTemplates[template], data, options, dfd, template);
        } else {

            // Fetching and compiling template. Applying it after this.
            TemplateManager.fetchAndCompileTemplate(template, data, options, dfd);
        }

        return dfd.promise();
    },

    fetchAndCompileTemplate: function (template, data, options, dfd) {
        try {
            // File with templates has been loaded, compiling template
            TemplateManager.compiledTemplates[template] = $(template).template();
            TemplateManager.applyTemplate(TemplateManager.compiledTemplates[template], data, options, dfd, template);
        } catch (ex) {
            console.log(ex);
            console.log(template);
            console.log(data);
            var templateObj = template && _.isFunction(template) ? template() : template;
            var exObj = {template: templateObj, data: data, error: ex};
            dfd.reject(exObj);
        }
    },

    applyTemplate: function (template, data, options, dfd, templateName) {
        try {
            var rendered = $.tmpl(template, data, options);
            dfd.resolve(rendered);
        } catch (ex) {
            var exObj = {template: templateName, data: data, error: ex};
            dfd.reject(exObj);
        }
    }

};