const keys = require('./keys')
const redis = require('redis')

// Express setup 
// Express server will route requests to the redis / pg instances 
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(bodyParser.json())

// Postgres setup
const { Pool } = require('pg')
const pgClient = new Pool({
    user: keys.pgUser,
    host: keys.pgHost, 
    database: keys.pgDatabase,
    password: keys.pgPassword,
    port: keys.pgPort
})

pgClient.on('error', () => { console.log('Lost PG connection')})

pgClient
.query('CREATE TABLE IF NOT EXISTS values (number INT)')
.catch(err => console.log(err))


// Redis client setup

const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: () => 1000
})

// Use duplicate when using pub/sub  
const redisPublisher = redisClient.duplicate()


// Express routes 
app.get('/', (req, res) => {
    res.send("hi")
})


app.get('/values/all', async (req, res) => {
    const values = await pgClient.query('SELECT * from values')
    res.send(values.rows)
})


app.get('/values/current', async (req, res) => {

    redisClient.hgetall('values', (err, values) => {
        res.send(values)
    })
})

app.post('/values', async (req, res) => {
    const index = parseInt(req.body.index)

    if(index > 40) {
        return res.status(422).send('Index to high')
    }

    redisClient.hset('values', index, 'To be calculated by worker')

    // The worker is listening to an 'insert event' and will calculate the value for the index
    redisPublisher.publish('insert', index)

    pgClient.query('INSERT INTO values(number) VALUES($1)', [index])

    res.send({working: true})
})

app.listen(5000, err => {
    console.log("ON")
})