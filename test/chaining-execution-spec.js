'use strict';
import test from 'blue-tape'
import ohmit from '../src/ohmit'
import testResourceFactory from './test-resource-factory-adapter'

const chainedSpec  = () => {
    return {
        _root: { _url: '/apiChain'}
        , f: '/f'
        , _map: {
            f: {
                f1: '/f1'
                , f2: '/f2'
                , f3: '/f3'
            }
        }
    }
}
test('should namespace memento roots',(assert) => {
    let {resourceFactory,numberOfGets} = testResourceFactory()
    let sut = ohmit({
        resourceFactory
    })
    let q = chainedSpec()
    return sut.execute(q)
    .then(({mementos})=> {
        assert.equal(mementos.f[0]._root[0].self(),'/apiChain/f/1')
        assert.equal(mementos.f[1]._root[0].self(),'/apiChain/f/2')
    })
})
test('should attach chained spec appropriately',(assert) => {
    let {resourceFactory,numberOfGets} = testResourceFactory()
    let sut = ohmit({
        resourceFactory
    })
    let q = chainedSpec()
    return sut.execute(q)
    .then(({mementos})=> {
        assert.equal(mementos.f[0].f1[0].self(),'/apiChain/f1/1')
        assert.equal(mementos.f[0].f1[1].self(),'/apiChain/f1/2')
        assert.equal(mementos.f[0].f2[0].self(),'/apiChain/f2/1')
        assert.equal(mementos.f[0].f2[1].self(),'/apiChain/f2/2')

        assert.equal(mementos.f[1].f1[0].self(),'/apiChain/f1/3')
        assert.equal(mementos.f[1].f1[1].self(),'/apiChain/f1/4')
        assert.equal(mementos.f[1].f2[0].self(),'/apiChain/f2/3')
    })

})
test('should have empty arrays for empty rels',(assert) => {
    let {resourceFactory,numberOfGets} = testResourceFactory()
    let sut = ohmit({
        resourceFactory
    })
    let q = chainedSpec()
    return sut.execute(q)
    .then(({mementos})=> {
        assert.equal(mementos.f[0].f3.length,0)
        assert.equal(mementos.f[1].f3.length,0)
    })
})
