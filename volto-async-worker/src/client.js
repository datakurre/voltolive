/**
 * Replace with custom client implementation when needed.
 * @module client
 */

import client from '@plone/volto/start-client';

// This function is needed because Chrome doesn't accept a base64 encoded string
// as value for applicationServerKey in pushManager.subscribe yet
// https://bugs.chromium.org/p/chromium/issues/detail?id=802280
function urlBase64ToUint8Array(base64String) {
  var padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  var base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

  var rawData = window.atob(base64);
  var outputArray = new Uint8Array(rawData.length);

  for (var i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

navigator.serviceWorker.register('notification-worker.js');

(() => {
  navigator.serviceWorker.ready
    .then(async function (registration) {
      // Get the server's public key
      const response = await fetch('./@vapidPublicKey'); // TODO: get portal root
      const vapidPublicKey = await response.text();
      // Chrome doesn't accept the base64-encoded (string) vapidPublicKey yet
      // urlBase64ToUint8Array() is defined in /tools.js
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
      // Subscribe the user
      return registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });
    })
    .then(function (subscription) {
      console.log('Subscribed', subscription);
      console.log('Subscribed', subscription.endpoint);
      return fetch('/@test-push-notification', {
        method: 'post',
        headers: {
          'Content-type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription,
        }),
      });
    });
})();

client();

if (module.hot) {
  module.hot.accept();
}
