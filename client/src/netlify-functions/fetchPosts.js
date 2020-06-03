const axios = require("axios");

exports.handler = async (event, context) => {
  const req = JSON.parse(event.body);
  let url;
  if (req.network === "local") {
    url = `https://api.pinata.cloud/data/pinList?status=pinned&pageLimit=30&metadata[name]=tzblgipfs-local-post`;
  } else if (req.network === "carthage") {
    url = `https://api.pinata.cloud/data/pinList?status=pinned&pageLimit=30&metadata[name]=tzblgipfs-carthage-post`;
  } else if (req.network === "main") {
    url = `https://api.pinata.cloud/data/pinList?status=pinned&pageLimit=30&metadata[name]=tzblgipfs-main-post`;
  }

  try {
    const response = await axios.get(url, {
      headers: {
        pinata_api_key: process.env.PINATA_API_KEY,
        pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY,
      },
    });

    /*const rawPosts = response.data.rows.filter((entry) =>
      req.posts.includes(entry.ipfs_pin_hash)
    );
    // removes posts that are not registered on the blockchain
    const postsToRemove = response.data.rows.filter(
      (entry) => !req.posts.includes(entry.ipfs_pin_hash)
    );
    if (postsToRemove.length > 0) {
      postsToRemove.map((el) => {
        try {
          const url = `https://api.pinata.cloud/pinning/unpin/${el.ipfs_pin_hash}`;
          axios.delete(url, {
            headers: {
              pinata_api_key: process.env.PINATA_API_KEY,
              pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY,
            },
          });
        } catch (error) {
          console.log(error);
        }
      });
    }*/

    const posts = response.data.rows.map((el) => ({
      ipfsHash: el.ipfs_pin_hash,
      timestamp: el.metadata.keyvalues.timestamp,
      id: el.metadata.name.replace(`tzblgipfs-${req.network}-post-`, ""),
      urlTitle: el.metadata.keyvalues.urlTitle,
    }));

    return {
      statusCode: 200,
      body: JSON.stringify(posts),
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
