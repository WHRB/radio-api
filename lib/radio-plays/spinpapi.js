"use strict";

const crypto = require("crypto");
const moment = require("moment");

module.exports = function createClient(userid, secret, station) {
  const host = "spinitron.com";
  const url = "/public/spinpapi.php";
  const defaultParams = {
    papiversion: "2",
    papiuser: userid,
    station
  };

  return {
    getQuery(myParams) {
      const params = Object.assign({}, defaultParams, myParams);
      params.timestamp = moment.utc().format();

      const queryParams = [];
      for (var key in params) {
        queryParams.push(
          encodeURIComponent(key) + "=" + encodeURIComponent(params[key])
        );
      }
      queryParams.sort();
      const query = queryParams.join("&");
      let signature = host + "\n" + url + "\n" + query;
      const hmac = crypto.createHmac("sha256", secret);
      hmac.update(signature);
      signature = encodeURIComponent(hmac.digest("base64"));

      return "http://" + host + url + "?" + query + "&signature=" + signature;
    }
  };
};
