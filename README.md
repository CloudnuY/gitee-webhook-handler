# gitee-webhook-handler


Gitee allows you to register **[Webhooks](http://git.mydoc.io/?t=154711)** for your repositories. Each time an event occurs on your repository, whether it be pushing code, filling issues or creating pull requests, the webhook address you register can be configured to be pinged with details.

This library is a small handler (or "middleware" if you must) for Node.js web servers that handles all the logic of receiving and verifying webhook requests from Gitee.

## Tips

In Gitee Webhooks settings, Content type must be `application/json`.

`application/x-www-form-urlencoded` won't work at present.

## Example

```js
var http = require('http')
var createHandler = require('gitee-webhook-handler')
var handler = createHandler({ path: '/webhook', secret: 'myhashsecret' })

http.createServer(function (req, res) {
  handler(req, res, function (err) {
    res.statusCode = 404
    res.end('no such location')
  })
}).listen(7777)

handler.on('error', function (err) {
  console.error('Error:', err.message)
})

handler.on('Push Hook', function (event) {
  console.log('Received a push event for %s to %s',
    event.payload.repository.name,
    event.payload.ref)
})

handler.on('Issue Hook', function (event) {
  console.log('Received an issue event for %s action=%s: #%d %s',
    event.payload.repository.name,
    event.payload.action,
    event.payload.issue.number,
    event.payload.issue.title)
})
```

## API

gitee-webhook-handler exports a single function, use this function to *create* a webhook handler by passing in an *options* object. Your options object should contain:

 * `"path"`: the complete case sensitive path/route to match when looking at `req.url` for incoming requests. Any request not matching this path will cause the callback function to the handler to be called (sometimes called the `next` handler).
 * `"events"`: an optional array of whitelisted event types (see: *events.json*). If defined, any incoming request whose `X-git-oschina-Event` can't be found in the whitelist will be rejected. If only a single event type is acceptable, this option can also be a string.

The resulting **handler** function acts like a common "middleware" handler that you can insert into a processing chain. It takes `request`, `response`, and `callback` arguments. The `callback` is not called if the request is successfully handled, otherwise it is called either with an `Error` or no arguments.

The **handler** function is also an `EventEmitter` that you can register to listen to any of the Gitee event types. Note you can be specific in your Gitee configuration about which events you wish to receive, or you can send them all. Note that the `"error"` event will be liberally used, even if someone tries the end-point and they can't generate a proper signature, so you should at least register a listener for it or it will throw.

See the [Gitee Webhooks documentation](http://git.mydoc.io/?t=154711) for more details on the events you can receive.

Included in the distribution is an *events.json* file which maps the event names to descriptions taken from the API:

```js
var events = require('gitee-webhook-handler/events')
Object.keys(events).forEach(function (event) {
  console.log(event, '=', events[event])
})
```

Additionally, there is a special `'*'` even you can listen to in order to receive _everything_.

## License

**gitee-webhook-handler** is Copyright (c) 2017 CloudnuY and licensed under the MIT License. All rights not explicitly granted in the MIT License are reserved. See the included [LICENSE.md](./LICENSE.md) file for more details.
