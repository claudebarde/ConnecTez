<script>
  import { onMount, afterUpdate, onDestroy } from "svelte";
  import { fly } from "svelte/transition";
  import { Tezos } from "@taquito/taquito";
  import { TezBridgeSigner } from "@taquito/tezbridge-signer";
  import { push, location } from "svelte-spa-router";
  import store from "../../store/store";
  import config from "../../config.js";
  import ConnectWalletButton from "./ConnectWalletButton.svelte";

  let refreshStorageInterval;
  let isSidebarVisible = false;
  let scrollY, navbar;
  let carthageNotification = true;

  $: if (document.getElementById("navbar") && scrollY > 0) {
    if ($store.darkMode === false) {
      navbar.style.backgroundColor = "white";
      navbar.classList.add("has-shadow");
    } else {
      navbar.style.backgroundColor = "#2d3748";
      navbar.classList.remove("has-shadow");
    }
  } else if (document.getElementById("navbar") && scrollY == 0) {
    navbar.style.backgroundColor = "transparent";
    navbar.classList.remove("has-shadow");
  }

  const withdrawTips = async () => {
    try {
      const op = await $store.bloggerAccount.instance.methods
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
    navbar = document.getElementById("navbar");
    let sortedResults = [];
    let highlights = [];
    if (config.DEV_ENV === "local") {
      Tezos.setProvider({
        rpc: "http://localhost:8732"
      });
    } else if (config.DEV_ENV === "carthage") {
      Tezos.setProvider({
        rpc: "https://carthagenet.SmartPy.io"
      });
    } else if (config.DEV_ENV === "main") {
      Tezos.setProvider({
        rpc: ""
      });
    }
    store.setTezosProvider(Tezos);
    // creates contract instance
    const contract = await Tezos.wallet.at($store.contractAddress);
    store.updateContractInstance(contract);
    // fetches contract storage
    const storage = await contract.storage();
    // copies favorite list from local storage
    if (window.localStorage) {
      store.updateFavoriteList(
        JSON.parse(window.localStorage.getItem("favoriteList"))
      );
    }

    // fetches last posts from Pinata
    try {
      const urlToFetchPosts =
        process.env.NODE_ENV === "development"
          ? `http://localhost:${config.NETLIFY_PORT}/fetchPosts`
          : "https://connectez.cc/.netlify/functions/fetchPosts";
      const data = await fetch(urlToFetchPosts, {
        body: JSON.stringify({
          network: config.DEV_ENV
        }),
        method: "POST"
      });
      const results = await data.json();
      if (results && Array.isArray(results)) {
        sortedResults = results.sort((a, b) =>
          a.timestamp > b.timestamp ? -1 : 1
        );
      } else {
        throw results;
      }
    } catch (error) {
      console.log(error);
    }
    // removes highlights from last_posts list
    if (storage.highlights && storage.highlights.size > 0) {
      // gets highlights info
      highlights = await Promise.all(
        [...storage.highlights.entries()].map(async el => {
          try {
            // gets blogger's info
            const bloggerInfo = await storage.bloggers.get(el[1].creator);
            // fetches blogger's account
            const bloggerAccount = await Tezos.contract.at(bloggerInfo.account);
            const accountStorage = await bloggerAccount.storage();
            // gets blogger's post
            const post = await accountStorage.posts.get(el[1].title);

            return {
              urlTitle: el[1].title,
              author: el[1].creator,
              ipfsHash: post.ipfs_hash,
              startTime: el[1].startTime,
              endTime: el[1].endTime
            };
          } catch (err) {
            console.log(err);
            return null;
          }
        })
      );
      // removes highlighted posts from last posts (if any)
      sortedResults = sortedResults.filter(
        el =>
          !highlights.filter(
            highlight =>
              highlight.author === el.author &&
              highlight.urlTitle === el.urlTitle
          ).length
      );
      // removes outdated posts
      highlights = highlights.filter(
        highlight => Date.now() < Date.parse(highlight.endTime)
      );
    }

    store.updateStorage({ ...storage, last_posts: sortedResults, highlights });

    refreshStorageInterval = setInterval(async () => {
      try {
        const newStorage = await $store.contractInstance.storage();
        // there must be existing posts to check if new posts are available or new tips came
        if (newStorage.last_posts.length !== $store.storage.last_posts.length) {
          try {
            const promotedIPFShashes = newStorage.highlights.map(
              post => post.ipfs_hash
            );
            let newValues = newStorage.last_posts.filter(
              el =>
                !$store.storage.last_posts.includes(el) &&
                !promotedIPFShashes.includes(el)
            );
            if (newValues.length > 0) {
              console.log("New post!", newValues);

              store.updateStorage({
                ...$store.storage,
                last_posts: [...newStorage.last_posts]
              });
            }
          } catch (error) {
            //console.log(error);
          }
        }
        // checks if new tips were sent
        if ($store.userAddress && $store.bloggerAccount) {
          // checks if tips have changed
          /*try {
            const newTips = await newStorage.bloggers_tips.get(
              $store.userAddress
            );
            if (newTips && newTips.toNumber() !== $store.userTips) {
              store.updateUserTips(newTips.toNumber());
            }
          } catch (error) {
            //console.log(error);
          }*/
        }
        if ($store.userAddress) {
          // checks if balance has changed
          const balance = await $store.TezosProvider.tz.getBalance(
            $store.userAddress
          );
          if (balance.toNumber() !== $store.userBalance.toNumber()) {
            store.updateUserBalance(balance);
          }
        }
        // checks if new highlights were added
        if ($store.storage.highlights.length !== newStorage.highlights.length) {
          store.updateStorage({
            ...$store.storage,
            highlights: newStorage.highlights
          });
        }
        // updates smart contract status
        if ($store.storage.paused !== newStorage.paused) {
          store.updateStorage({ ...$store.storage, paused: newStorage.paused });
        }
      } catch (error) {
        //console.log("Unable to fetch the storage");
      }
    }, 5000);
    // autoconnects users who connected their wallet previously
    if (window.localStorage && window.localStorage.getItem("previousAddress")) {
      try {
        const address = await window.tezbridge.request({
          method: "get_source"
        });
        store.updateUserAddress(address);
        const balance = await Tezos.tz.getBalance(address);
        store.updateUserBalance(balance);
        // updates Tezos Provider
        store.setTezosProvider({
          ...$store.TezosProvider,
          signer: new TezBridgeSigner()
        });
      } catch (error) {
        store.updateUserAddress(undefined);
        store.updateUserBalance(undefined);
      }
    }
  });

  afterUpdate(async () => {
    // checks if the address is not already associated with an account
    if (
      $store.userAddress &&
      $store.storage &&
      $store.bloggerAccount === undefined
    ) {
      try {
        const blogger = await $store.storage.bloggers.get($store.userAddress);
        if (blogger.account) {
          const accountInstance = await Tezos.contract.at(blogger.account);
          const storage = await accountInstance.storage();
          const balance = await Tezos.tz.getBalance(blogger.account);
          store.updateBloggerAccount({
            ...blogger,
            ...storage,
            balance,
            instance: accountInstance
          });
        } else {
          store.updateBloggerAccount(null);
        }
      } catch (err) {
        console.log(err);
        store.updateBloggerAccount(null);
      }
    } /*else if (!$store.userAddress && !$store.bloggerAccount) {
      store.updateBloggerAccount(null);
    }*/
  });

  onDestroy(() => {
    clearInterval(refreshStorageInterval);
  });
