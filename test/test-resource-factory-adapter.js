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
        parse: function({ self, body, allow}) {
            return inMemory({self,body,allow})
        }
        , init: function({self}) {
            return Promise.resolve(inMemory({self}))
        }
    }
    let inMemory = function({self,body,allow}){
        let model = models[self]
        if(!model) {
            throw new Error('missing model ' + self)
        }
        let fauxResponse = {
            headers: { allow }
            , body: body
        }
        //this is the contract ohmit requires to traverse an api
        let resource = {
            response: fauxResponse
            , self: self
            , get: function(args) {
                gets[self] = (gets[self] || 0) + 1
                Object.assign(this,model.response.body)
                let result = {
                    response: model.response
                    , allow: model.response.headers['allow']
                    , resource: this
                }
                return Promise.resolve(result)
            }
            , links: function(rel) {
                let links = [].concat(this._links[rel])
                .filter(function(lnk) {
                    return !!lnk && lnk.href
                })
                return links
            }
            // grabs the links and returns init'ed resources...
            // does NOT perform a GET
            , follow: function(rel) {
                let links = this.links(rel)
                return Promise.resolve(links)
                .map(function(item) {
                    return resourceFactory.init({self:item.href})
                })
            }
        }
        return Object.assign(resource,body)
    }
    return {
        resourceFactory
        , numberOfGets: function(url) {
            return (gets[url] || 0)
        }
    }
}

