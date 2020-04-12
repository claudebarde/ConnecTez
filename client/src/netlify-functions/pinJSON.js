const axios = require("axios");

const rightByteLength = (str) => {
  // returns the byte length of an utf8 string
  var s = str.length;
  for (let i = str.length - 1; i >= 0; i--) {
    const code = str.charCodeAt(i);
    if (code > 0x7f && code <= 0x7ff) s++;
    else if (code > 0x7ff && code <= 0xffff) s += 2;
    if (code >= 0xdc00 && code <= 0xdfff) i--; //trail surrogate
  }

  if (Math.round(s / 1024) >= 100) {
    return false;
  } else {
    return true;
  }
};

exports.handler = async (event, context) => {
  try {
    const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;
    const req = JSON.parse(event.body);
    // if string is too long
    if (!rightByteLength(req.content)) throw new Error("Content is too large!");

    const response = await axios.post(
      url,
      {
        pinataOptions: { cidVersion: 0 },
        pinataMetadata: {
          name:
            "tzblgipfs-" +
            req.network +
            "-" +
            Math.round(Math.random() * 36 ** 12).toString(36) +
            Date.now().toString().slice(-5),
          keyvalues: {
            author: req.author,
            origin: "tezos-ipfs-blog",
            timestamp: Date.now(),
            tags: JSON.stringify(req.tags.slice(0, 3)),
          },
        },
        pinataContent: {
          title: req.title,
          content: req.content,
          author: req.author,
          icon: req.icon,
          tags: req.tags.slice(0, 3),
          timestamp: Date.now(),
        },
      },
      {
        headers: {
          pinata_api_key: process.env.PINATA_API_KEY,
          pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY,
        },
      }
    );
    //console.log("axios response:", response.data);
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
