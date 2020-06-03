const manager = artifacts.require("Manager");
const { alice } = require("./../scripts/sandbox/accounts");
const testnetKey = "tz1W1JyMDSGa4kmmWpFXS75osV96vbXqhHHa";
const { MichelsonMap } = require("@taquito/taquito");

const initial_storage = {
  bloggers: new MichelsonMap(),
  bloggersNameToAddress: new MichelsonMap(),
  admin: alice.pkh, //testnetKey,
  updateNameFee: 500000,
  highlightFee: 1000000,
  bloggers_reserved_names: [],
  highlights: [],
  revenue: 0,
  blacklist: [],
};

module.exports = async (deployer) => {
  await deployer.deploy(manager, initial_storage);
};
module.exports.initial_storage = initial_storage;
