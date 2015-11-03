var expect = require("chai").expect;
var request = require("request");
var makeServer = require("../lib/server");

if (!process.env.hasOwnProperty("SPIN_STATION")
 || !process.env.hasOwnProperty("SPIN_USERID")
 || !process.env.hasOwnProperty("SPIN_SECRET")
 || !process.env.hasOwnProperty("SCHEDULE_ID")
 || !process.env.hasOwnProperty("SCHEDULE_API_KEY")) {
  require("../testenv.js");
}

describe("/schedule", function () {
  var app;

  this.timeout(5000);

  before(function() {
    app = makeServer(3000);
  });

  after(function() {
    app.close();
  });

  it("should return valid schedule events", function(done){

    request("http://localhost:3000/schedule", function (error, response, body) {
      if (error) {
        throw error;
      }

      expect(response.statusCode).to.equal(200);
      var scheduleData = JSON.parse(body);

      var first = scheduleData[0];

      expect(scheduleData.length).to.be.above(0);
      expect(first).to.have.property("title");
      expect(first).to.have.property("startTime");
      expect(first).to.have.property("endTime");

      done();
    });

  });

});

describe("/nowplaying", function () {

  it("should return the current playing song data");

});

describe("/recentplays", function () {

  it("should return the specified number of recently played songs");

});

describe("/streams", function () {

  it("should return a list of available audio streams");

});