/* eslint-disable no-undef */
const socket = new WebSocket('ws://localhost:3000');

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
