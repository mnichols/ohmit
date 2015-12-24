
var Ersatz = require('ersatz').Ersatz
var Promise = require('bluebird')
Promise.longStackTraces()

module.exports = function build(){

var ersatz
    ,fixtures

ersatz = new Ersatz({
    strictOrder: false
})
var invoke = function() {
    return Promise.resolve(ersatz.invoke.apply(ersatz, arguments))
}

function createFixture(url,links,body,params,method) {
    var fixture =  {
        request: {
            url: url
            ,method: method || 'GET'
            ,params: params || {}
        }
        ,response: {
            statusCode: 200
            ,headers: {
                'content-type': 'application/hal+json'
                ,allow: 'GET'
            }
            ,body: body || {}
        }
    }

    fixture.response.body._links = links || {}
    fixture.response.body._links.self = {
        href: url
    }
    fixture.response.body._links.curies = [
        { name: 'rj', templated: true, href: 'http://developer.rj.com/{rel}'}
    ]
    return fixture
}
function expectFixture(fixture) {
    ersatz.expect(fixture.request,fixture.response)
}
function appendParams(fixture, params) {
    fixture.request.params = params
    return fixture
}

fixtures = {}
fixtures.api = createFixture('/api',{
    'rj:a': { href: '/api/a'}
})
fixtures.a = createFixture('/api/a',{
    'rj:b': { href: '/api/b'}
}, {
    name: 'a'
})
fixtures.b = createFixture('/api/b',{
    'c': { href: '/api/c'}
})
fixtures.c = createFixture('/api/c',{
    'd': { href: '/api/d'}
})
fixtures.d = createFixture('/api/d')
fixtures.e = createFixture('/api/e')


// Fixtures with multiple resources
fixtures.aggs = createFixture('/aggs/',{
    'rj:agg': [
        { href: '/aggs/agg1'}
        ,{ href: '/aggs/agg2'}
        ,{ href: '/aggs/agg3'}
    ]
})
fixtures.agg1 = createFixture('/aggs/agg1')
fixtures.agg2 = createFixture('/aggs/agg2')
fixtures.agg3 = createFixture('/aggs/agg3')

// Fixtures with parameters
fixtures.apiP = createFixture('/api/params/',{
    'rj:a': { href: '/api/params/a'}
})
fixtures.aP = createFixture('/api/params/a',{
    'rj:b': { href: '/api/params/b'}
    }
    , undefined
    , {
    foo: 'bar'
})
fixtures.bP = createFixture('/api/params/b',{
    'c': { href: '/api/params/c'}
    }
    , undefined
    , {
        cat: 'car'
})
fixtures.cP = createFixture('/api/params/c', {
    'd': { href: '/api/params/d'}
})
fixtures.dP = createFixture('/api/params/d', {
    'e': { href: '/api/e'}
    }
    , undefined
    , {
        foo: 'bar'
})

//apiColl
fixtures.apiColl = createFixture('/apiColl', {
    'a': { href: '/apiColl/a'}
    , 'items': [
        { href: '/apiColl/1'}
        , { href: '/apiColl/2'}
        , { href: '/apiColl/3'}
    ]
    , 'w': { href: '/apiColl/w'}
})
fixtures.apiColla = createFixture('/apiColl/a', {

})
fixtures.apiColl1 = createFixture('/apiColl/1', {
    'a': { href: '/apiColl/a'}
    , 'b': { href: '/apiColl/b1'}
})
fixtures.apiColl2 = createFixture('/apiColl/2', {
    'b': { href: '/apiColl/b2'}
    , 'c': { href: '/apiColl/c'}
})
fixtures.apiColl3 = createFixture('/apiColl/3', {
    'c': { href: '/apiColl/c'}
    , 'e': { href: '/apiColl/e1'}
})
fixtures.apiCollb1 = createFixture('/apiColl/b1', {
    'd': { href: '/apiColl/d1'}
    , 'e': { href: '/apiColl/e1'}
})
fixtures.apiCollb2 = createFixture('/apiColl/b2', {
    'd': { href: '/apiColl/d2'}
})
fixtures.apiColld1 = createFixture('/apiColl/d1', {
    'e': { href: '/apiColl/e1'}
})
fixtures.apiColld2 = createFixture('/apiColl/d2', {
})
fixtures.apiColle1 = createFixture('/apiColl/e1',{
    'f': { href: '/apiColl/f1'}
})
fixtures.apiCollf1 = createFixture('/apiColl/f1', {
})
fixtures.apiCollw = createFixture('/apiColl/w',{
    'x': { href: '/apiColl/x'}
})
fixtures.apiCollx = createFixture('/apiColl/x',{
    'y': { href: '/apiColl/y'}
})
fixtures.apiColly = createFixture('/apiColl/y',{
    'z': { href: '/apiColl/z'}
})
fixtures.apiCollz = createFixture('/apiColl/z',{
})


//fqdnApi
fixtures.fqdnApi = createFixture('http://localhost:8080/fqdnApi', {
    'a': { href: 'http://localhost:8080/fqdnApi/a'}
    , 'items': [
        { href: 'http://localhost:8080/fqdnApi/1'}
        , { href: 'http://localhost:8080/fqdnApi/2'}
        , { href: 'http://localhost:8080/fqdnApi/3'}
    ]
})
fixtures.fqdnApia = createFixture('http://localhost:8080/fqdnApi/a', {

})
fixtures.fqdnApi1 = createFixture('http://localhost:8080/fqdnApi/1', {
    'a': { href: 'http://localhost:8080/fqdnApi/a'}
    , 'b': { href: 'http://localhost:8080/fqdnApi/b1'}
})
fixtures.fqdnApi2 = createFixture('http://localhost:8080/fqdnApi/2', {
    'b': { href: 'http://localhost:8080/fqdnApi/b2'}
    , 'c': { href: 'http://localhost:8080/fqdnApi/c'}
})
fixtures.fqdnApi3 = createFixture('http://localhost:8080/fqdnApi/3', {
    'c': { href: 'http://localhost:8080/fqdnApi/c'}
    , 'e': { href: 'http://localhost:8080/fqdnApi/e1'}
})
fixtures.fqdnApib1 = createFixture('http://localhost:8080/fqdnApi/b1', {
    'd': { href: 'http://localhost:8080/fqdnApi/d1'}
    , 'e': { href: 'http://localhost:8080/fqdnApi/e1'}
})
fixtures.fqdnApib2 = createFixture('http://localhost:8080/fqdnApi/b2', {
    'd': { href: 'http://localhost:8080/fqdnApi/d2'}
})
fixtures.fqdnApid1 = createFixture('http://localhost:8080/fqdnApi/d1', {
    'e': { href: 'http://localhost:8080/fqdnApi/e1'}
})
fixtures.fqdnApid2 = createFixture('http://localhost:8080/fqdnApi/d2', {
})
fixtures.fqdnApie1 = createFixture('http://localhost:8080/fqdnApi/e1',{
    'f': { href: 'http://localhost:8080/fqdnApi/f1'}
})
fixtures.fqdnApif1 = createFixture('http://localhost:8080/fqdnApi/f1', {
})

fixtures.apiChain = createFixture('/apiChain',{
    'f': [{
        href: '/apiChain/f/1'
    }, {
        href: '/apiChain/f/2'
    }]
})
fixtures.apiChainf_1 = createFixture('/apiChain/f/1',{
    'f1': [{ href: '/apiChain/f1/1'}, { href: '/apiChain/f1/2'}]
    ,'f2': [{ href: '/apiChain/f2/1'}, { href: '/apiChain/f2/2'}]
    , 'f3': []
})
fixtures.apiChainf_2 = createFixture('/apiChain/f/2',{
    'f1': [{ href: '/apiChain/f1/3'}, { href: '/apiChain/f1/4'}]
    ,'f2': [{ href: '/apiChain/f2/3'}]
    , 'f3': []
})
fixtures.apiChainf1_1 = createFixture('/apiChain/f1/1',{})
fixtures.apiChainf1_2 = createFixture('/apiChain/f1/2',{})
fixtures.apiChainf1_3 = createFixture('/apiChain/f1/3',{})
fixtures.apiChainf1_4 = createFixture('/apiChain/f1/4',{})
fixtures.apiChainf2_1 = createFixture('/apiChain/f2/1',{})
fixtures.apiChainf2_2 = createFixture('/apiChain/f2/2',{})
fixtures.apiChainf2_3 = createFixture('/apiChain/f2/3',{})

return {
    ersatz: ersatz
    , fixtures: fixtures
    , createFixture: createFixture
    , expectFixture: expectFixture
    , appendParams: appendParams
    , verify: ersatz.verify
}
}
