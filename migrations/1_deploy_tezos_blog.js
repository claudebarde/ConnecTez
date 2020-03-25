const tezosBlog = artifacts.require("TezosBlog");
const { alice } = require("./../scripts/sandbox/accounts");

const initial_storage = {
  bloggers: [],
  bloggers_tips: [],
  last_posts: []
};

module.exports = async deployer => {
  await deployer.deploy(tezosBlog, initial_storage);
};
module.exports.initial_storage = initial_storage;
