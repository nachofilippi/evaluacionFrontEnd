var _      = require('lodash');
var url    = require('url');
var logger = require('./logger').getInstance();

module.exports = {
    createConfig: createConfig
};

function createConfig(context, opts) {
    // structure of config object to be returned
    var config = {
        context: undefined,
        options: {}
    };

    // app.use('/api', proxy({target:'http://localhost:9000'}));
    if (isContextless(context, opts)) {
        config.context = '/';
        config.options = _.assign(config.options, context);
    }
    // app.use('/api', proxy('http://localhost:9000'));
    // app.use(proxy('http://localhost:9000/api'));
    else if (isStringShortHand(context)) {
        var oUrl   = url.parse(context);
        var target = [oUrl.protocol, '//', oUrl.host].join('');

        config.context = oUrl.pathname || '/';
        config.options = _.assign(config.options, {target: target}, opts);

        if (oUrl.protocol === 'ws:' || oUrl.protocol === 'wss:') {
            config.options.ws = true;
        }
    // app.use('/api', proxy({target:'http://localhost:9000'}));
    } else {
        config.context = context;
        config.options = _.assign(config.options, opts);
    }

    configureLogger(config.options);

    if (!config.options.target) {
        throw new Error('[HPM] Missing "target" option. Example: {target: "http://www.example.org"}');
    }

    // Legacy option.proxyHost
    config.options = mapLegacyProxyHostOption(config.options);

    return config;
}

/**
 * Checks if a String only target/config is provided.
 * This can be just the host or with the optional path.
 *
 * @example
 *      app.use('/api', proxy('http://localhost:9000'));
        app.use(proxy('http://localhost:9000/api'));
 *
 * @param  {String}  context [description]
 * @return {Boolean}         [description]
 */
function isStringShortHand(context) {
    if (_.isString(context)) {
        return (url.parse(context).host) ? true : false;
    }
}

/**
 * Checks if a Object only config is provided, without a context.
 * In this case the all paths will be proxied.
 *
 * @example
 *     app.use('/api', proxy({target:'http://localhost:9000'}));
 *
 * @param  {Object}  context [description]
 * @param  {*}       opts    [description]
 * @return {Boolean}         [description]
 */
function isContextless(context, opts) {
    return (_.isPlainObject(context) && _.isEmpty(opts));
}

function mapLegacyProxyHostOption(options) {
    // set options.headers.host when option.proxyHost is provided
    if (options.proxyHost) {
        logger.warn('*************************************');
        logger.warn('[HPM] Deprecated "option.proxyHost"');
        logger.warn('      Use "option.changeOrigin" or "option.headers.host" instead');
        logger.warn('      "option.proxyHost" will be removed in future release.');
        logger.warn('*************************************');

        options.headers = options.headers || {};
        options.headers.host = options.proxyHost;
    }

    return options;
}

function configureLogger(options) {
    if (options.logLevel) {
        logger.setLevel(options.logLevel);
    }

    if (options.logProvider) {
        logger.setProvider(options.logProvider);
    }
}
