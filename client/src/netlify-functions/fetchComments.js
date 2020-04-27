const axios = require("axios");

exports.handler = async (event, context) => {
  const req = JSON.parse(event.body);
  let url;
  if (req.network === "local") {
    url = `https://api.pinata.cloud/data/pinList?status=pinned&metadata[name]=tzblgipfs-local-comments-${req.id}`;
  } else if (req.network === "carthage") {
    url = `https://api.pinata.cloud/data/pinList?status=pinned&metadata[name]=tzblgipfs-carthage-comments-${req.id}`;
  } else if (req.network === "main") {
    url = `https://api.pinata.cloud/data/pinList?status=pinned&metadata[name]=tzblgipfs-main-comments-${req.id}`;
  }

  try {
    const response = await axios.get(url, {
      headers: {
        pinata_api_key: process.env.PINATA_API_KEY,
        pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY,
      },
    });

    let comments = [];
    if (response.data.count === 1) {
      const postComments = await axios.get(
        `https://gateway.pinata.cloud/ipfs/${response.data.rows[0].ipfs_pin_hash}`
      );
      comments = await postComments.data;
    }

    return {
      statusCode: 200,
      body: JSON.stringify(comments),
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
