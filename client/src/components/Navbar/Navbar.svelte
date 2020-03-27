<script>
  import { onMount, onDestroy } from "svelte";
  import { Tezos } from "@taquito/taquito";
  import { TezBridgeSigner } from "@taquito/tezbridge-signer";
  import { push } from "svelte-spa-router";
  import store from "../../store/store";

  let refreshStorageInterval;

  const initWallet = async () => {
    try {
      // gets user's address
      const address = await window.tezbridge.request({ method: "get_source" });
      store.updateUserAddress(address);
      // gets user's balance
      const balance = await Tezos.tz.getBalance(address);
      store.updateUserBalance(balance);
    } catch (error) {
      console.log("error fetching the address or balance:", error);
    }
  };

  const withdrawTips = async () => {
    try {
      const op = await $store.contractInstance.methods
        .withdraw([["unit"]])
        .send();
      await op.confirmation(1);
      // updates UI
      const balance = await $store.TezosProvider.tz.getBalance(
        $store.userAddress
      );
      store.updateUserBalance(balance);
      store.updateUserTips(0);
    } catch (error) {
      console.log(error);
    }
  };

  onMount(async () => {
    // sets RPC
    Tezos.setProvider({
      rpc: "http://localhost:8732",
      signer: new TezBridgeSigner()
    });
    store.setTezosProvider(Tezos);
    // creates contract instance
    const contract = await Tezos.contract.at($store.contractAddress);
    store.updateContractInstance(contract);
    // fetches contract storage
    const storage = await contract.storage();
    store.updateStorage(storage);
    // updates address and balance
    try {
      const address = await window.tezbridge.request({ method: "get_source" });
      store.updateUserAddress(address);
      const balance = await Tezos.tz.getBalance(address);
      store.updateUserBalance(balance);
    } catch (error) {
      store.updateUserAddress(undefined);
      store.updateUserBalance(undefined);
    }
    // updates tips if any
    try {
      const tips = await storage.bloggers_tips.get($store.userAddress);
      store.updateUserTips(tips.toNumber());
    } catch (error) {
      store.updateUserTips(undefined);
    }
    refreshStorageInterval = setInterval(async () => {
      try {
        const newStorage = await $store.contractInstance.storage();
        // checks if new posts were added
        if (newStorage.last_posts.length !== $store.storage.last_posts.length) {
          let newValues = newStorage.last_posts.filter(
            el => !$store.storage.last_posts.includes(el)
          );
          console.log("New post!");
        }
        store.updateStorage(newStorage);
      } catch (error) {
        //console.log(error);
      }
      try {
        // checks if new tips were sent
        const newStorage = await $store.contractInstance.storage();
        const newTips = await newStorage.bloggers_tips.get($store.userAddress);
        if (newTips && newTips.toNumber() !== $store.userTips) {
          console.log("New tip!", newTips.toNumber());
          store.updateUserTips(newTips.toNumber());
        }
      } catch (error) {
        //console.log(error);
      }
    }, 5000);
    /*const sub = Tezos.stream.subscribeOperation({
      or: [
        {
          and: [
            { destination: $store.contractAddress },
            { kind: "transaction" }
          ]
        }
      ]
    });
    sub.on("data", data => {
      // updates storage when new post is created
      console.log("New data", data);
      try {
        if (data.parameters.entrypoint === "post") {
          const ipfsHash = data.parameters.value.string;
          store.updateStorage({
            ...$store.storage,
            last_posts: [
              { ipfs_hash: ipfsHash, timestamp: "" },
              ...$store.storage.last_posts
            ]
          });
          console.log("New post:", ipfsHash);
        } else if (data.parameters.entrypoint === "tip") {
          console.log("New tip", data);
          // updates user's tips balance if current user is the recipient
          if (data.parameters.value.string === $store.userAddress) {
            store.updateUserTips(
              parseInt($store.userTips) + parseInt(data.amount)
            );
          }
        }
      } catch (error) {
        console.log(error);
      }
    });*/
  });

  onDestroy(() => {
    clearInterval(refreshStorageInterval);
  });
</script>

<style>
  a {
    color: inherit;
    text-decoration: none;
  }

  a:hover {
    color: inherit;
  }

  .logo-title {
    font-weight: bold;
    margin-left: 10px;
  }

  .balance {
    padding-right: 10px;
  }

  .navbar-navigation {
    transition: 0.3s;
  }
  .navbar-navigation:hover {
    cursor: pointer;
    background-color: #f7f8f9;
    border-radius: 10px;
  }
</style>

<nav
  class="navbar is-fixed-top has-shadow is-spaced"
  role="navigation"
  aria-label="main navigation">
  <div class="navbar-brand">
    <a class="navbar-item" href="#/">
      <img src="ipfs-tezos.png" alt="logo" />
      <span class="logo-title">Tezos-IPFS Blog</span>
    </a>

    <!--<a
      role="button"
      class="navbar-burger burger"
      aria-label="menu"
      aria-expanded="false"
      data-target="navbarBasicExample">
      <span aria-hidden="true" />
      <span aria-hidden="true" />
      <span aria-hidden="true" />
    </a>-->
  </div>
  <div class="navbar-menu">
    <div class="navbar-start">
      <div class="navbar-item navbar-navigation" on:click={() => push('/')}>
        Home
      </div>
      <div
        class="navbar-item navbar-navigation"
        on:click={() => push('/upload')}>
        Upload
      </div>
      {#if $store.userTips && $store.userTips > 0}
        <div class="navbar-item navbar-navigation" on:click={withdrawTips}>
          Withdraw ꜩ{$store.userTips / 1000000}
        </div>
      {/if}
    </div>

    <div class="navbar-end">
      <div class="navbar-item">
        {#if $store.userBalance}
          <span class="balance is-size-7">
            ꜩ {$store.userBalance.toNumber() / 1000000}
          </span>
          <button class="button is-success is-light">
            {store.shortenAddress($store.userAddress)}
          </button>
        {:else}
          <button class="button is-info is-light" on:click={initWallet}>
            Connect wallet
          </button>
        {/if}
      </div>
    </div>
  </div>
</nav>
