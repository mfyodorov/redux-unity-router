import pathToRegexp from 'path-to-regexp';
import { stringify as qsStringify } from 'query-string';
import { createPath } from 'history';
import { flattenRoutes } from './util';
import RouterError from '../error';

const ERRORS = {
    noId: _ => 'Can\'t match route with no id',
    notFound: id => `Route with id ${id} not found`
};

const createMatchRouteToPath = registry => ({ id, params = {}, query = {}, hash = ''}) => {
    if (id === undefined) throw new RouterError(ERRORS.noId());

    const matcher = registry[id];

    if (matcher === undefined) throw new RouterError(ERRORS.notFound(id));

    let pathname;

    try {
        // remove front trailing backslash (disable '//' situation)
        Object.keys(params).forEach(name => {
            params[name] = String(params[name] || '').replace(/^\//, '');
        });

        // path-to-regexp (2.4.0): encodeURI by default, disable it with encode option
        // 'pretty' flag disable all encoding, besides '/', '?', '#'
        pathname = matcher(params, { encode: value => value });
    } catch (e) {
        throw new RouterError(e.toString());
    }

    const location = {
        search: qsStringify(query),
        pathname,
        hash
    };

    return createPath(location);
};

const createRouteToLocationParser = routes => {

    const registry = flattenRoutes(routes).reduce((result, item) => {
        if (result[item.id]) {
            return result;
        }
        result[item.id] = pathToRegexp.compile(item.pattern.path);
        return result;
    }, {});

    return createMatchRouteToPath(registry);
};

export default createRouteToLocationParser;