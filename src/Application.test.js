require('dotenv').config()
const request = require('supertest')
const url = require('url')
const express = require('express')
const app = express()
const Application = require('./Application').Application
const mongo = require('mongodb').MongoClient
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/image'

describe('GET /search/lolcats%20funny', function () {
    it('respond with expected json', function () {
        return request(app)
            .get('/search/lolcats%20funny')
            .expect(200)
            .then(response => {
                const data = JSON.parse(response.text)

                expect(Object.prototype.toString.call(data)).toBe('[object Array]')

                data.forEach((value) => {
                    expect(typeof value.url).toBe('string')
                    expect(typeof value.snippet).toBe('string')
                    expect(typeof value.thumbnail).toBe('string')
                    expect(typeof value.context).toBe('string')
                    new URL(value.url)
                    new URL(value.thumbnail)
                    new URL(value.context)
                })
            })
    })
})

describe('GET /recent', function () {
    it('respond with expected json', function () {
        return request(app)
            .get('/recent')
            .expect(200)
            .then(response => {
                const data = JSON.parse(response.text)

                expect(Object.prototype.toString.call(data)).toBe('[object Array]')

                data.forEach((value) => {
                    expect(typeof value.term).toBe('string')
                    let date = new Date(value.when)
                    expect(value.when).toBe(date.toISOString())
                })
            })
    })
})

let application

beforeAll(() => {
    return mongo.connect(MONGODB_URI).then((db) => {
        application = new Application(app, db)
    }).catch((err) => {
        console.log(err)
    })
})

afterAll(() => {
    application.disconnect()
})