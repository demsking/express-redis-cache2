// var path      =   require('path');
var assert    =   require('assert');

var mocha     =   require('mocha');
var should    =   require('should');
var supertest =   require('supertest');
var util      =   require('util');

var prefix    =   process.env.EX_RE_CA_PREFIX || 'erct:';
var host      =   process.env.EX_RE_CA_HOST || 'localhost';
var port      =   process.env.EX_RE_CA_PORT || 6379;
var expressHost =   process.env.EX_EXPRESS_HOST || 'localhost';

var app       = supertest(require('../express/server.js'));

var spawn,
    home;

describe ( 'test with small express server', () => {

  it ( 'should have a / route', () => {
    app.get('/').expect(200);
  });

  it ( 'should not have /foobar route', () => {
    app.get("/foobar").expect(404);
  });

  it ( '/1sec route should return json with a timestamp property', () => {
    return app.get('/1sec')
      .expect(200)
      .then((response) => expect(typeof JSON.parse(response.text).timestamp).toBe('number'));
  });

  it ( '/default_expire route should return json with a timestamp property', () => {
    var url = "/default_expire";
    return app.get(url)
      .expect(200)
      .then((response) => expect(typeof JSON.parse(response.text).timestamp).toBe('number'));
  });

  it ( '/never_expire route should return json with a timestamp property', () => {
    var url = "/never_expire";
    return app.get(url)
      .expect(200)
      .then((response) => expect(typeof JSON.parse(response.text).timestamp).toBe('number'));
  });

  it ( '/1sec route data should expire after 1 seconds', (done) => {
    setTimeout(() => {
      var url = "/1sec";

      app.get(url)
        .expect(200)
        .then(({ text: body }) =>{
          var p_body = JSON.parse(body),
              timestamp = p_body.timestamp,
              now_timestamp = Math.floor(Date.now() / 1000);

          // Some Mocha weirdness requires a try/catch
          // or an AssertionError will crash the mocha process on error
          try {
            timestamp.should.be.above(now_timestamp - 1);
            done();
          } catch (e) {
            done(e);
          }
        })
        .catch(done);
    }, 1100);
  });

  it ( '/default_expire route data should expire after 3 seconds', (done) => {
    setTimeout(() => {
      var url = "/default_expire";

      app.get(url)
        .expect(200)
        .then(({ text: body }) =>{
          var p_body = JSON.parse(body),
              timestamp = p_body.timestamp,
              now_timestamp = Math.floor(Date.now() / 1000);

          // Some Mocha weirdness requires a try/catch
          // or an AssertionError will crash the mocha process on error
          try {
            timestamp.should.be.above(now_timestamp - 3);
            done();
          } catch (e) {
            done(e);
          }
        })
        .catch(done);
    }, 3100);
  }, 4000);

  it ( '/never_expire route data should not expire after 3 seconds', (done) => {
    setTimeout(() => {
      var url = "/never_expire";

      app.get(url)
        .expect(200)
        .then(({ text: body }) =>{
          var p_body = JSON.parse(body),
              timestamp = p_body.timestamp,
              now_timestamp = Math.floor(Date.now() / 1000);

          // Some Mocha weirdness requires a try/catch
          // or an AssertionError will crash the mocha process on error
          try {
            timestamp.should.be.below(now_timestamp - 3);
            done();
          } catch (e) {
            done(e);
          }
        })
        .catch(done);
    }, 3100);
  }, 4000);

  it ( '/never_expire/delete route data should be deleted', () => {
    var url = "/delete_never_expire";

    return app.get(url)
      .expect(200)
      .then((response) => expect(response.text).toBe('count:1'));
  });
});
