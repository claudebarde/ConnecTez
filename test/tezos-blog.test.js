const tezosBlog = artifacts.require("tezosBlog");
const { alice, bob } = require("../scripts/sandbox/accounts");
const { Tezos } = require("@taquito/taquito");
const truffleConfig = require("../truffle-config");

contract("TezosBlog", accounts => {
  let contractInstance, storage;
  let wrongIpfsHash = "Qmtest";
  let rightIpfsHash = "QmQkFwzSvh8aWq81JtJ2vTRzh3e2QR1jdWovLoSXzoTqBd";
  const tip = 1000000;

  before(async () => {
    Tezos.setProvider({
      rpc: `${truffleConfig.networks.development.host}:${truffleConfig.networks.development.port}`
    });
    contractInstance = await tezosBlog.deployed();
    /**
     * Display the current contract address for debugging purposes
     */
    console.log("Contract deployed at:", contractInstance.address);

    storage = await contractInstance.storage();
  });

  /*
   * If contract is correctly deployed, Alice is the admin
   */
  it("Alice is the admin", () => {
    assert.equal(alice.pkh, storage.admin);
  });

  /*
   * Checks if name is correctly updated and fee has been paid
   */
  it("Bob fails to update his nickname without creating a post first", async () => {
    let errorMsg;
    try {
      await contractInstance.contract.methods.updateBlogger("sponge-bob").send({
        amount: storage.updateNameFee.toNumber() / 1000000,
        mutez: true
      });
    } catch (error) {
      errorMsg = error.message;
    }

    assert.equal(errorMsg, "Unknown blogger");
  });

  it("Bob tries to send a wrong IPFS hash", async () => {
    let errorMsg;
    try {
      await contractInstance.contract.methods.post(wrongIpfsHash).send();
    } catch (error) {
      errorMsg = error.message;
    }

    assert.equal(errorMsg, "Incorrect IPFS hash provided!");
  });

  it("Bob writes a new blog post with a correct IPFS hash", async () => {
    let opHash;

    try {
      const op = await contractInstance.contract.methods
        .post(rightIpfsHash)
        .send();
      opHash = op.hash;

      assert.typeOf(opHash, "string");
      assert.equal(opHash[0], "o");

      await op.confirmation();
      const newStorage = await contractInstance.storage();

      assert.equal(newStorage.last_posts.length, 1);
    } catch (error) {
      console.log(error);
    }
  });

  it("Bob successfully updates his nickname", async () => {
    const name = "sponge-bob";
    /*
     * Checks if name is correctly updated and fee has been paid
     */
    const op = await contractInstance.contract.methods
      .updateBlogger(name)
      .send({
        amount: storage.updateNameFee.toNumber() / 1000000,
        mutez: true
      });
    await op.confirmation();
    const newStorage = await contractInstance.storage();
    const reservedNames = newStorage.bloggers_reserved_names;
    const blogger = await newStorage.bloggers.get(bob.pkh);

    assert.include(reservedNames, "sponge-bob");
    assert.equal(blogger.name, name);
  });

  it("Bob sends a tip to himself", async () => {
    const bobBalance = await Tezos.tz.getBalance(bob.pkh);
    const op = await contractInstance.contract.methods
      .tip(bob.pkh)
      .send({ amount: tip / 1000000, mutez: true });
    await op.confirmation();
    // new balance
    const bobNewBalance = await Tezos.tz.getBalance(bob.pkh);
    // new tip
    const newStorage = await contractInstance.storage();
    const tips = await newStorage.bloggers_tips.get(bob.pkh);

    assert.approximately(
      bobNewBalance.toNumber(),
      bobBalance.toNumber() - tip,
      1000000
    );
    assert.equal(tips.toNumber(), tip);
  });

  it("Bob withdraws his tips", async () => {
    const bobBalance = await Tezos.tz.getBalance(bob.pkh);
    const op = await contractInstance.contract.methods
      .withdraw([["unit"]])
      .send();
    await op.confirmation();
    const newStorage = await contractInstance.storage();
    const tips = await newStorage.bloggers_tips.get(bob.pkh);
    const bobNewBalance = await Tezos.tz.getBalance(bob.pkh);

    assert.approximately(
      bobNewBalance.toNumber(),
      bobBalance.toNumber() + tip,
      1000000
    );
  });

  it("Bob has no tip left", async () => {
    const newStorage = await contractInstance.storage();
    const tips = await newStorage.bloggers_tips.get(bob.pkh);
    assert.equal(tips.toNumber(), 0);
  });

  it("Bob deletes his post", async () => {
    let error;
    const op = await contractInstance.contract.methods
      .deletePost(rightIpfsHash)
      .send();
    await op.confirmation();
    try {
      const newStorage = await contractInstance.storage();
      await newStorage.all_posts.get(rightIpfsHash);
    } catch (err) {
      error = err.status;
    }

    assert.equal(error, 404);
  });

  it("Bob tries to pause the smart contract and fails", async () => {
    let error;
    try {
      await contractInstance.contract.methods.pauseContract([["unit"]]).send();
    } catch (err) {
      error = err.message;
    }

    assert.equal(error, "You are not allowed to perform this action!");
  });
});
