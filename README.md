*Part of a Docker course - "docker-and-kubernetes-the-complete-guide" by the great Stephen Grider

## Purpose
This app calculates the value of a Fibonacci value given an index of the series.
Example: For the index 6 the value is 13.

## CI 
The master branch is integrated into TravisCI, a successful deploy must pass the react app tests. 
Used Docker-Compose to build the multi-container env, supports a development env with Dockerfile.dev per container. 

# App architecture

### Nginx container
As proxy 

### Client container
returns create-react-app static files 

*In production is wrapped with Nginx to serve static build files 

### Express server container
API for Fibonacci calculations.
Will save indices the app seen in a Postgress DB. 
The calculated values will first be saved as "ready", then will be passed to the worker container. 

### Worker container
Listens to the saved Redis values (Pub/Sub), then calculates the Fibonacci value. 
