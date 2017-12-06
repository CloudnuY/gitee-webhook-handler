const EventEmitter = require('events').EventEmitter
const bl = require('bl')

function create (options) {
  if (typeof options !== 'object') { throw new TypeError('must provide an options object') }

  if (typeof options.path !== 'string') { throw new TypeError('must provide a \'path\' option') }

  if (typeof options.secret !== 'string') { throw new TypeError('must provide a \'secret\' option') }

  var events

  if (typeof options.events === 'string' && options.events !== '*') { events = [ options.events ] } else if (Array.isArray(options.events) && options.events.indexOf('*') === -1) { events = options.events }

  // make it an EventEmitter, sort of
  handler.__proto__ = EventEmitter.prototype
  EventEmitter.call(handler)

  handler.verify = verify

  return handler

  // function sign (data) {
  //   return 'sha1=' + crypto.createHmac('sha1', options.secret).update(data).digest('hex')
  // }

  function verify (secret, data) {
    return secret === data.password
  }

  function handler (req, res, callback) {
    if (req.url.split('?').shift() !== options.path || req.method !== 'POST') { return callback() }

    function hasError (msg) {
      res.writeHead(400, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ error: msg }))

      var err = new Error(msg)

      handler.emit('error', err, req)
      callback(err)
    }

    var event = req.headers['x-git-oschina-event']

    // if (!sig)
    //   return hasError('No X-Hub-Signature found on request')

    if (!event) { return hasError('No X-Git-Oschina-Event found on request') }

    // if (!id)
    //   return hasError('No X-Github-Delivery found on request')

    if (events && events.indexOf(event) === -1) { return hasError('X-Github-Event is not acceptable') }

    req.pipe(bl(function (err, data) {
      if (err) {
        return hasError(err.message)
      }

      var obj

      try {
        obj = JSON.parse(data.toString())
      } catch (e) {
        return hasError(e)
      }

      if (!verify(options.secret, obj)) { return hasError('Password does not match') }

      res.writeHead(200, { 'content-type': 'application/json' })
      res.end('{"ok":true}')

      var emitData = {
        event: event,
        payload: obj,
        protocol: req.protocol,
        host: req.headers['host'],
        url: req.url
      }

      handler.emit(event, emitData)
      handler.emit('*', emitData)
    }))
  }
}

module.exports = create
