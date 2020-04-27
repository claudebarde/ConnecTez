const axios = require("axios");

exports.handler = async (event, context) => {
  const req = JSON.parse(event.body);

  try {
    // if comment is more 445 characters, throw error
    if (req.comment.length > 445)
      throw new Error("Comment exceeds 445 characters");

    let url;
    if (req.network === "local") {
      url = `https://api.pinata.cloud/data/pinList?status=pinned&metadata[name]=tzblgipfs-local-comments-${req.id}`;
    } else if (req.network === "carthage") {
      url = `https://api.pinata.cloud/data/pinList?status=pinned&metadata[name]=tzblgipfs-carthage-comments-${req.id}`;
    } else if (req.network === "main") {
      url = `https://api.pinata.cloud/data/pinList?status=pinned&metadata[name]=tzblgipfs-main-comments-${req.id}`;
    } else {
      throw new Error("Unknown network");
    }

    const response = await axios.get(url, {
      headers: {
        pinata_api_key: process.env.PINATA_API_KEY,
        pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY,
      },
    });

    let pinNewComment;
    const comment = {
      postID: req.id,
      author: req.author,
      comment: req.comment,
      timestamp: Date.now(),
    };
    if (response.data.count === 0) {
      // no previous comments found
      pinNewComment = await axios.post(
        `https://api.pinata.cloud/pinning/pinJSONToIPFS`,
        {
          pinataOptions: { cidVersion: 0 },
          pinataMetadata: {
            name: "tzblgipfs-" + req.network + "-comments-" + req.id,
            keyvalues: {
              lastUpdate: Date.now(),
              origin: "tezos-ipfs-blog",
              postID: req.id,
            },
          },
          pinataContent: [comment],
        },
        {
          headers: {
            pinata_api_key: process.env.PINATA_API_KEY,
            pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY,
          },
        }
      );
    } else {
      // previous comments found
      const previousComments = response.data.rows[0];
      const postIPFS = await axios.get(
        `https://gateway.pinata.cloud/ipfs/${previousComments.ipfs_pin_hash}`
      );
      let comments = await postIPFS.data;
      // adds new comment to previous ones
      comments = [comment, ...comments];
      // unpins previous hash
      await axios.delete(
        `https://api.pinata.cloud/pinning/unpin/${previousComments.ipfs_pin_hash}`,
        {
          headers: {
            pinata_api_key: process.env.PINATA_API_KEY,
            pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY,
          },
        }
      );
      // pins new hash
      pinNewComment = await axios.post(
        `https://api.pinata.cloud/pinning/pinJSONToIPFS`,
        {
          pinataOptions: { cidVersion: 0 },
          pinataMetadata: {
            name: "tzblgipfs-" + req.network + "-comments-" + req.id,
            keyvalues: {
              lastUpdate: Date.now(),
              origin: "tezos-ipfs-blog",
              postID: req.id,
            },
          },
          pinataContent: comments,
        },
        {
          headers: {
            pinata_api_key: process.env.PINATA_API_KEY,
            pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY,
          },
        }
      );
    }

    return {
      statusCode: 200,
      body: JSON.stringify(pinNewComment.data),
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
