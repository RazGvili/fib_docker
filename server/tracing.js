'use strict';

const opentelemetry = require('@opentelemetry/api');

// Not functionally required but gives some insight what happens behind the scenes
const { diag, DiagConsoleLogger, DiagLogLevel } = opentelemetry;
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const { NodeTracerProvider } = require('@opentelemetry/node');
const { SimpleSpanProcessor } = require('@opentelemetry/tracing');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');
const { Resource } = require('@opentelemetry/resources');
const {
	SemanticResourceAttributes: ResourceAttributesSC,
} = require('@opentelemetry/semantic-conventions');

const Exporter = JaegerExporter;

const {
	ExpressInstrumentation,
} = require('@opentelemetry/instrumentation-express');

const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');

module.exports = (serviceName) => {
	try {
		const provider = new NodeTracerProvider({
			resource: new Resource({
				[ResourceAttributesSC.SERVICE_NAME]: serviceName,
			}),
		});
		registerInstrumentations({
			tracerProvider: provider,
			instrumentations: [
				// Express instrumentation expects HTTP layer to be instrumented
				HttpInstrumentation,
				ExpressInstrumentation,
			],
		});

		// https://www.npmjs.com/package/@opentelemetry/exporter-jaeger
		const exporter = new Exporter({
			serviceName,
			// port: 6832,
			endpoint: 'http://jaeger:14268/api/traces',
		});

		provider.addSpanProcessor(new SimpleSpanProcessor(exporter));

		// Initialize the OpenTelemetry APIs to use the NodeTracerProvider bindings
		provider.register();

		return opentelemetry.trace.getTracer('express-example');
	} catch (error) {
		console.log('error', error);
	}
};
