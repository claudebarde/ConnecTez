const tezosBlog = artifacts.require("TezosBlog");
const { alice } = require("./../scripts/sandbox/accounts");
const testnetKey = "tz1W1JyMDSGa4kmmWpFXS75osV96vbXqhHHa";

const initial_storage = {
  bloggers: [],
  bloggers_tips: [],
  last_posts: [],
  all_posts: [],
  admin: testnetKey, //alice.pkh,
  updateNameFee: 500000,
  bloggers_reserved_names: [],
  paused: false,
  revenue: 0,
};

module.exports = async (deployer) => {
  await deployer.deploy(tezosBlog, initial_storage);
};
module.exports.initial_storage = initial_storage;
