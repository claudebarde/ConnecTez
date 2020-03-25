const config = require("./config.js");
const axios = require("axios");

exports.handler = async (event, context) => {
  try {
    console.log(event);
    /*const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;
    axios.post(url, event.body, {
      headers: {
        pinata_api_key: config.pinataApiKey,
        pinata_secret_api_key: config.pinataSecretApiKey
      }
    });*/
    return {
      statusCode: 200,
      body: "test"
    };
  } catch (err) {
    return { statusCode: 500, body: err.toString() };
  }
};
