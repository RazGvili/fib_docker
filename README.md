*Part of a Docker course 

## Purpose
This app calculates the value of a Fibonacci value given an index. 

# App architecture

## Nginx container
As proxy 

## Client container
returns create-react-app static files * In production is wrapped with Nginx to serve static build files 

## Express server container
API for Fibonacci calculations.
Will save indices the app seen in a Postgress DB. 
The calculated values will first be saved as "ready", then will be passed to the worker container. 

## Worker container
Listens to the saved Redis values (Pub/Sub), then calculates the Fibonacci value. 
