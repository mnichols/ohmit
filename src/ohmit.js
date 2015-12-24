"use strict";

import stampit from 'stampit'
import Promise from 'bluebird'
import clone from 'clone'
import {parse as parseUrl} from 'url'

export default ohmit

let ROOT_KEY = '_root';
let index = stampit()
    .static({
        build: function(spec) {
            return index({
                spec: spec
            })
        }
    })
    .props({
        spec: {}
    })
    .init(function() {
        const keys = Object.keys(this.spec), path2Keys = {};
            ;

        function isString(obj) {
            return toString.call(obj) == '[object String]'
        }
        function split(path) {
            return path.split('/')
                .filter(p => {
                    return !!p.length
                })
        }
        function join(arr) {
            return `/${arr.join('/')}`
        }
        function parameterize(rel, params) {
            if(!params) {
                return rel
            }
            return `${rel}?${JSON.stringify(params)}`
        }
        function mapPath2Key(path, key) {
            let arr;
            path2Keys[path] = arr = (path2Keys[path] || [])
            arr.push(key)
        }
       /**
        * Pre-calculate paths and relationships for requests later on.
        * Maps parameterized full paths to objects having:
        * - `keys` : {Array} of spec keys that would compile to this path
        * - `length` : {Number} of rels comprising the path
        *   `rels` : {Array} of objects providing data for making requests including:
        *       - `rel` : {String} relationship to follow
        *       - `params` : {Object} of params to include in request
        *       - `cacheKey` : {String} of parameterized path
        **/
        const pathMap = keys.reduce(function(map, key, index) {
            //special handling for _root key
            //always inserting a '/' path into the map
            if(key === ROOT_KEY) {
                mapPath2Key('/', key)
                map['/'] = {
                    path: '/'
                    , length: 0
                    , rels: []
                    , keys: [key]
                }
                return map
            }
            const value = this.spec[key];
            let fullpath = (isString(value) ? value : value._path);
            const fullparams = (value._params || {});
            const rels = split(fullpath || '/');
            const len = rels.length;
            //only provide a link to this node; do not GET it
            const link = !!value._link;
            //accumulated, parameterized path
            let pPath = '';

            //eg special '/' path
            //if provided then the root will appear alongside
            //other mementos as {key}
            if(len === 0) {
                mapPath2Key(fullpath, key)
                map[fullpath] = {
                    path: (fullpath || '/')
                    , length: len
                    , rels: []
                    , keys: [key]
                }
                return map
            }

            //accumulator for parts of the path
            const parts = new Array(len);

            //walk the parts of the path to
            //build object for making requests using follow
            for(let i = 0; i < len; i++) {
                const rel = rels[i];
                const params = fullparams[rel];
                // eg 'b?{"foo":"bar"}'
                const path = parameterize(rel, params);
                // eg '/a/b?{"foo":"bar"}'
                pPath = `${pPath}/${path}`

                //this is used during the .get request and subsequent
                //caching of its results
                parts[i] = {
                    rel: rel
                    ,params: (params || {})
                    , link: link
                    , cacheKey : pPath
                }
                if(map[pPath]) {
                    map[pPath].keys.push(key)
                } else {
                    map[pPath] = {
                        keys: [key]
                        , path: pPath
                        , length: i + 1
                        , rels: parts.slice(0, i + 1)
                    }
                }
                //index paths mapped to the paths for easy retrieval later
                if(i===len - 1) {
                    mapPath2Key(pPath, key)
                }
            }
            return map

        }.bind(this),{});

        //precalculate the optimized, ordered array of paths
        const optimized = Object.keys(pathMap)
            .sort((a, b) => {
                const aLen = pathMap[a].length, bLen = pathMap[b].length;
                if(aLen < bLen) {
                    return -1
                }
                if(aLen > bLen) {
                    return 1
                }
                return 0
            })
            .map(key => {
                return pathMap[key]
            });

        Object.assign(this, {
            optimized() {
                return optimized
            }
            ,rootNode() {
                let value = this.spec[ROOT_KEY], resource = (value._resource ? value._resource : false);

                //passed in resource as root
                if(value.self && value.get) {
                    resource = value
                }
                const url  = resource ? resource.self : ((isString(value) ?  value : value._url));
                const parsed = parseUrl(url);
                const node = {
                    url: url
                    , params: resource ? {} : (value._params || {})
                    , resource: resource
                    , protocol: parsed.protocol
                    , hostname: parsed.hostname
                    , pathname: parsed.pathname
                };
                if(!node.url) {
                    throw new Error(`${ROOT_KEY} must provide '_url'`)
                }

                return node
            }
            ,keysForPath(path) {
                return (path2Keys[path] || [])
            }
        })
    });



/**
 * encapsulates http access and traversal of the api
 * while caching common paths
 * */
