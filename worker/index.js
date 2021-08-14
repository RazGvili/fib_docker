// https://github.com/open-telemetry/opentelemetry-js-contrib/blob/main/examples/express/server.js
require('./tracing')('worker');

const keys = require('./keys');
const redis = require('redis');

// Store all indices and calculated fib series values
const redisClient = redis.createClient({
	host: keys.redisHost,
	port: keys.redisPort,
	retry_strategy: () => 1000,
});

// Duplicate all current options and return a new redisClient instance.
const sub = redisClient.duplicate();

function fib(index) {
	if (!index) return 1;
	if (index < 2) return 1;
	return fib(index - 1) + fib(index - 2);
}

sub.on('message', (channel, message) => {
	const message = parseInt(message);
	console.log(`[Worker ${new Date()}] Received ${message}`);
	redisClient.hset('values', message, fib());
});

sub.subscribe('insert');
