const { mnemonic, secret, password, email } = require("./faucet.json");
const { bob } = require("./scripts/sandbox/accounts");
module.exports = {
  // see <http://truffleframework.com/docs/advanced/configuration>
  // for more details on how to specify configuration options!
  contracts_directory: "./contracts",
  networks: {
    development: {
      host: "http://localhost",
      port: 8732,
      network_id: "*",
      secretKey: bob.sk,
      type: "tezos",
    },
    babylonnet: {
      host: "https://babylonnet.tezos.org.ua",
      network_id: "*",
      secret: "799509e209d5304b2f55a4115253db6c5652b769",
      mnemonic: [
        "mesh",
        "baby",
        "immune",
        "size",
        "payment",
        "thunder",
        "swarm",
        "maple",
        "honey",
        "fuel",
        "sauce",
        "agent",
        "frequent",
        "favorite",
        "repair",
      ],
      password: "Ux5ubnVprV",
      email: "hmrdcflq.bgzftxyn@tezos.example.org",
      pkh: "tz1W1JyMDSGa4kmmWpFXS75osV96vbXqhHHa",
      type: "tezos",
    },
    carthagenet: {
      host: "https://carthagenet.tezos.org.ua",
      network_id: "*",
      secret,
      mnemonic,
      password,
      email,
      type: "tezos",
    },
  },
};
