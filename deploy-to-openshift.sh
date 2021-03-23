#!/bin/bash

cd producer-backend
echo "Deploying producer backend"
npm run openshift

cd ../consumer-backend
echo "Deploying consumer backend"
npm run openshift

cd ../frontend
echo "Deploying frontend"
npm run openshift
