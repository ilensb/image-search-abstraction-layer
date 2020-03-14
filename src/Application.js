// Image Search Abstraction Layer
// User Story: I can get the image URLs, alt text and page urls for a set of images relating to a given search string.
// User Story: I can paginate through the responses by adding a ?offset=2 parameter to the URL.
// User Story: I can get a list of the most recently submitted search strings.

const request = require('superagent')

class Application {
    constructor(app, db) {
        this.db = db

        app.use((req, res, next) => {
            if (req.url.length > 1) {
                if (req.url.toLowerCase().startsWith('/search/')) {
                    req.mySearch = decodeURIComponent(req.path.substr(8))
                    req.url = req.url.substr(0, 7)
                }
            }

            next()
        })

        app.get('/search', (req, res) => {
            this.search(req.mySearch, req.query.offset).then((data) => {
                try {
                    const results = data.map((result) => {
                        return { url: result.link, snippet: result.snippet, thumbnail: result.image.thumbnailLink, context: result.image.contextLink }
                    })

                    res.end(JSON.stringify(results, null, 2))
                } catch (err) {
                    res.end(err)
                }
            }).catch((error) => {
                res.end(error)
            })
        })

        app.get('/recent', (req, res) => {
            this.getLastTen().then((results) => {
                res.end(JSON.stringify(results, null, 2))
            }).catch((err) => {
                res.end(err)
            })
        })

        app.get('/', (req, res) => {
            res.sendFile(__dirname + '/index.html')
        })
    }

    addSearch(terms) {
        const collection = this.db.collection('searches')

        const date = new Date();

        collection.insertOne({ term: terms, when: date.toISOString() }).catch((err) => {
            console.log(err)
        })
    }

    getLastTen() {
        return new Promise((resolve, reject) => {
            const collection = this.db.collection('searches')

            if (!collection) {
                resolve([])
            }

            const count = collection.count((err, count) => {
                if (err) {
                    resolve([])
                }

                if (count > 10) {
                    collection.find({}, { _id: 0, term: 1, when: 1 }).skip(count - 10).toArray((err, result) => {
                        if (err) {
                            resolve([])
                        }

                        resolve(result)
                    })
                } else {
                    collection.find({}, { _id: 0, term: 1, when: 1 }).toArray((err, result) => {
                        if (err) {
                            resolve([])
                        }

                        resolve(result)
                    })
                }
            })
        })
    }

    search(terms, offset) {
        return new Promise((resolve, reject) => {
            let array = terms.split(' ')
            let len = array.length

            for (let i = 0; i < len; i++) {
                array[i] = encodeURIComponent(array[i])
            }

            let query = array.join('+')

            query = 'q=' + query + (offset ? '&start=' + offset : '') + '&searchType=image&cx=' + encodeURIComponent(process.env.SEARCH_ENGINE_ID) + '&key=' + encodeURIComponent(process.env.API_KEY)

            request
                .get('https://www.googleapis.com/customsearch/v1')
                .query(query)
                .end((err, res) => {
                    if (err) {
                        reject(err)
                    } else {
                        this.addSearch(terms)
                        const results = JSON.parse(res.text)
                        resolve(results.items)
                    }
                })
        })
    }

    disconnect() {
        this.db.close()
    }
}

module.exports.Application = Application