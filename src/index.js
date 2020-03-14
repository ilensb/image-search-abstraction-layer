require('dotenv').config()
const express = require('express')
const app = express()
const port = process.env.PORT || 3000
const mongo = require('mongodb').MongoClient
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/image'
const Application = require('./Application').Application

mongo.connect(MONGODB_URI).then((db) => {
    const application = new Application(app, db)
    app.listen(port, function () {
        console.log('Listening for connections on port ' + port)
    })
}).catch((err) => {
    console.log(err)
})