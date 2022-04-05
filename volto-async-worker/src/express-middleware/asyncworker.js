import express from 'express';
import config from '@plone/volto/registry';
import superagent from 'superagent';
import qs from 'query-string';
import { flattenHTMLToAppURL } from '@plone/volto/helpers';
import controller from './asyncworkertoken';
import { createContent } from '@plone/volto/actions';
import jwtDecode from 'jwt-decode';
import bodyParser from 'body-parser';
import cookie from 'react-cookie';
import * as webPush from 'web-push';

const HEADERS = ['content-type', 'content-disposition', 'cache-control'];

if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  console.log(
    'You must set the VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY ' +
      'environment variables. You can use the following ones:',
  );
  console.log(webPush.generateVAPIDKeys());
}

// Set the keys used for encrypting the push messages.
webPush.setVapidDetails(
  'https://serviceworke.rs/',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

/**
 * Format the url.
 * @function formatUrl
 * @param {string} path Path (or URL) to be formatted.
 * @returns {string} Formatted path.
 */
function formatUrl(path) {
  const { settings } = config;
  const APISUFIX = settings.legacyTraverse ? '' : '/++api++';

  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  const adjustedPath = path[0] !== '/' ? `/${path}` : path;
  let apiPath = '';
  if (settings.internalApiPath && __SERVER__) {
    apiPath = settings.internalApiPath;
  } else if (settings.apiPath) {
    apiPath = settings.apiPath;
  }

  return `${apiPath}${APISUFIX}${adjustedPath}`;
}

// ExpressJS body parser
const jsonParser = bodyParser.json();

function AsyncWorker(req, res, next) {
  res.send('hello');

  // getAPIResourceWithAuth(req)
  //   .then((resource) => {
  //     // Just forward the headers that we need
  //     HEADERS.forEach((header) => {
  //       if (resource.headers[header]) {
  //         res.set(header, resource.headers[header]);
  //       }
  //     });
  //     res.send('hello');
  //   })
  //   .catch(next);
}

const poll_ = async () => {
  const { settings } = config;
  const APISUFIX = settings.legacyTraverse ? '' : '/++api++';
  let apiPath = '';

  if (settings.internalApiPath && __SERVER__) {
    apiPath = settings.internalApiPath;
  } else if (__DEVELOPMENT__ && settings.devProxyToApiPath) {
    apiPath = settings.devProxyToApiPath;
  } else {
    apiPath = settings.apiPath;
  }

  // TODO: Read admin credentials from environment variable or something
  // const authorization = `Basic ${btoa("admin:admin")}`;
  const path = '/@search';
  const params = {
    path: '/Plone/task-queue',
    review_state: 'todo',
    fullobjects: '1',
    b_size: '1',
  };
  const response = await superagent
    .get(`${apiPath}${APISUFIX}${path}?${qs.stringify(params)}`)
    .auth('admin', 'admin')
    .set('Accept', 'application/json');

  console.log(response.statusCode);
  console.log(response.body.items.length);
  for (const item of response.body.items) {
    const request = superagent[item.method.token](formatUrl(item.portal_path));
    request.set('Accept', 'application/json');
    request.set('Content-Type', 'application/json');
    request.send(item.body);
    request.auth('admin', 'admin'); // TODO: collective.impersonate
    try {
      await request;
    } catch {}

    // Acknowledge the task with a workflow transition
    const ackUrl =
      item['@id'].replace(apiPath, `${apiPath}/++api++`) +
      `/@workflow/complete`;
    //console.log(ackUrl)
    // request = superagent[method](formatUrl(path));
    await superagent.post(ackUrl).auth('admin', 'admin');
  }
};

let pollCount = 0;

const poll = async (token) => {
  const isActive = token === controller.token;
  console.log(token, controller.token, isActive);

  pollCount += 1;
  try {
    console.log('Polling: ' + pollCount);
    poll_();
  } finally {
    if (isActive) {
      setTimeout(() => poll(token), 1000);
    }
  }
};

export default function () {
  // middleware.all(['**/@asyncworker'], AsyncWorker);
  // middleware.id = 'AsyncWorker';

  const router = express.Router();
  router.get('/@vapidPublicKey', async (req, res) => {
    res.status(200);
    res.send(process.env.VAPID_PUBLIC_KEY);
  });

  router.post('/@test-push-notification', jsonParser, async (req, res) => {
    const subscription = req.body.subscription;
    webPush
      .sendNotification(subscription)
      .then(function () {
        console.log(
          'Push Application Server - Notification sent to ' +
            subscription.endpoint,
        );
      })
      .catch(function () {
        console.log(
          'ERROR in sending Notification, endpoint removed ' +
            subscription.endpoint,
        );
      });
  });

  router.post('/@taskqueue', jsonParser, async (req, res) => {
    /* 

POST /@taskqueue HTTP/1.1
Accept: application/json
Authorization: Basic YWRtaW46c2VjcmV0
Content-Type: application/json

{
    "@type": "Task",
    "method": "POST",
    "path": "/plone/++api++/some-folder/@move",
    "body": "{\"source\": \"http://localhost:55001/plone/front-page\"},
    "user_id": "johndoe"
}

---

HTTP/1.1 202 Accepted
Location: /@taskqueue/id

*/

    let location;
    let apiPath = '';

    const { settings } = config;

    if (settings.internalApiPath && __SERVER__) {
      apiPath = settings.internalApiPath;
    } else if (__DEVELOPMENT__ && settings.devProxyToApiPath) {
      apiPath = settings.devProxyToApiPath;
    } else {
      apiPath = settings.apiPath;
    }

    const authToken = cookie.load('auth_token');

    console.log(req.body);

    const payload = {
      ...req.body,
      '@type': 'task',
      user_id: jwtDecode(authToken).sub,
      title: req.body.portal_path,
    };
    const queuePath = '/task-queue';
    const response = await superagent
      .post(`${apiPath}${queuePath}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .send(payload)
      .auth('admin', 'admin');

    // TODO: Check response?

    res.status(202);
    res.set({ Location: location });
    res.send('');
  });

  //    console.log(req.body)
  //    res.status(202);
  //    res.set({'Location': location})
  //    res.send({"status": "ok"})
  //    return;

  // For MVP:
  // POST /@taskqueue    -> returns 202 Accepted; Location /@taskqueue/id
  /*

---

GET /@taskqueue/id HTTP/1.1
Accept: application/json
Authorization: Basic YWRtaW46c2VjcmV0
Content-Type: application/json

---

HTTP/1.1 ... Busy
Location: /@taskqueue/id

---

HTTP/1.1 200 OK
Content-Type: application/json

---

*/

  // GET  /@taskqueue/id -> returns ... Busy, 200 OK

  // Later for admin views:
  // GET  /@taskqueue     -> returns 200 OK
  // GET  /@taskqueue/id  -> returns ... Busy, 200 OK
  // DELETE  /@taskqueue/id  -> returns 204 No Content

  controller.token = new Date().getTime();
  // setTimeout(() => poll(controller.token), 1000);

  return router;
}
