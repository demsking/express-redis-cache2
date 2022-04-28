'use strict';

var path      =   require('path');
var assert    =   require('assert');

var mocha     =   require('mocha');
var should    =   require('should');
var RedisClient = require('redis').RedisClient;

var cache = require('../');

var prefix    =   process.env.EX_RE_CA_PREFIX || 'erct:';
var host      =   process.env.EX_RE_CA_HOST || 'localhost';
var port      =   process.env.EX_RE_CA_PORT || 6379;

describe ( 'Module', function () {

  it ( 'should be a function', function () {
    cache.should.be.a.function;
  });

  it ( 'should return a new ExpressRedisCache', function (done) {
    cache = cache({ prefix: prefix, client: require('redis').createClient(port, host) });
    cache.constructor.name.should.equal('ExpressRedisCache');
    cache.on('error', function (error) {
      throw error;
    });
    cache.on('connected', function () {
      done();
    });
  });

  it ( 'should have a property options which is an object', function () {
    expect(cache.options).not.toBeNull();
    expect(typeof cache.options).toBe('object');
  });

  it ( 'should have a property prefix which is a string and equals request prefix', function () {
    expect(cache.prefix).toBe(prefix);
  });

  it ( 'should have a property FOREVER which is a number and equals -1', function () {
    expect(cache.FOREVER).toBe(-1);
  });

  it ( 'should have a property connected which is a boolean and is true', function () {
    expect(cache.connected).toBeTruthy();
  });

  it ( 'should have a property expire which is a number and equals FOREVER', function () {
    expect(cache.expire).toBe(cache.FOREVER);
  });

  it ( 'should have a property client which is a RedisClient', function () {
    expect(cache.client).toBeInstanceOf(RedisClient);
  });
});
