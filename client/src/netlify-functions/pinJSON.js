const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

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
    const req = JSON.parse(event.body);
    // checks if user did not pin a post in the last 15 minutes
    const lastPinUrl = `https://api.pinata.cloud/data/pinList?status=pinned&pinStart=${new Date(
      Date.now() - 15 * 60 * 1000
    ).toISOString()}&metadata[name]=${
      req.network
    }&metadata[keyvalues]={"author":{"value":"${req.author}","op":"eq"}}`;
    console.log(lastPinUrl);
    const lastPinResponse = await axios.get(lastPinUrl, {
      headers: {
        pinata_api_key: process.env.PINATA_API_KEY,
        pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY,
      },
    });
    if (lastPinResponse.data.count > 0) throw new Error("POSTDELAY");
    // pins posts
    const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;
    // if string is too long
    if (!rightByteLength(req.content)) throw new Error("Content is too large!");

    const postID = uuidv4();

    const response = await axios.post(
      url,
      {
        pinataOptions: { cidVersion: 0 },
        pinataMetadata: {
          name: "tzblgipfs-" + req.network + "-" + req.type + "-" + postID,
          keyvalues: {
            author: req.author,
            username: req.username,
            origin: "tezos-ipfs-blog",
            timestamp: Date.now(),
            tags: JSON.stringify(
              req.tags.slice(0, 3).map((tag) => tag.toLowerCase())
            ),
            type: req.type,
          },
        },
        pinataContent: {
          id: postID,
          title: req.title,
          subtitle: req.subtitle,
          content: req.content,
          author: req.author,
          icon: req.icon,
          banner: req.banner,
          tags: req.tags.slice(0, 3).map((tag) => tag.toLowerCase()),
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
