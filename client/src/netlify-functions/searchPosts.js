const axios = require("axios");

exports.handler = async (event, context) => {
  const req = JSON.parse(event.body);
  let url, name;
  if (req.network === "local") {
    name = `tzblgipfs-local-post`;
  } else if (req.network === "carthage") {
    name = `tzblgipfs-carthage-post`;
  } else if (req.network === "main") {
    name = `tzblgipfs-main-post`;
  }

  if (
    req.input.slice(0, 2) === "tz" &&
    req.input.length > 3 &&
    req.type === "address"
  ) {
    // user is looking for a blogger
    url = `https://api.pinata.cloud/data/pinList?status=pinned&metadata[name]=${name}&metadata[keyvalues]={"origin":{"value":"tezos-ipfs-blog","op":"eq"},"author":{"value":"${req.input}%25","op":"iLike"}}`;
  } else if (
    req.input.slice(0, 2) === "Qm" &&
    req.input.length > 3 &&
    req.type === "ipfsHash"
  ) {
    // user is looking for an IPFS hash
    url = `https://api.pinata.cloud/data/pinList?status=pinned&hashContains=${req.input}&metadata[name]=${name}`;
  } else if (req.input.length > 3 && req.type === "username" && !!req.value) {
    // user is looking for username
    url = `https://api.pinata.cloud/data/pinList?status=pinned&metadata[name]=${name}&metadata[keyvalues]={"origin":{"value":"tezos-ipfs-blog","op":"eq"},"username":{"value":"${req.value}","op":"eq"}}`;
  } else if (req.input.length > 2 && req.type === "tags") {
    // limited to 2 tags for now
    const tags = req.input
      .trim()
      .toLowerCase()
      .replace(/#/g, "")
      .split(" ")
      .slice(0, 2);
    if (tags.length === 1) {
      url = `https://api.pinata.cloud/data/pinList?status=pinned&metadata[name]=${name}&metadata[keyvalues]={"origin":{"value":"tezos-ipfs-blog","op":"eq"},"tags":{"value":"%25${tags[0]}%25","op":"iLike"}}`;
    } else if (tags.length === 2) {
      url = `https://api.pinata.cloud/data/pinList?status=pinned&metadata[name]=${name}&metadata[keyvalues]={"origin":{"value":"tezos-ipfs-blog","op":"eq"},"tags":{"value":"${
        tags[0] + ".*" + tags[1] + "|" + tags[1] + ".*" + tags[0]
      }","op":"iRegexp"}}`;
    }
  } else {
    throw new Error("Invalid input provided!");
  }

  try {
    const response = await axios.get(url, {
      headers: {
        pinata_api_key: process.env.PINATA_API_KEY,
        pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY,
      },
    });

    let results = null;
    if (response.data.count > 0) {
      results = response.data.rows.map((el) => el.ipfs_pin_hash);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ count: response.data.count, rows: results }),
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
      },
    };
  } catch (err) {
    //console.log("error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.toJSON() }),
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
      },
    };
  }
};
