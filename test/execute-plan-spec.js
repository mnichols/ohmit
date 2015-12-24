'use strict';

import test from 'blue-tape'
import ohmit from '../src/ohmit'
import testResourceFactory from './test-resource-factory-adapter'

test('simple connect works with adapter',(assert) =>{
    let {resourceFactory} = testResourceFactory()
    let sut = ohmit({
        resourceFactory
    })
    let q = {
        _root: { _url: '/apiColl' }
        , a: '/a'
    }
    return sut.execute(q)
    .then((result)=>{
        assert.equal(result.mementos.a[0].self,'/apiColl/a')
    })
})
test('complex connect works with adapter',(assert) =>{
    let {resourceFactory} = testResourceFactory()
    let sut = ohmit({
        resourceFactory
    })
    let q = {
        _root: {
            _url: '/apiColl'
        }
        , jiboo: '/'
        , a: '/a'
        , b: '/items/b'
        , d: '/items/b/d'
        , f: {
            _path: '/items/e/f'
            , _params: {
                e: {
                    'foo': 'bar'
                }
            }
        }
        , z: {
            _path: '/w/x/y/z'
            , _params: {
                x: {
                    'p1':'aaa'
                }
                , y: {
                    'p2': 'bbb'
                    , 'p3': 'ccc'
                }
            }
        }
    }
    return sut.execute(q)
    .then(({mementos})=>{
        assert.equal(mementos.jiboo[0].self,'/apiColl')
        assert.equal(mementos.a[0].self,'/apiColl/a')
        assert.equal(mementos._root[0].self,'/apiColl')
        assert.equal(mementos.b[0].self,'/apiColl/b1')
        assert.equal(mementos.b[1].self,'/apiColl/b2')
        assert.equal(mementos.d[0].self,'/apiColl/d1')
        assert.equal(mementos.d[1].self,'/apiColl/d2')
        assert.equal(mementos.f[0].self,'/apiColl/f1')
        assert.equal(mementos.z[0].self,'/apiColl/z')
    })
})
test('common paths are optimized GETs',(assert) => {
    let {resourceFactory,numberOfGets} = testResourceFactory()
    let sut = ohmit({
        resourceFactory
    })
    let q = {
        _root: {
            _url: '/api'
        }
        , c: '/rj:a/rj:b/c'
        , d: '/rj:a/rj:b/c/d'
    }
    return sut.execute(q)
    .then(({mementos})=>{
        assert.equal(mementos.c[0].self,'/api/c')
        assert.equal(mementos.d[0].self,'/api/d')
        assert.equal(numberOfGets('/api'),1)
        assert.equal(numberOfGets('/api/a'),1)
        assert.equal(numberOfGets('/api/b'),1)
        assert.equal(numberOfGets('/api/c'),1)
    })
})
test('fqdn _root behaves as expected', (assert) => {
    let {resourceFactory,numberOfGets} = testResourceFactory()
    let sut = ohmit({
        resourceFactory
    })
    let q = {
        _root: 'http://localhost:8080/fqdnApi'
        , jiboo: '/'
        , a: '/a'
        , b: '/items/b'
        , d: '/items/b/d'
        , f: {
            _path: '/items/e/f'
            , _params: {
                e: {
                    'foo': 'bar'
                }
            }
        }
    }
    return sut.execute(q)
    .then(({mementos})=>{
        assert.equal(mementos.jiboo[0].self,'http://localhost:8080/fqdnApi')
        assert.equal(mementos.a[0].self,'http://localhost:8080/fqdnApi/a')
        assert.equal(mementos._root[0].self,'http://localhost:8080/fqdnApi')
        assert.equal(mementos.b[0].self,'http://localhost:8080/fqdnApi/b1')
        assert.equal(mementos.b[1].self,'http://localhost:8080/fqdnApi/b2')
        assert.equal(mementos.d[0].self,'http://localhost:8080/fqdnApi/d1')
        assert.equal(mementos.d[1].self,'http://localhost:8080/fqdnApi/d2')
        assert.equal(mementos.f[0].self,'http://localhost:8080/fqdnApi/f1')
    })
})
test('link nodes should not GET that link node but return the resource',(assert) => {
    let {resourceFactory,numberOfGets} = testResourceFactory()
    let sut = ohmit({
        resourceFactory
    })
    let q = {
        _root: {
            _url: '/api'
        }
        , c: '/rj:a/rj:b/c'
        , d: {
            _path: '/rj:a/rj:b/c/d'
            , _link: true
        }
    }
    return sut.execute(q)
    .then(({mementos})=> {
        assert.equal(mementos.d[0].self,'/api/d')
        assert.equal(numberOfGets('/api/d'),0)
    })
})
