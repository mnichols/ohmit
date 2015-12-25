'use strict';


import specHelper from './spec-helper'
import Promise from 'bluebird'
export default function(models = {}) {
    let {fixtures} = specHelper()
    let gets = {}
    for(let fix in fixtures) {
        let mod = fixtures[fix]
        models[mod.request.url] = mod
    }

    let resourceFactory = {
        createResource: function({ self, body }) {
            return Promise.resolve(inMemory({ self, body}))
        }
    }
    let inMemory = function({self,body}){
        let model = models[self]
        if(!model) {
            throw new Error('missing model ' + self)
        }
        //this is the contract ohmit requires to traverse an api
        let resourceAdapter = {
            // returns a function which returns a URI for this resource
            self: function() {
                return self
            }
            // performs a GET (for http) or hash lookup
            // and returns a fully hydrated resource
            , get: function(args) {
                gets[self] = (gets[self] || 0) + 1
                Object.assign(this,model.response.body)
                return Promise.resolve(this)
            }
            // returns {Boolean} indicating whether the resource
            // is related by `rel`
            , hasRelation: function(rel) {
                return !!this._links[rel]
            }
            // grabs the links and returns init'ed resources...
            // does NOT perform a GET
            , follow: function(rel) {
                let links = [].concat(this._links[rel] || [])
                return Promise.resolve(links)
                .map(function(item) {
                    return resourceFactory.createResource({self:item.href})
                })
            }
            // gets underlying resource
            // or a Promise that realizes the resource (eg a Proxy)
            , resource: function() {
                return this
            }
        }
        return Object.assign(resourceAdapter,body)
    }
    return {
        resourceFactory
        , numberOfGets: function(url) {
            return (gets[url] || 0)
        }
    }
}

