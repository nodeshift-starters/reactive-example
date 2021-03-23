/* eslint-disable no-undef */
// Get the websocket URL based on the location
const locationUrl = window.location.origin.replace('frontend', 'consumer-backend');
const wsUrl = locationUrl.replace('http://', 'ws://');

const socket = new WebSocket(wsUrl);

// eslint-disable-next-line no-unused-vars
const app = new Vue({
  el: '#app',
  data: {
    title: 'OpenShift Kafka Basic Example',
    countries: []
  },
  created () {
    socket.addEventListener('message', event => {
      this.countries.push({
        timestamp: new Date(),
        value: event.data
      });
    });
  }
});
