const axios = require("axios");

const mockResponse = require("./mockResponseForUnsplash.json");

exports.handler = async (event, context) => {
  const req = JSON.parse(event.body);
  try {
    let url = `https://api.unsplash.com/photos/${req.id}/?client_id=${process.env.UNSPLASH_ACCESS_KEY}`;

    let response;
    if (req.network === "local") {
      response = {};
      response.data = mockResponse;
    } else {
      response = await axios.get(url);
    }

    return {
      statusCode: 200,
      body: JSON.stringify(response.data),
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
      },
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.toString() }),
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
      },
    };
  }
};
