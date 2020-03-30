<script>
  import { onMount, onDestroy } from "svelte";
  import { fly } from "svelte/transition";
  import { Tezos } from "@taquito/taquito";
  import { TezBridgeSigner } from "@taquito/tezbridge-signer";
  import { push } from "svelte-spa-router";
  import store from "../../store/store";

  let refreshStorageInterval;
  let isSidebarVisible = false;

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
      rpc:
        process.env.NODE_ENV === "development"
          ? "http://localhost:8732"
          : "https://api.tez.ie/rpc/mainnet",
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
      //console.log(await storage.bloggers.get(address));
    } catch (error) {
      store.updateUserAddress(undefined);
      store.updateUserBalance(undefined);
    }
    refreshStorageInterval = setInterval(async () => {
      const newStorage = await $store.contractInstance.storage();
      try {
        // checks if new posts were added
        if (newStorage.last_posts.length !== $store.storage.last_posts.length) {
          let newValues = newStorage.last_posts.filter(
            el => !$store.storage.last_posts.includes(el)
          );
          console.log(
            "New post!",
            newValues.length > 0 ? newValues[0] : newValues
          );
        }
        store.updateStorage(newStorage);
      } catch (error) {
        //console.log(error);
      }
      try {
        // checks if new tips were sent
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

  .sidebar {
    position: fixed;
    min-height: 100vh;
    width: 180px;
    background-color: #f7f8f9;
    z-index: 100;
    -webkit-box-shadow: 7px -1px 9px -4px rgba(186, 184, 186, 1);
    -moz-box-shadow: 7px -1px 9px -4px rgba(186, 184, 186, 1);
    box-shadow: 7px -1px 9px -4px rgba(186, 184, 186, 1);
    padding: 10px;
  }

  .sidebar .menu-custom-label {
    margin-bottom: 20px;
    font-weight: bold;
  }

  .sidebar .menu-custom-list {
    line-height: 2.5rem;
    padding-left: 10px;
  }

  .sidebar .menu-icon {
    width: 16px;
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

    <div
      role="button"
      class="navbar-burger burger"
      class:is-active={isSidebarVisible}
      aria-label="menu"
      aria-expanded="false"
      data-target="navbarBasicExample"
      on:click={() => (isSidebarVisible = !isSidebarVisible)}>
      <span aria-hidden="true" />
      <span aria-hidden="true" />
      <span aria-hidden="true" />
    </div>
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
      {#if $store.userAddress}
        <div
          class="navbar-item navbar-navigation"
          on:click={() => push('/profile')}>
          Profile
        </div>
      {/if}
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
{#if isSidebarVisible}
  <div
    class="sidebar is-hidden-desktop"
    transition:fly={{ x: -100, duration: 300 }}>
    <div class="menu-custom">
      <p class="menu-custom-label">Menu</p>
      <ul class="menu-custom-list">
        <li
          on:click={() => {
            isSidebarVisible = false;
            push('/');
          }}>
          <img src="menu-icons/home.svg" alt="home" class="menu-icon" />
          Home
        </li>
        <li
          on:click={() => {
            isSidebarVisible = false;
            push('/upload');
          }}>
          <img
            src="menu-icons/upload-cloud.svg"
            alt="upload"
            class="menu-icon" />
          Upload
        </li>
        {#if $store.userAddress}
          <li
            on:click={() => {
              isSidebarVisible = false;
              push('/profile');
            }}>
            <img src="menu-icons/user.svg" alt="user" class="menu-icon" />
            Profile
          </li>
        {/if}
        {#if $store.userTips && $store.userTips > 0}
          <li
            on:click={() => {
              isSidebarVisible = false;
              withdrawTips();
            }}>
            <img src="menu-icons/gift.svg" alt="gift" class="menu-icon" />
            Withdraw ꜩ{$store.userTips / 1000000}
          </li>
        {/if}
      </ul>
    </div>
  </div>
{/if}
