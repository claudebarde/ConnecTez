const axios = require("axios");

exports.handler = async (event, context) => {
  try {
    const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;
    const req = JSON.parse(event.body);
    const response = await axios.post(
      url,
      {
        pinataOptions: { cidVersion: 0 },
        pinataMetadata: {
          name:
            req.title.toLowerCase().replace(/ +/g, "-") +
            "-" +
            Date.now()
              .toString()
              .slice(-5)
        },
        pinataContent: {
          title: req.title,
          content: req.content,
          author: req.author,
          icon: req.icon,
          timestamp: Date.now()
        }
      },
      {
        headers: {
          pinata_api_key: process.env.PINATA_API_KEY,
          pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY
        }
      }
    );
    //console.log("axios response:", response.data);
    return {
      statusCode: 200,
      body: JSON.stringify(response.data),
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE"
      }
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.toString() }),
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE"
      }
    };
  }
};
