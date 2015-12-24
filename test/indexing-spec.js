'use strict';


import test from 'blue-tape'
import ohmit from '../src/ohmit'

const specA = () => {
    const spec = {
        _root: {
            _url: '/apiColl'
        }
        , a: '/a'
        , b: '/a/b'
        , bc: '/b/c'
        , c: {
            _path: '/a/b/c'
            ,_params: {
                b: {
                    foo:'bar'
                }
            }
        }
        ,d: '/a/b/c/d'
        ,ac: '/a/c'
    }
    const relExpectations = {
        '/': []
        ,'/a': [{
            rel: 'a'
            ,params: {}
            ,cacheKey: '/a'
            , link: false
        }]
        ,'/b': [{
            rel: 'b'
            ,params: {}
            ,cacheKey: '/b'
            , link: false
        }]
        ,'/a/b': [{
            rel: 'a'
            ,params: {}
            ,cacheKey: '/a'
            , link: false
        }, {
            rel: 'b'
            ,params: {}
            , cacheKey: '/a/b'
            , link: false
        }]
        , '/b/c': [{
            rel: 'b'
            ,params: {}
            , cacheKey: '/b'
            , link: false
        }, {
            rel: 'c'
            ,params: {}
            , cacheKey: '/b/c'
            , link: false

        } ]
        , '/a/b?{"foo":"bar"}': [{
            rel: 'a'
            ,params: {}
            , cacheKey: '/a'
            , link: false
        }, {
            rel: 'b'
            ,params: {foo: 'bar'}
            , cacheKey: '/a/b?{"foo":"bar"}'
            , link: false

        } ]
        , '/a/c': [{
            rel: 'a'
            ,params: {}
            , cacheKey: '/a'
            , link: false
        }, {
            rel: 'c'
            , params: {}
            , cacheKey: '/a/c'
            , link: false

        } ]
        , '/a/b?{"foo":"bar"}/c': [{
            rel: 'a'
            ,params: {}
            , cacheKey: '/a'
            , link: false
        }, {
            rel: 'b'
            ,params: {foo: 'bar'}
            , cacheKey: '/a/b?{"foo":"bar"}'
            , link: false
        }, {
            rel: 'c'
            ,params: {}
            ,cacheKey: '/a/b?{"foo":"bar"}/c'
            , link: false

        } ]
        , '/a/b/c': [{
            rel: 'a'
            ,params: {}
            , cacheKey: '/a'
            , link: false
        }, {
            rel: 'b'
            ,params: {}
            ,cacheKey: '/a/b'
            , link: false
        }, {
            rel: 'c'
            ,params: {}
            , cacheKey: '/a/b/c'
            , link: false
        }]
        , '/a/b/c/d': [{
            rel: 'a'
            ,params: {}
            , cacheKey: '/a'
            , link: false
        }, {
            rel: 'b'
            ,params: {}
            , cacheKey: '/a/b'
            , link: false
        }, {
            rel: 'c'
            ,params: {}
            ,cacheKey: '/a/b/c'
            , link: false
        }, {
            rel: 'd'
            ,params: {}
            ,cacheKey: '/a/b/c/d'
            , link: false
        }]
    }
    return { spec, relExpectations }
}
test('indexing works on fqdn _root',(assert) =>{

    var spec = {
        _root: 'http://localhost:8080/api'
        , c: {
            _path: '/a/b/c'
            , _params: {
                'b': {
                    q: 'foo'
                }
            }
        }
    }
    var index = ohmit.index(spec)
    var optimized = index.optimized()
    assert.equal(optimized.length,4)
    assert.equal(optimized[0].path,'/')
    assert.equal(optimized[1].path, '/a')
    assert.equal(optimized[2].path, '/a/b?{"q":"foo"}')
    assert.equal(optimized[3].path, '/a/b?{"q":"foo"}/c')
    assert.end()
})
test('indexing works on fqdn _root',(assert) =>{

    var spec = {
        _root: 'http://localhost:8080/api'
        , c: {
            _path: '/a/b/c'
            , _params: {
                'b': {
                    q: 'foo'
                }
            }
        }
    }
    var index = ohmit.index(spec)
    var optimized = index.optimized()
    assert.equal(optimized.length,4)
    assert.equal(optimized[0].path,'/')
    assert.equal(optimized[1].path, '/a')
    assert.equal(optimized[2].path, '/a/b?{"q":"foo"}')
    assert.equal(optimized[3].path, '/a/b?{"q":"foo"}/c')
    assert.end()
})

test('optimizing serializes params into path', (assert) => {
    const {spec,relExpectations} = specA()
    let sut = ohmit.index(spec)
    let result = sut.optimized()
    let stringed = JSON.stringify({foo:'bar'})
    let paths = [
        '/'
        ,'/a'
        ,'/b'
        ,'/a/b'
        ,'/b/c'
        ,'/a/b?{"foo":"bar"}'
        ,'/a/c'
        ,'/a/b?{"foo":"bar"}/c'
        ,'/a/b/c'
        ,'/a/b/c/d'
    ]
    result.forEach(function(item, index){
        assert.equal(item.path,paths[index])
    })
    assert.end()
})
test('optimizing splits rels per path', (assert) => {
    const {spec,relExpectations} = specA()
    const A = specA()
    let sut = ohmit.index(spec)
    let result = sut.optimized()
    let expectations = [
        relExpectations['/']
        ,relExpectations['/a']
        ,relExpectations['/b']
        ,relExpectations['/a/b']
        ,relExpectations['/b/c']
        ,relExpectations['/a/b?{"foo":"bar"}']
        ,relExpectations['/a/c']
        ,relExpectations['/a/b?{"foo":"bar"}/c']
        ,relExpectations['/a/b/c']
        ,relExpectations['/a/b/c/d']

    ]
    result.forEach(function(res, index){
        assert.deepEqual(expectations[index],res.rels,'at index ' + index)
    })
    assert.end()
})
