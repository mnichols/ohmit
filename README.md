# ohmit

## The **O**bject-**H**ypermedia **M**apper (OHM)


## What ohmit Will Do For You

Execute a plan to traverse an api and output an arbitrary object called a 'memento'. 
She does this with `GET` http methods and returns an object. 
The spec defined by your _execution plan_ is found at the `mementos` attribute on the resulting object.
She will support `params` at each level of traversal.

## What ohmit Will Not Do For You

* She will not support other methods. If your api sucks and you do `POST` to get resources or rely on
bodies in methods other than `GET`, then your code is responsible to tolerate that.
* She will not transform data for you. If you want a bloated toolbelt library, see underscore.
* She will not magically extend your object. She has limited psychic powers so will fail to know what
to do when Things Go Wrong. That is the concern for the caller.

## Why?

Hypermedia clients are subject to complex traversal plans that really complicate testing and couple
the application code to a particular hypermedia specification. This problem is identical to application
code coupling itself to various persistence implementations. This coupling also severely complicates testing. 
`ohmit` aims to solve the coupling and testing complexity caused by connecting to a hypermedia (HATEOAS) api
in the same way an Object-Relational Mapper does for relational data stores . Instead of forcing application
code to speak the dialect of a specific api specification, `ohmit` abstracts away the construction of objects
using _relationships_ for paths. Link relationships are at the heart of a hypermedia api so it makes sense to 
_only_ couple application code directly to those relationships and let a driver take care of the interpretation to 
a specific implementation (eg HAL, JSON API, etc).

## The Spec Object

The following attributes are supported for the spec object being executed by ohmit.

```js

var spec = {
    //start traversal from this url
    //you may also pass in a string for the value
    _root: { _url : 'http://example.org/api' }
    , a: {
        //the relationship to follow
        _path: '/a'
        //the parameters (if any) to pass in for the relationship by key
        , _params: {
            a: { foo: 'bar'}
        }
        //specify whether to only construct a link, or to actuall GET the resources
        //here, we are specifying to GET the resources at relationship 'a'
        , _link: false
    }
    //same as 'a', but with only relationship passed (no params)
    , shortA: '/a'
    //specify paths (relationships) to follow
    , b: '/a/b'
    , c: {
        _path: '/a/b/c'
        //specify that the relationships at 'c' should NOT be GETted but instead
        //return the unininitialized (unsynced) resources for each link
        , _link: true
    }
}

```

- `_root` _required_ {String | Resource | Object} Either passing a url for the root, a resource, or an object having : 
    - `_url` {String} The root url to begin traversal
    - `_resource` {Resource} The root resource instance to begin traversal from. This instance _must_ expose `.get` and `.follow` operations, as well as have a `self` url. Passing this in negates any other `_root` config
    - `_params` {Object} Parameters to include in the `GET` for the root node

- any... _optional_ The key/value pairs you want to map to resources at their relationship paths
where each node can either be a `string` representing the relationship (link) or an object having:

- `_path` _required_ {String} The relationship (`rel`) to follow from the root. You can travel as deep as you like.
- `_params` _optional_ {Object} Map of relationship:parameter object to pass into the GET request for that relationship
- `_link` _optional_ {Boolean} Default : **false** Specifies the final relationship should not receive a GET request
    , but instead provide the uninitialized resources as their 'mementos'.


## Examples

Given these resources:

```js

var api = {
    _links: {
        self: { href: 'http://example.com/api'}
        , a: { href: 'http://example.com/a'}
    }
}

var a = {
    _links: {
        self: { href: 'http://example.com/a'}
    }
    , name: 'a'
}

```

Given the following query plan execution:

```js
var q = {
    _root: { 
        _url: 'http://example.com/api'
    }
    , a: '/a'
}

var result = ohmit.execute(q)

/** result
{
    spec: /* your spec object */
    //here is the results
    , mementos: {
        a: [{
            _links: {
                self: { href: 'http://example.com/a'}
            }
            , name: 'a'
        }]
    }
}
**/

```

`ohmit` will traverse the api starting at `http://example.com/api/` and
follow the `_link` relationship of 'a' (`http://example.com/a`).

The result will be found at `mementos` attribute keyed identical to the spec object:

## Super Duper complex path

```js

var api = {
    _links: {
        self: { href: '/api'}
        , a: { href: '/a'}
    }
}

var a = {
    _links: {
        self: { href: '/a'}
        , b: { href: '/b'}
    }
}

var b = {
    _links: {
        self: { href: '/b'}
        , c: { href: '/c' }
        , d: { href: '/d'}
    }
}

var c = {
    _links: {
        self: { href: '/c'}
    }
}

var d = {
    _links: {
        self: { href: '/d'}
        , items: [ {
            href: '/items'
        } ]
    }
}

var items = {
    _links: {
        self: { href: '/items'}
        , item1: { href: '/item1'}
        , item2: { href: '/item2'}
    }
}

var item1 = {
    _links: {
        self: { href: '/item1'}
    }
}
var item2 = {
    _links: {
        self: { href: '/item2'}
    }
}
```

```js

var q = {
    _root: { _url: '/api'}
    , c: {
        _path: '/a/b/c'
        , _params: { 
            a: {
                foo: 'bar'
            }
            , b: {
                baz: 'biz'
            }
        }
    }
    , item1: {
        _path: '/a/b/d/items/item1'
        , _params: { 
            a: {
                foo: 'bar'
            }
            , b: {
                baz: 'biz'
            }
        }
    }
    ,item2: {
        _path: '/a/b/d/items/item2'
        , _params: { 
            a: {
                foo: 'bar'
            }
            , b: {
                baz: 'biz'
            }
        }

    }
}

//expects
var result = {
    spec: /* yore spec object */
    , mementos: {
        c: [cResource]
        , item1: [item1Resource]
        , item2: [item2Resource]
    }
}
```

## How To Connect

`ohmit` expects a `resourceFactory` that conforms to this interface:

```js
{
    parse: function({body,self,allow}) {
        //returns a resource instance
    }
    , init: function({self}) {
        //returns a Promise resolving an resource instance
    }
}

```

`ohmit` interacts with resources conforming to this interface:

```js
{
    links: function(rel) {
        //returns an Array of links for the given relationship
    }
    , get: function({params}) {
        //returns a Promise resolving { resource: <Resource> instance, response: <http response>}
    }
    , follow: function(rel) {
        //returns a Promise resolving an Array of resource instances for the given relationship
        //should not perform a GET
    }
    /** 
     * the URI for this resource
     **/
    , self: {Url} 
    , response: {Response having at least { body, headers }}
}

```

### Running tests

**NodeJS**
`npm test`

**Browser**

`npm run serve`

In your browser, visit `http://localhost:3000/test-runner.html` and look in the console.