</script>

<style>
  #navbar {
    background-color: #f7fafc;
    transition: 0.4s;
  }

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

  .logo img:first-child {
    max-height: 48px;
    max-width: 48px;
    position: absolute;
    top: 0px;
    left: 0px;
  }
  .logo img:last-child {
    max-height: 28px;
    max-width: 28px;
    position: absolute;
    top: 10px;
    left: 10px;
  }

  .navbar-item-custom {
    cursor: pointer;
  }

  .navbar-navigation {
    transition: 0.3s;
  }
  .navbar-navigation:hover {
    background-color: #f7f8f9;
    border-radius: 10px;
  }

  .sidebar-light {
    background-color: #f7f8f9;
    -webkit-box-shadow: 7px -1px 9px -4px rgba(186, 184, 186, 1);
    -moz-box-shadow: 7px -1px 9px -4px rgba(186, 184, 186, 1);
    box-shadow: 7px -1px 9px -4px rgba(186, 184, 186, 1);
  }

  .sidebar-dark {
    background-color: #333;
    -webkit-box-shadow: 2px 0px 5px 0px rgba(255, 255, 255, 1);
    -moz-box-shadow: 2px 0px 5px 0px rgba(255, 255, 255, 1);
    box-shadow: 2px 0px 5px 0px rgba(255, 255, 255, 1);
  }

  .sidebar {
    position: fixed;
    min-height: 100vh;
    width: 180px;
    z-index: 100;
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

  .sidebar-dark .menu-custom-list {
    color: white;
  }

  .sidebar .menu-icon {
    width: 16px;
  }

  .sidebar-dark .menu-icon:not(.dark-mode-icon) {
    filter: invert(100%);
  }

  .contract-paused-notification,
  .contract-carthagenet-notification {
    position: fixed;
    bottom: 10px;
    right: 20px;
    z-index: 100;
  }

  .dark-mode-icon {
    cursor: pointer;
  }

  .dark-dropdown {
    background-color: #4a5568;
    color: white;
  }

  .dark-navbar-link:hover {
    background-color: #4a5568 !important;
  }

  .dark-links-item:hover {
    background-color: #4a5568 !important;
  }

  @media only screen and (max-width: 1023px) {
    .logo img:first-child {
      max-height: 36px;
      max-width: 36px;
      position: absolute;
      top: 6px;
      left: 6px;
    }
    .logo img:last-child {
      max-height: 20px;
      max-width: 20px;
      position: absolute;
      top: 14px;
      left: 14px;
    }

    .contract-paused-notification,
    .contract-carthagenet-notification {
      position: fixed;
      bottom: 0px;
      right: 0px;
      z-index: 100;
    }
  }
</style>

<svelte:window bind:scrollY />
<nav
  id="navbar"
  class="navbar is-fixed-top is-spaced"
  role="navigation"
  aria-label="main navigation">
  <div class="navbar-brand">
    <div class="navbar-item logo image is-48x48">
      <img
        src="ipfs-logo.png"
        alt="logo"
        in:fly={{ x: -200, delay: 1000, duration: 700 }} />
      <img
        src="tezos.png"
        alt="logo"
        in:fly={{ x: 200, delay: 1400, duration: 700 }} />
    </div>
    <a class="navbar-item" href="#/">
      <span class="logo-title">ConnecTez</span>
    </a>

    <div
      role="button"
      class="navbar-burger burger"
      class:is-active={isSidebarVisible}
      aria-label="menu"
      aria-expanded="false"
      on:click={() => {
        isSidebarVisible = !isSidebarVisible;
      }}>
      <span
        aria-hidden="true"
        style={$store.darkMode ? 'background-color:white' : ''} />
      <span
        aria-hidden="true"
        style={$store.darkMode ? 'background-color:white' : ''} />
      <span
        aria-hidden="true"
        style={$store.darkMode ? 'background-color:white' : ''} />
    </div>
  </div>
  <div class="navbar-menu">
    <div class="navbar-start">
      <div
        class="navbar-item navbar-item-custom"
        class:navbar-navigation={!$store.darkMode}
        on:click={() => push('/')}>
        Home
      </div>
      <div
        class="navbar-item navbar-item-custom"
        class:navbar-navigation={!$store.darkMode}
        on:click={() => push('/upload')}>
        Upload
      </div>
      {#if $store.bloggerAccount}
        <div
          class="navbar-item navbar-item-custom"
          class:navbar-navigation={!$store.darkMode}
          on:click={() => push('/profile')}>
          Profile
        </div>
      {/if}
      <div class="navbar-item navbar-item-custom has-dropdown is-hoverable">
        <a
          class="navbar-link"
          class:dark-navbar-link={$store.darkMode}
          style={$store.darkMode ? 'background-color: transparent;' : ''}>
          Links
        </a>
        <div class="navbar-dropdown" class:dark-dropdown={$store.darkMode}>
          <a
            href="https://github.com/claudebarde/ConnecTez"
            target="_blank"
            rel="noopener noreferrer"
            class="navbar-item"
            class:dark-links-item={$store.darkMode}>
            Github Repo
          </a>
          <a
            href={`https://you.better-call.dev/carthagenet/${$store.contractAddress}/operations`}
            target="_blank"
            rel="noopener noreferrer"
            class="navbar-item"
            class:dark-links-item={$store.darkMode}>
            Smart Contract
          </a>
        </div>
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
          {#if $store.darkMode}
            <div class="tags has-addons">
              <span class="tag is-light">
                ꜩ {($store.userBalance.toNumber() / 1000000).toLocaleString('en-US')}
              </span>
              <span class="tag is-success">
                {store.shortenAddress($store.userAddress)}
              </span>
              {#if config.DEV_ENV === 'local'}
                <span class="tag is-warning">local</span>
              {:else if config.DEV_ENV === 'carthage'}
                <span class="tag is-warning">carthage</span>
              {/if}
            </div>
          {:else}
            <div class="tags has-addons">
              <span class="tag">
                ꜩ {($store.userBalance.toNumber() / 1000000).toLocaleString('en-US')}
              </span>
              <span class="tag is-success is-light">
                {store.shortenAddress($store.userAddress)}
              </span>
              {#if config.DEV_ENV === 'local'}
                <span class="tag is-warning is-light">local</span>
              {:else if config.DEV_ENV === 'carthage'}
                <span class="tag is-warning is-light">carthage</span>
              {/if}
            </div>
          {/if}
        {:else}
          <ConnectWalletButton />
        {/if}
      </div>
      {#if $location.includes('/post/')}
        <div class="navbar-item">
          {#if $store.darkMode}
            <img
              class="dark-mode-icon image is-16x16"
              src="menu-icons/sun.svg"
              alt="dark-mode-off"
              on:click={() => store.toggleDarkMode('off')} />
          {:else}
            <img
              class="dark-mode-icon image is-16x16"
              src="menu-icons/moon.svg"
              alt="dark-mode-on"
              on:click={() => store.toggleDarkMode('on')} />
          {/if}
        </div>
      {:else}
        <div class="navbar-item image is-16x16" />
      {/if}
    </div>
  </div>
</nav>
{#if isSidebarVisible}
  <div
    class={`sidebar is-hidden-desktop ${$store.darkMode ? 'sidebar-dark' : 'sidebar-light'}`}
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
        {#if $location.includes('/post/')}
          {#if $store.darkMode}
            <li
              on:click={() => {
                isSidebarVisible = false;
                store.toggleDarkMode('on');
              }}>
              <img
                class="menu-icon dark-mode-icon"
                src="menu-icons/sun.svg"
                alt="dark-mode-off" />
              Dark Mode
            </li>
          {:else}
            <li
              on:click={() => {
                isSidebarVisible = false;
                store.toggleDarkMode('off');
              }}>
              <img
                class="menu-icon dark-mode-icon"
                src="menu-icons/moon.svg"
                alt="dark-mode-on" />
              Dark Mode
            </li>
          {/if}
        {/if}
      </ul>
    </div>
  </div>
{/if}
{#if $store.storage && $store.storage.paused}
  <div
    class="notification is-danger contract-paused-notification"
    out:fly={{ x: 700, duration: 500 }}>
    >
    <button class="delete" />
    Please be aware that the contract has been put on
    <strong>pause</strong>
    <br />
    for the time being and
    <strong>no transaction can be processed</strong>
    .
    <br />
    This is most probably due to the smart contract undergoing works.
    <br />
    Please come back later to check the status.
    <br />
    Thank you for your understanding.
  </div>
{/if}
{#if config.DEV_ENV === 'carthage' && carthageNotification}
  <div
    class="notification is-warning contract-carthagenet-notification"
    in:fly={{ x: 700, duration: 500, delay: 1000 }}
    out:fly={{ x: 700, duration: 500 }}>
    <button class="delete" on:click={() => (carthageNotification = false)} />
    Please be aware that the contract is deployed on
    <br />
    <strong>Carthage test network</strong>
    .
    <br />
    Everything you create, post or update will be
    <strong>deleted</strong>
    when
    <br />
    the contract will be deployed on Tezos mainnet.
    <br />
    If you want to try the dapp, go to
    <a
      href="https://faucet.tzalpha.net/"
      target="_blank"
      rel="noopener noreferrer">
      this faucet
    </a>
    , get a free key
    <br />
    and create a post :)
  </div>
{/if}
