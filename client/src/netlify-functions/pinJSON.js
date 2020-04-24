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
    if (lastPinResponse.data.count > 0) throw new Error("post delay");
    // pins posts
    const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;
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
            req.type +
            "-" +
            Math.round(Math.random() * 36 ** 12).toString(36) +
            Date.now().toString().slice(-5),
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

/*
{
        "pinataOptions": { "cidVersion": 0 },
        "pinataMetadata": {
          "name": "tzblgipfs-carthage-9xtjp5hgmc8028989",
          "keyvalues": {
            "author": "tz1PVAAVKbvASA79wBVVsgTVHvkEakupHJ9Y",
            "origin": "tezos-ipfs-blog",
            "timestamp": "1586791428989",
            "tags": [],
          },
        },
        "pinataContent": {
          "title": "Test One",
          "content": "Trying to figure out what's going on",
          "author": "tz1PVAAVKbvASA79wBVVsgTVHvkEakupHJ9Y",
          "icon": "scroll",
          "tags": [],
          "timestamp": 1586791428989,
        },
      },
      {
        "headers": {
          "pinata_api_key": "b76e99641d4661867d85",
          "pinata_secret_api_key": "891e5c6f9542aa605dfc403cba8796a1c9efffd29e7960ca37f71bb6111db3f1",
        },
      }
      */
