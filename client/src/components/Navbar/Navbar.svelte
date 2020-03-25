<script>
  import { onMount } from "svelte";
  import { Tezos } from "@taquito/taquito";
  import { TezBridgeSigner } from "@taquito/tezbridge-signer";
  import store from "../../store/store";

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

  const shortenAddress = addr =>
    addr.slice(0, 6) + "..." + addr.slice(addr.length - 6);

  onMount(async () => {
    // sets RPC
    Tezos.setProvider({
      rpc: "http://localhost:8732",
      signer: new TezBridgeSigner()
    });
    // creates contract instance
    const contract = await Tezos.contract.at($store.contractAddress);
    // fetches contract storage
    const storage = await contract.storage();
    store.setStorage(storage);
    try {
      const address = await window.tezbridge.request({ method: "get_source" });
      store.updateUserAddress(address);
      const balance = await Tezos.tz.getBalance(address);
      store.updateUserBalance(balance);
    } catch (error) {
      store.updateUserAddress(undefined);
      store.updateUserBalance(undefined);
    }
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
</style>

<nav class="navbar is-fixed-top" role="navigation" aria-label="main navigation">
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
      <a class="navbar-item" href="#/">Home</a>
      <a class="navbar-item" href="#/upload">Upload</a>
    </div>

    <div class="navbar-end">
      <div class="navbar-item">
        {#if $store.userBalance}
          <span class="balance is-size-7">
            ꜩ {$store.userBalance.toNumber() / 1000000}
          </span>
          <button class="button is-success is-light">
            {shortenAddress($store.userAddress)}
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
