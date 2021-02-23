#!/bin/bash

echo "Building producer backend"
cd producer-backend
npm install
echo "Deploying producer backend"
npm run openshift

cd ../consumer-backend
echo "Building consumer backend"
npm install
echo "Deploying consumer backend"
npm run openshift

cd ../frontend
echo "Building frontend"
npm install
echo "Deploying frontend"
npm run openshift