function requests(cfg) {
    return stampit()
        .props({
            indexed: cfg.indexed
            ,opts: cfg.opts
            , resourceFactory: cfg.resourceFactory
        })
        .init(function() {
            const resourceFactory = this.resourceFactory;

            function isResource(obj) {
                return (obj.self && obj.get && obj.follow)
            }

            function parseRequest(request) {
                if(isResource(request)) {
                    return request
                }
                const response = request.response;
                const body = response && response.body, allow = response && response.headers && response.headers.allow;

                return resourceFactory.parse({
                        self: body._links.self.href
                        ,body: body
                        ,allow: allow
                    })
            }
            function parse(requests) {
                requests = [].concat(requests)
                return requests.map(parseRequest.bind(this))
            }

            function flatten(results) {
                return [].concat.apply([],results)
            }

           /**
            * follows the relationship and parses the responses
            * to proper halibuts
            * @return {Array} of halibuts
            * */
            function executeRel(rel, rels, responseCache, res) {
                return res.follow(rel.rel)
                    .bind(this)
                    .then(parse)
                    .then(resources => {
                        if(!!rel.link) {
                            return resources
                        }
                        return Promise.map(resources, function(it) {
                            return it.get({ params: rel.params })
                        }.bind(this))
                    })
                    .then(parse)
            }
            /**
             * walk the rels from `index` and update cache with results
             * */
            function executeRels(rels, index, responseCache, res) {
                res = parse(res)
                if(!rels.length || index >= rels.length) {
                    return responseCache
                }

                res = res[0]
                const rel = rels.slice(index, index + 1)[0];
                if(!res.links(rel.rel).length) {
                    //cache empty links collection
                    //eg `_links: { myRel: [] }`
                    let arr;
                    responseCache[rel.cacheKey] = arr = (responseCache[rel.cacheKey]|| [])
                    return arr
                }
                return executeRel.call(this, rel, rels, responseCache, res)
                        .tap(results => {
                            let arr;
                            responseCache[rel.cacheKey] = arr = (responseCache[rel.cacheKey]|| [])
                            arr.push.apply(arr, results)
                        })
                        .then(results => {
                            return Promise.map(results,resource => {
                                return executeRels.call(this, rels, index + 1, responseCache, resource)
                            })
                        })

            }
            /**
             * find last rel having a cache entry and start executeRels from there
             * */
            function startAt(rels, responseCache, root) {
                for(let i = rels.length - 1; i > -1; i--) {
                    const rel = rels[i];
                    const cached = responseCache[rel.cacheKey];
                    if(cached && cached.length) {
                        //start walking with these cached entries
                        return Promise.map(
                            cached
                            ,executeRels.bind(this, rels, i + 1, responseCache)
                        )
                    }
                }
                //couldnt find a cache entry so just start at the beginning
                return executeRels.call(this, rels, 0, responseCache, root)
            }

            function makeRequests(paths, responseCache, indexed, index, root) {
                if(index >= paths.length) {
                    return responseCache
                }
                const path = paths.slice(index, index + 1)[0];
                const rels = path.rels;

                return Promise.resolve(root)
                    .bind(this)
                    .then(startAt.bind(this, rels, responseCache ))
                    .then(results => {
                        return makeRequests.call(this,paths, responseCache, indexed, index + 1, root)
                    })
            }
            Object.assign(this, {
                execute() {
                    const paths = this.indexed.optimized(), responseCache = {};
                    return this.discoverRoot(this.indexed.rootNode(), this.opts)
                        .tap(root => {
                            responseCache['/'] = root
                        })
                        .then(makeRequests.bind(this, paths, responseCache, this.indexed, 0))
                }
                , discoverRoot(rootNode, opts) {
                    if(rootNode.resource) {
                        //an actual instance was passed in as root node
                        //so just use that
                        return Promise.resolve(parse(rootNode.resource))
                    }
                    return resourceFactory.init({
                        self: rootNode.url
                        , discoverable: false
                    })
                    .then(res => {
                        const params = (rootNode.params || {});
                        return res.get({ params: params})
                    })
                    .then(parse)
                }
            })
        })
        .create()

}


function ohmit(cfg) {
    return stampit()
        .init(function() {
            function mapRequestsToKeys(index, target, requests) {
                //hydrate the `mementos` collection
                //with the results of requests
                Object.keys(requests)
                    .reduce((map, path) => {
                        const keys = index.keysForPath(path);
                        keys.forEach(key => {
                            map[key] = requests[path]
                        })
                        //special case _root
                        map[ROOT_KEY] = requests['/']
                        return map
                    }, target)

            }

            /**
             * uses the `chain` option for `key` to construct a dynamic spec
             * and re-execute, assigning to the position at `index` in the original
             * response.
             * */
            function chainResponse(key, mappable, arr, resource, index) {
                    //dynamic spec using the resource returned from prior invocation
                    const orig = (mappable && mappable[key]);
                    if(!orig) {
                        return arr
                    }
                    if(!arr) {
                        throw new Error('The original memento collection must be passed in for assignment')
                    }
                    if(!resource) {
                        throw new Error('`resource` is required as it is the root of this chained spec.')
                    }
                    const spec = clone(orig);
                    spec._root = resource
                    return this.execute(spec)
                        .tap(res => {
                            //assign our new response to the original memento position at `key`
                            arr[index] = res.mementos
                        })
                        .return(arr)
            }
            Object.assign(this, {
                /**
                 * The primary fn for ohmit, accepting a spec
                 * object to be transformed into http results
                 * `opts` currently has no usage
                 * */
                execute(spec, opts) {
                    const defaults =  { };
                    opts = Object.assign({}, defaults, opts)
                    const _index = index.build(spec);
                    const _requests = requests({
                        opts: opts
                        , resourceFactory: cfg.resourceFactory
                        , indexed: _index
                    });
                    //@todo return the optimized index
                    //for reuse later
                    const response = {
                        //the original spec
                        spec: spec
                        //the results of the requests
                        , mementos: {}
                    };


                    return _requests.execute()
                        .bind(this)
                        .tap(mapRequestsToKeys.bind(this, _index, response.mementos))
                        .tap(requests => {
                            const mappable = (spec._map || {});
                            return Promise.resolve(Object.keys(mappable))
                                .bind(this)
                                .reduce((map, key, index) => {
                                    const resources = map[key];
                                    if(!resources) {
                                        throw new Error(`key ${key} is not in the response`)
                                    }
                                    return Promise.resolve(resources)
                                        .bind(this)
                                        .reduce(chainResponse.bind(this,key,mappable), map[key])
                                        .return(map)
                                },response.mementos)
                        })
                        .return(response)
                }
            })

        })
        .create()
}
ohmit.index = index.build
