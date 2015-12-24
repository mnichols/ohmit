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
        let resource = {
            self: self
            , get: function(args) {
                gets[self] = (gets[self] || 0) + 1
                Object.assign(this,model.response.body)
                return Promise.resolve(this)
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
                    return resourceFactory.createResource({self:item.href})
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

