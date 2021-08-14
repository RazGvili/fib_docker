// https://github.com/open-telemetry/opentelemetry-js-contrib/blob/main/examples/express/server.js
require('./tracing')('example-express-server');

const keys = require('./keys');
const redis = require('redis');
const morgan = require('morgan');

// Express server will route requests to the redis / pg instances
const bodyParser = require('body-parser');
const cors = require('cors');
const app = require('express')();

app.use(morgan('combined'));
app.use(cors());
app.use(bodyParser.json());

var isNumeric = function (obj) {
	obj = typeof obj === 'string' ? obj.replace(/,/g, '') : obj;
	return (
		!isNaN(parseFloat(obj)) &&
		isFinite(obj) &&
		Object.prototype.toString.call(obj).toLowerCase() !== '[object array]'
	);
};

// Postgres setup
const { Pool } = require('pg');
const pgClient = new Pool({
	user: keys.pgUser,
	host: keys.pgHost,
	database: keys.pgDatabase,
	password: keys.pgPassword,
	port: keys.pgPort,
});

pgClient.on('error', () => {
	console.log('Lost PG connection');
});

pgClient
	.query('CREATE TABLE IF NOT EXISTS values (number INT)')
	.catch((err) => console.log(err));

// Redis client setup
const redisClient = redis.createClient({
	host: keys.redisHost,
	port: keys.redisPort,
	retry_strategy: () => 1000,
});

// Use duplicate when using pub/sub
const redisPublisher = redisClient.duplicate();

// Express routes
app.get('/', (req, res) => {
	res.send('hi');
});

app.get('/values/all', async (req, res) => {
	const values = await pgClient.query('SELECT * from values');
	res.send(values.rows);
});

app.get('/values/current', async (req, res) => {
	redisClient.hgetall('values', (err, values) => {
		res.send(values);
	});
});

app.post('/values', async (req, res) => {
	const index = parseInt(req.body.index);
	console.log('server >> /value >> index', index);

	if (!index || !isNumeric(index)) {
		res.status(400).send('Index invalid');
	}

	if (index > 40) {
		return res.status(422).send('Index to high');
	}

	redisClient.hset('values', index, 'To be calculated by worker');

	// The worker is listening to an 'insert event' and will calculate the value for the index
	redisPublisher.publish('insert', index);

	await pgClient.query('INSERT INTO values(number) VALUES($1)', [index]);

	res.send({ working: true });
});

app.listen(5000, (err) => {
	console.log('ON');
});
