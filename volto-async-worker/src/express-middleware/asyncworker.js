import express from 'express';
import config from '@plone/volto/registry';
import superagent from 'superagent';
import qs from 'query-string'
import {flattenHTMLToAppURL} from '@plone/volto/helpers';
import controller from './asyncworkertoken';
import {createContent} from '@plone/volto/actions'
import jwdecode from 'jwt-decode'
import bodyParser from 'body-parser';

const HEADERS = ['content-type', 'content-disposition', 'cache-control'];

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
  const path = "/@search";
  const params = {
    path: "/Plone/task-queue",
    review_state: "todo",
    fullobjects: "1",
    b_size: "1",
  };
  const response = await superagent
    .get(`${apiPath}${APISUFIX}${path}?${qs.stringify(params)}`)
    .auth('admin', 'admin')
    .set('Accept', 'application/json');


  //console.log(response.statusCode);
  //console.log(response.body.items.length);
  for (const item of response.body.items) {
    // TODO: take account task verb and possible body
    //console.log(item.body);
    //console.log(item.verb);
    //console.log(item.headers);
    //console.log(item.url);

    // TODO: substitute URL with internalApiPath
    await superagent
      .get(item.url)
      .auth('admin', 'admin');

    // Acknowledge the task with a workflow transition
    const ackUrl = item['@id'].replace(apiPath, `${apiPath}/++api++`) + `/@workflow/complete`;
    //console.log(ackUrl)
    // request = superagent[method](formatUrl(path));
    await superagent
      .post(ackUrl)
      .auth('admin', 'admin');
  }
}

let pollCount = 0;

const poll = async (token) => {
  const isActive = token === controller.token;
  console.log(token, controller.token, isActive);

  pollCount += 1;
  try {
    console.log("Polling: " + pollCount);
    poll_();
  } finally {
    if (isActive) {
      setTimeout(() => poll(token), 1000);
    }
  }
};

export default function () {
  const router = express.Router();

  // middleware.all(['**/@asyncworker'], AsyncWorker);
  // middleware.id = 'AsyncWorker';

  router.post('/@taskqueue', jsonParser, (req, res) => {
/* 

POST /@taskqueue HTTP/1.1
Accept: application/json
Authorization: Basic YWRtaW46c2VjcmV0
Content-Type: application/json

{
    "@type": "Task",
    "method": "POST",
    "path": "/plone/++api++/some-folder/@move",
    "headers": {},
    "body": "{\"source\": \"http://localhost:55001/plone/front-page\"}
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
    
    const params = {
      path: "/Plone/task-queue",
    };
    console.log(req.body)
    res.status(202);
    res.set({'Location': location})
    res.send({"status": "ok"})
    return;

    const payload = {
      '@type': 'Task',
      "path": req.body.path,
      method: req.body.method,
      "user_id": jwdecode(req.headers.Authorization.replace('Bearer ', '')).sub,
      "headers": {},
      "body": req.body.body
    }

    // const response = await superagent
    //   .post(`${apiPath}${params.path}`)
    //   .send(payload)
    //   .auth('admin', 'admin');

    res.status(202);
    res.set({'Location': location})
  });


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

  controller.token = (new Date()).getTime();
  // setTimeout(() => poll(controller.token), 1000);

  return router;
}