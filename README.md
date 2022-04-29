# Express Redis Cache 2

[![npm](https://img.shields.io/npm/v/express-redis-cache2.svg)](https://www.npmjs.com/package/express-redis-cache2)
[![Build status](https://gitlab.com/demsking/express-redis-cache2/badges/main/pipeline.svg)](https://gitlab.com/demsking/express-redis-cache2/pipelines)
[![Test coverage](https://gitlab.com/demsking/express-redis-cache2/badges/main/coverage.svg)](https://gitlab.com/demsking/express-redis-cache2/pipelines)

Easily cache pages of your app using Express and Redis. *Could be used without
Express too.*

> **Disclaimer**: This library is a fork of [express-redis-cache](https://www.npmjs.com/package/express-redis-cache)
> which appears to be no longer maintained as the last version was released 4 years ago and
> contains a [potential exponential regex in monitor mode vulnerability](https://github.com/advisories/GHSA-35q2-47q7-3pc3).
>
> Now `express-redis-cache2` uses `redis` as an external dependency.
> Please see [CHANGELOG.md](https://gitlab.com/demsking/express-redis-cache2/blob/main/CHANGELOG.md).

## Table of Contents

- [Install](#install)
- [Usage](#usage)
- [Events](#events)
- [The Entry Model](#the-entry-model)
- [The module](#the-module)
- [API](#api)
  * [`get` Get cache entries](#get-get-cache-entries)
  * [`add` Add a new cache entry](#add-add-a-new-cache-entry)
  * [`del` Delete a cache entry](#del-delete-a-cache-entry)
  * [`size` Get cache size for all entries](#size-get-cache-size-for-all-entries)
- [Example Code](#example-code)
- [Development Setup](#development-setup)
- [License](#license)

## Install

`express-redis-cache2` is compatible with `redis@3`.

```sh
npm install express-redis-cache2 redis@3
```

## Usage

Just use it as a middleware in the stack of the route you want to cache.

```js
const redis = require('redis');
const createExpressRedisCache = require('express-redis-cache2');

const client = redis.createClient();
const cache = createExpressRedisCache({ client });
const app = express();

// replace
app.get('/',
  (req, res) => { ... });

// by
app.get('/',
  cache.route(),
  (req, res) => { ... });
```

This will check if there is a cache entry for this route. If not. it will
cache it and serve the cache next time route is called.

**Redis Unavailability**

Should the redis become unavailable, the `express-redis-cache2` object will
emit errors but will not crash the app. Express.js requests during this time
will be bypass cache and will return fresh data.

Once the redis recovers, the caching will begin working again. See example
code in the `/example` folder.

**Name of the cache entry**

By default, the cache entry name will be `default prefix`:`name` where name's
value defaults to [req.originalUrl](http://expressjs.com/4x/api.html#req.originalUrl).

```js
app.get('/',
  cache.route(), // cache entry name is `cache.prefix + "/"`
  (req, res) => { ... });
```

You can specify a custom name like this:

```js
app.get('/',
  cache.route('home'), // cache entry name is now `cache.prefix + "home"`
  (req, res) => { ... });
```

You can also use the object syntax:

```js
app.get('/',
  cache.route({ name: 'home' }), // cache entry name is `cache.prefix + "home"`
  (req, res) => { ... });
```

Also, you can use `res.express_redis_cache_name` to specify the name of the
entry such as:

```js
app.get('/user/:userid',
  // middleware to define cache name
  (req, res, next) => {
    // set cache name
    res.express_redis_cache_name = 'user-' + req.params.userid;
    next();
  },

  // cache middleware
  cache.route(),

  // content middleware
  (req, res) => {
    res.render('user');
  }
);
```

**Conditional caching**

You can also use a previous middleware to set whether or not to use the cache
by using `res.use_express_redis_cache`:

```js
app.get('/user',
  // middleware to decide if using cache
  (req, res, next) => {
    // Use only cache if user not signed in
    res.use_express_redis_cache = ! req.signedCookies.user;

    next();
  }.

  // cache middleware
  cache.route(), // this will be skipped if user is signed in

  // content middleware
  (req, res) => {
    res.render('user');
  }
);
```

**Prefix**

All entry names are prepended by a prefix. Prefix is set when calling the
Constructor.

```js
const redis = require('redis');
const createExpressRedisCache = require('express-redis-cache2');

const client = redis.createClient();
// Set default prefix to "test". All entry names will begin by "test:"
const cache = createExpressRedisCache({
  client,
  prefix: 'test',
});
```

To know the prefix:

```js
console.log('prefix', cache.prefix);
```

You can pass a custom prefix when calling `route()`:

```js
app.get('/index.html',
  cache.route('index', { prefix: 'test'  }), // force prefix to be "test", entry name will be "test:index"
  (req, res) => { ... });
```

You can also choose not to use prefixes:

```js
app.get('/index.html',
  cache.route({ prefix: false  }), // no prefixing, entry name will be "/index.html"
  (req, res) => { ... });
```

**Expiration**

Unless specified otherwise when calling the Constructor, cache entries don't
expire. You can specify a default lifetime when calling the constructor:

```js
const redis = require('redis');
const createExpressRedisCache = require('express-redis-cache2');

const client = redis.createClient();
// Set default lifetime to 60 seconds for all entries
const cache = createExpressRedisCache({ client, expire: 60 });
```

You can overwrite the default lifetime when calling `route()`:

```js
app.get('/index.html',
  cache.route({ expire: 5000  }), // cache entry will live 5000 seconds
  (req, res) => { ... });

// You can also use the number sugar syntax
cache.route(5000);
// Or
cache.route('index', 5000);
// Or
cache.route({ prefix: 'test' }, 5000);
```

You can also provide a hash of status code / expiration values if you for
example want to retry much sooner in failure cases (403/404/500/etc). Status
ranges can be specified via `4xx`/`5xx`. You must provide a default value
(`xxx`). The most specific rule will be used. For example, if the status code
is 200, and there are expirations set for 200, 2xx, and xxx, the expiration
for 200 will be used.

```js
app.get('/index.html',
  cache.route({
    expire: {
      200: 5000,
      4xx: 10,
      403: 5000,
      5xx: 10,
      xxx: 1
    }
  }),
  (req, res) => { ... });
```

You can also specify

**Content Type**

You can use `express-redis-cache2` to cache HTML pages, CSS stylesheets, JSON
objects, anything really. Content-types are saved along the cache body and are
retrieved using `res._headers['content-type']`. If you want to overwrite that,
you can pass a custom type.

```js
app.get('/index.html',
  cache.route({ type: 'text/plain'  }), // force entry type to be "text/plain"
  (req, res) => { ... });
```

## Events

The module emits the following events:

**error**

You can catch errors by adding a listener:

```js
cache.on('error', function (error) {
  throw new Error('Cache error!');
});
```

**message**

`express-redis-cache2` logs some information at runtime. You can access it
like this:

```js
cache.on('message', function (message) {
  // ...
});
```

**connected**

Emitted when the client is connected (or re-connected) to Redis server

```js
cache.on('connected', () => {
  // ....
});
```

**disconnected**

Emitted when the client is disconnected from Redis server. When (and if) it
reconnects, it will emit a 'connected' event again

```js
cache.on('disconnected', () => {
  // ....
});
```

**Note** You can get the connexion status at any time by getting the property
`cache.connected` which returns a boolean (true = connected, false =
disconnected).

## The Entry Model

This is the object synopsis we use to represent a cache entry:

```js
const entry = {
  body:    String // the content of the cache
  touched: Number // last time cache was set (created or updated) as a Unix timestamp
  expire:  Number // the seconds cache entry lives (-1 if does not expire)
  type: String    // the content-type
};
```

## The module

The module exposes a function which instantiates a new instance of a class
called [ExpressRedisCache](https://gitlab.com/demsking/express-redis-cache2/blob/main/index.js).

```js
// This
const cache = require('express-redis-cache2')({ /* ... */ });
// is the same than
const cache = new (require('express-redis-cache2/lib/ExpressRedisCache'))({ /* ... */ });
```

**The constructor**

As stated above, call the function exposed by the module to create a new
instance of `ExpressRedisCache`,

```js
const cache = require('express-redis-cache2')(options);
```

Where `options` is an object that has the following properties:

|   Option    |  Type         |  Default                                                      |  Description                                                |
| ----------- | ------------- | ------------------------------------------------------------- |------------------------------------------------------------ |
| **prefix**  | `String`      | `require('express-redis-cache2/package.json').config.prefix`  | Default prefix (This will be prepended to all entry names)  |
| **expire**  | `Number`      | `undefined`                                                   | Default life time of entries in seconds                     |
| **client**  | `RedisClient` |                                                               | A Redis client                                              |

## API

The `route` method is designed to integrate easily with Express. You can also
define your own caching logics using the other methos of the API shown below.

### `get` Get cache entries

```js
cache.get(/** Mixed (optional) */ query, /** Function( Error, [Entry] ) */ callback );
```

To get all cache entries:

```js
cache.get(function (error, entries) {
  if ( error ) throw error;

  entries.forEach(console.log.bind(console));
});
```

To get a specific entry:

```js
cache.get('home', function (error, entries) {});
```

To get a specific entry for a given prefix:

```js
cache.get({ name: 'home', prefix: 'test' }, function (error, entries) {});
```

You can use wildcard:

```js
cache.get('user*', function (error, entries) {});
```

### `add` Add a new cache entry

```js
cache.add(/** String */ name, /** String */ body, /** Object (optional) **/ options, /** Function( Error, Entry ) */ callback )
```

Where options is an object that can have the following properties:

- **expire** `Number` (lifetime of entry in seconds)
- **type** `String` (the content-type)

Example:

```js
cache.add('user:info', JSON.stringify({ id: 1, email: 'john@doe.com' }), { expire: 60 * 60 * 24, type: 'json' },
    function (error, added) {});
```

### `del` Delete a cache entry

```js
cache.del(/** String */ name, /** Function ( Error, Number deletions ) */ callback);
```

You can use wildcard (*) in name.

### `size` Get cache size for all entries

```js
cache.size(/** Function ( Error, Number bytes ) */);
```

## Example Code

Run the example to see how the caching behaves. You can kill the
`redis-server` and the application will respond with non-cached information.

```sh
yarn install
node example
```

## Development Setup

1. [Install Nix Package Manager](https://nixos.org/manual/nix/stable/installation/installing-binary.html)

2. [Install `direnv` with your OS package manager](https://direnv.net/docs/installation.html#from-system-packages)

3. [Hook it `direnv` into your shell](https://direnv.net/docs/hook.html)

4. At the top-level of your project run:

   ```sh
   direnv allow
   ```

   The next time your launch your terminal and enter the top-level of your
   project, `direnv` will check for changes.

5. Install dependencies

   ```sh
   yarn install
   ```

## License

Under the MIT license.
See [LICENSE](https://gitlab.com/demsking/express-redis-cache2/blob/main/LICENSE)
file for more details.
