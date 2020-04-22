const axios = require("axios");

exports.handler = async (event, context) => {
  const req = JSON.parse(event.body);
  let url, name;
  let tags = [];

  if (req.network === "local") {
    name = `tzblgipfs-local-post`;
  } else if (req.network === "carthage") {
    name = `tzblgipfs-carthage-post`;
  } else if (req.network === "main") {
    name = `tzblgipfs-main-post`;
  }
  const date = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  url = `https://api.pinata.cloud/data/pinList?status=pinned&metadata[name]=${name}&pinStart=${date}`;
  try {
    const response = await axios.get(url, {
      headers: {
        pinata_api_key: process.env.PINATA_API_KEY,
        pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY,
      },
    });

    if (response.data.count > 0) {
      const newTags = response.data.rows
        .map((post) => JSON.parse(post.metadata.keyvalues.tags))
        .flat(Infinity)
        .filter((el) => el);
      tags = [...newTags];
    }

    return {
      statusCode: 200,
      body: JSON.stringify(tags),
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
