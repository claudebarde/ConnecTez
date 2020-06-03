<script>
  import { onMount, onDestroy } from "svelte";
  import { fade, fly } from "svelte/transition";
  import { push } from "svelte-spa-router";
  import store from "../store/store";
  import Loader from "../components/Loader.svelte";
  import MarkdownEditor from "../components/MardownEditor.svelte";
  import NewPostButton from "../components/NewPostButton.svelte";
  import UserIcon from "../components/Icons/UserIcon.svelte";
  import ImageIcon from "../components/Icons/ImageIcon.svelte";
  import config from "../config.js";

  let title,
    subtitle,
    urlTitle = "";
  let banner = {};
  let post = "";
  let IPFSHash = undefined;
  let txHash = undefined;
  let errorMessage = undefined;
  let savePost = undefined; // "uploadConfirm" | "waitingForIPFSHash" | "waitingForBlockchain" | "confirmed" | "error"
  let selectIcon = false;
  let selectedIcon = undefined;
  let selectBanner,
    errorBannerLink,
    loadingBanner = false;
  let lastPostDelay,
    lastPostInterval = undefined;
  const availableIcons = [
    "box",
    "clock",
    "edit",
    "female-user",
    "idea",
    "image-file",
    "lock",
    "puzzle",
    "rating",
    "scroll",
    "search",
    "share",
    "toolbox",
    "trash",
    "twitter",
    "user-male"
  ];
  let currentTag = "";
  let tags = [];

  const checkPostStatus = event => {
    if (savePost === "waitingForBlockchain" || post.length > 0) {
      event.preventDefault();
      event.returnValue = "";
    }
  };

  const writePost = event => {
    post = event.detail;
  };

  const addTag = () => {
    if (currentTag.length > 0 && tags.length < 3) {
      const newTags = new Set([
        ...tags,
        ...currentTag
          .trim()
          .toLowerCase()
          .split(/ +/g)
      ]);
      //newTags.add(...tag.trim().split(/ +/g));
      tags = [...newTags].slice(0, 3);
      currentTag = "";
    }
  };

  const addBannerLink = async event => {
    const link = event.target.value;
    // checks if the link is correct
    if (
      /^https:\/\/unsplash\.com\/photos\/.*$/.test(link) === true &&
      !loadingBanner
    ) {
      errorBannerLink = false;
      // extracts ID
      const photoID = link.split("/photos/")[1];
      // request photo URL from Unsplash API
      loadingBanner = true;
      try {
        const url =
          process.env.NODE_ENV === "development"
            ? "http://localhost:34567/fetchUnsplashPhoto"
            : "https://connectez.cc/.netlify/functions/fetchUnsplashPhoto";
        const data = await fetch(url, {
          body: JSON.stringify({
            id: photoID,
            network: config.DEV_ENV
          }),
          method: "POST"
        });
        const results = await data.json();
        banner.url = link;
        banner.author = results.user.name;
        banner.thumb = results.urls.thumb;
        loadingBanner = false;
      } catch (error) {
        console.log(error);
        loadingBanner = false;
        banner = {};
      }
    } else {
      errorBannerLink = true;
      banner = {};
    }
  };

  const addBanner = () => {
    selectBanner = false;
  };

  const confirmUpload = async () => {
    // must have sufficient balance to pay for gas
    if (!$store.userAddress && $store.userBalance.toNumber() < 100000) return;
    // cannot make another post before waiting 15 minutes
    if (window.localStorage) {
      const lastPost = parseInt(window.localStorage.getItem("lastPost"));
      if (Date.now() < lastPost + 15 * 60 * 1000) {
        console.log("too soon");
        return;
      }
    }

    urlTitle = encodeURIComponent(title.toLowerCase().replace(/\s+/g, "-"));

    const PINJSON =
      process.env.NODE_ENV === "development"
        ? "http://localhost:34567/pinJSON"
        : "https://connectez.cc/.netlify/functions/pinJSON";
    try {
      // checks if title and post is provided
      if (!!title.trim() && !!post.trim()) {
        savePost = "waitingForIPFSHash";
        // removes thumb property from banner object
        if (banner.hasOwnProperty("thumb")) delete banner.thumb;

        const data = await fetch(PINJSON, {
          body: JSON.stringify({
            title,
            subtitle,
            urlTitle,
            content: post,
            author: $store.userAddress,
            username: $store.userName || "",
            icon: selectedIcon || "",
            banner,
            network: config.DEV_ENV,
            type: "post",
            tags
          }),
          method: "POST"
        });
        const response = await data.json();
        // checks if IPFS hash is received
        if (response.IpfsHash) {
          IPFSHash = response.IpfsHash;
          savePost = "waitingForBlockchain";
          // creates
          // saves IPFS hash onto the blockchain
          const op = await $store.bloggerAccount.instance.methods
            .post(IPFSHash, urlTitle)
            .send();
          txHash = op.hash;
          await op.confirmation();
          if (window.localStorage) {
            window.localStorage.setItem("lastPost", Date.now());
            // sets new delay
            lastPostInterval = setInterval(
              () =>
                (lastPostDelay =
                  Date.now() >
                  parseInt(window.localStorage.getItem("lastPost")) +
                    15 * 60 * 1000),
              5000
            );
          }
          savePost = "confirmed";
        } else {
          if (response.error) {
            if (response.error.includes("POSTDELAY")) {
              throw new Error("You must wait 15 minutes between each post.");
            } else {
              throw new Error(response.error);
            }
          } else {
            throw new Error("An error has occurred");
          }
        }
      } else {
        throw new Error("Invalid title or post");
      }
    } catch (error) {
      console.log(error);
      savePost = "error";
      if (error.message) {
        errorMessage = error.message;
      } else {
        errorMessage = error;
      }
      if (IPFSHash) {
        const UNPINJSON =
          process.env.NODE_ENV === "development"
            ? "http://localhost:34567/unpinJSON"
            : "https://connectez.cc/.netlify/functions/unpinJSON";
        const response = await fetch(UNPINJSON, {
          body: JSON.stringify({ hash: IPFSHash }),
          method: "POST"
        });
        console.log(response);
      }
    }
  };

  onMount(() => {
    if (window.localStorage) {
      const lastPost = parseInt(window.localStorage.getItem("lastPost"));
      if (Date.now() < lastPost + 15 * 60 * 1000) {
        lastPostDelay = false;
        lastPostInterval = setInterval(
          () =>
            (lastPostDelay =
              Date.now() >
              parseInt(window.localStorage.getItem("lastPost")) +
                15 * 60 * 1000),
          5000
        );
      } else {
        lastPostDelay = true;
      }
    }
  });

  onDestroy(() => {
    clearInterval(lastPostInterval);
  });
</script>

<style>
  main {
    padding-top: 80px;
  }

  .upload-container {
    padding-top: 20px;
    height: 100%;
    width: 60%;
    margin: 0 auto;
    background-color: #ffffff;
  }

  .upload-buttons {
    margin: 10px;
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
  }

  .confirm-buttons {
    margin: 20px;
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
  }

  .confirm-buttons button {
    margin-right: 10px;
  }

  .icon-select {
    margin: 0 auto;
    cursor: pointer;
  }

  .selected-icon {
    margin: 0 auto;
  }

  .button-icon {
    opacity: 0.4;
  }

  .unsplash-select__div {
    margin-bottom: 20px;
  }

  .prepost {
    padding-bottom: 20px;
  }

  @media only screen and (max-width: 1023px) {
    main {
      padding-top: 30px;
    }

    .upload-container {
      padding-top: 30px;
      width: 90%;
      height: auto;
      min-height: 100%;
    }

    .reverse-columns {
      flex-direction: column-reverse;
      display: flex;
    }
  }
</style>

<svelte:head>
  <title>ConnecTez</title>
</svelte:head>
<svelte:window on:beforeunload={checkPostStatus} />
{#if $store.userAddress}
  <!-- MODAL TO CONFIRM UPLOAD TO IPFS -->
  {#if savePost === 'uploadConfirm'}
    <div class="modal is-active">
      <div
        class="modal-background"
        in:fade={{ duration: 200 }}
        out:fade={{ delay: 100, duration: 200 }} />
      <div
        class="modal-content"
        in:fly={{ y: -200, duration: 400, delay: 100 }}
        out:fly={{ y: -200, duration: 400, delay: 0 }}>
        <div class="box">
          {#if lastPostDelay}
            <h2 class="subtitle">Confirm IPFS Upload?</h2>
            <p>Are you sure you want to upload this post to the IPFS?</p>
            <p>
              Content uploaded to the IPFS cannot be modified without modifying
              its reference hash.
            </p>
            <p>
              You will be able to modify the content of your post later, but not
              its title and subtitle.
            </p>
            <div class="confirm-buttons">
              <button
                class="button is-danger is-light"
                on:click={() => (savePost = undefined)}>
                Cancel
              </button>
              <button
                class="button is-success is-light"
                on:click={confirmUpload}>
                Confirm
              </button>
            </div>
          {:else}
            <h2 class="subtitle">Upload temporarily unavailable</h2>
            <p>Writing good blog posts takes time.</p>
            <br />
            <p>Please wait 15 minutes between each new blog post.</p>
          {/if}
        </div>
      </div>
      <button
        class="modal-close is-large"
        aria-label="close"
        on:click={() => (savePost = undefined)} />
    </div>
  {/if}
  <!-- MODAL WAITING FOR CONFIRMATION FROM PINATA -->
  <div class="modal" class:is-active={savePost === 'waitingForIPFSHash'}>
    <div class="modal-background" />
    <div class="modal-content">
      <div class="box">
        <article class="media">
          <figure class="media-left">
            <p class="image is-64x64">
              <img src="pinata.png" alt="pinata" />
            </p>
          </figure>
          <div class="media-content">
            <p>
              <strong>Waiting for confirmation from Pinata</strong>
            </p>
            <p>This may take a few seconds, please wait.</p>
          </div>
          <div class="media-right">
            <p class="image is-64x64">
              <Loader
                color="#ffffff"
                size={{ width: '64px', height: '64px' }} />
            </p>
          </div>
        </article>
      </div>
    </div>
  </div>
  <!-- MODAL WAITING FOR CONFIRMATION FROM BLOCKCHAIN -->
  <div class="modal" class:is-active={savePost === 'waitingForBlockchain'}>
    <div class="modal-background" />
    <div class="modal-content">
      <div class="box">
        <article class="media">
          <figure class="media-left">
            <p class="image is-64x64">
              <img src="tezos.svg" alt="tezos-logo" class="image is-64x64" />
            </p>
          </figure>
          <div class="media-content">
            {#if txHash}
              <p>
                <strong>Waiting for confirmation from Tezos blockchain</strong>
              </p>
              <p>This may take a few seconds, please wait.</p>
              <br />
              <p class="is-size-7">IPFS Hash: {IPFSHash}</p>
              {#if txHash}
                <p class="is-size-7">Transaction Hash: {txHash}</p>
              {/if}
            {:else}
              <p>
                <strong>Please approve the transaction to continue.</strong>
              </p>
            {/if}
          </div>
          {#if txHash}
            <div class="media-right">
              <p class="image is-64x64">
                <Loader
                  color="#ffffff"
                  size={{ width: '64px', height: '64px' }} />
              </p>
            </div>
          {/if}
        </article>
      </div>
    </div>
  </div>
  <!-- MODAL CONFIRMATION -->
  <div class="modal" class:is-active={savePost === 'confirmed'}>
    <div class="modal-background" />
    <div class="modal-content">
      <div class="box">
        <article class="media">
          <figure class="media-left">
            <p class="image is-64x64">
              <img
                src="ipfs-tezos.png"
                alt="tezos-ipfs"
                class="image is-64x64" />
            </p>
          </figure>
          <div class="media-content">
            <p>
              <strong>Your post has been successfully uploaded!</strong>
            </p>
            <p>IPFS Hash: {IPFSHash}</p>
            <p>Transaction Hash: {txHash}</p>
          </div>
        </article>
      </div>
    </div>
    <button
      class="modal-close is-large"
      aria-label="close"
      on:click={() => {
        savePost = undefined;
        push(`/post/${$store.bloggerAccount && $store.bloggerAccount.name ? $store.bloggerAccount.name : $store.userAddress}/${urlTitle}`);
      }} />
  </div>
  <!-- MODAL ERROR -->
  <div class="modal" class:is-active={savePost === 'error'}>
    <div class="modal-background" />
    <div class="modal-content">
      <div class="box">
        <article class="media">
          <figure class="media-left">
            <p class="image is-64x64">
              <img src="error.png" alt="error" />
            </p>
          </figure>
          <div class="media-content">
            <p>
              <strong>An error has occured</strong>
            </p>
            <p>Please try again later.</p>
            <p>Error message: {errorMessage || 'No error message provided'}</p>
          </div>
        </article>
      </div>
    </div>
    <button
      class="modal-close is-large"
      aria-label="close"
      on:click={() => (savePost = undefined)} />
  </div>
  <!-- MODAL FOR ICON SELECTION -->
  {#if selectIcon}
    <div class="modal is-active">
      <div
        class="modal-background"
        in:fade={{ duration: 200 }}
        out:fade={{ delay: 100, duration: 200 }} />
      <div
        class="modal-content"
        in:fly={{ y: -200, duration: 400, delay: 100 }}
        out:fly={{ y: -200, duration: 400, delay: 0 }}>
        <div class="box">
          <div class="columns is-multiline">
            {#each availableIcons as icon}
              <div class="column is-one-quarter">
                <img
                  class="image is-48x48 icon-select"
                  src={`icons/${icon}-64.png`}
                  alt={`${icon}-icon`}
                  on:click={() => {
                    selectedIcon = icon;
                    selectIcon = false;
                  }} />
              </div>
            {/each}
          </div>
          <div>
            Icons by
            <a target="_blank" href="https://icons8.com">Icons8</a>
          </div>
        </div>
      </div>
      <button
        class="modal-close is-large"
        aria-label="close"
        on:click={() => (selectIcon = false)} />
    </div>
  {/if}
  <!-- MODAL FOR BANNER SELECTION -->
  {#if selectBanner}
    <div class="modal is-active">
      <div
        class="modal-background"
        in:fade={{ duration: 200 }}
        out:fade={{ delay: 100, duration: 200 }} />
      <div
        class="modal-content"
        in:fly={{ y: -200, duration: 400, delay: 100 }}
        out:fly={{ y: -200, duration: 400, delay: 0 }}>
        <div class="box unsplash-select">
          <h1 class="title">Add a photo from Unsplash</h1>
          <div class="unsplash-select__div">
            Navigate to the link below, find a photo you like, click on "Share"
            and copy-paste the provided link into the text field at the bottom
            of this box.
          </div>
          <div class="unsplash-select__div">
            Please choose a rectangular picture in landscape orientation as it
            will display more nicely in your post :)
          </div>
          <div class="unsplash-select__div">
            <a
              href="https://www.unsplash.com"
              target="_blank"
              rel="noopener noreferrer">
              Open Unsplash
            </a>
          </div>
          <div>
            {#if banner.thumb}
              <div class="unsplash-select__div">
                <img src={banner.thumb} alt="banner thumbnail" />
              </div>
            {/if}
            <div class="field has-addons">
              <div class="control" style="width:100%">
                <input
                  class="input"
                  class:is-danger={errorBannerLink}
                  type="text"
                  placeholder="Copy-paste link from Unsplash"
                  on:input={addBannerLink} />
              </div>
              <div class="control">
                <button
                  class={`button ${!loadingBanner ? 'is-light is-info' : ''}`}
                  class:is-loading={loadingBanner}
                  disabled={!banner.url}
                  on:click={addBanner}>
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <button
        class="modal-close is-large"
        aria-label="close"
        on:click={() => (selectBanner = false)} />
    </div>
  {/if}
  <main>
    <div class="card upload-container">
      <div class="card-content">
        <h1 class="title">Write a new blog post</h1>
        <div class="prepost">
          <div class="columns is-gapless is-vcentered">
            {#if selectedIcon}
              <div class="column is-1">
                <div class="selected-icon image is-32x32">
                  <img
                    src={`icons/${selectedIcon}-64.png`}
                    alt="selected-icon" />
                </div>
              </div>
            {/if}
            <div class={`column ${selectedIcon ? 'is-11' : 'is-12'}`}>
              <input
                class="input is-large"
                type="text"
                placeholder="Write here the title of your post"
                bind:value={title} />
            </div>
          </div>
        </div>
        <div class="prepost">
          <input
            class="input"
            type="text"
            placeholder="Write here the subtitle of your post"
            bind:value={subtitle} />
        </div>
        <div class="columns">
          <div class="column is-half">
            <button
              class="button is-light is-info is-fullwidth"
              on:click={() => (selectIcon = true)}>
              <span class="icon is-small" style="width:1rem;height:1rem;">
                <UserIcon color="#1D72AA" />
              </span>
              <span>Select Icon</span>
            </button>
          </div>
          <div class="column is-half">
            <button
              class="button is-light is-info is-fullwidth"
              disabled={config.DEV_ENV === 'carthage'}
              on:click={() => {
                selectBanner = true;
                banner = {};
                loadingBanner = false;
                errorBannerLink = false;
              }}>
              <span class="icon is-small" style="width:1rem;height:1rem;">
                <ImageIcon color="#1D72AA" />
              </span>
              <span>Add Banner</span>
            </button>
          </div>
        </div>
        <div class="columns is-vcentered reverse-columns">
          <div class="column is-two-thirds">
            <div class="field is-grouped is-grouped-multiline">
              {#each tags as tag}
                <div class="control">
                  <div class="tags has-addons">
                    <span class="tag is-info">{tag}</span>
                    <span
                      class="tag is-delete"
                      style="cursor:pointer"
                      on:click={() => {
                        const newTags = new Set(tags);
                        newTags.delete(tag);
                        tags = [...newTags];
                      }} />
                  </div>
                </div>
              {:else}No tag{/each}
            </div>
          </div>
          <div class="column is-one-third">
            <div class="field has-addons">
              <div class="control">
                <input
                  class="input"
                  class:is-danger={tags.length >= 3}
                  type="text"
                  placeholder={tags.length < 3 ? 'Add a tag' : '3 tags max.'}
                  bind:value={currentTag}
                  disabled={tags.length >= 5} />
              </div>
              <div class="control">
                <button class="button is-light is-info" on:click={addTag}>
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
        <MarkdownEditor
          {title}
          {subtitle}
          {post}
          {banner}
          on:write={writePost} />
        <div class="upload-buttons">
          {#if !!title && !!post}
            <NewPostButton on:upload={() => (savePost = 'uploadConfirm')} />
          {:else}
            <button class="button is-warning is-light" disabled>Upload</button>
          {/if}
        </div>
      </div>
    </div>
  </main>
{:else}
  <section class="hero is-medium is-bold is-fullheight">
    <div class="hero-body">
      <div class="container">
        <h1 class="title">Write a new blog post</h1>
        <h2 class="subtitle">Please connect your wallet to start.</h2>
      </div>
    </div>
  </section>
{/if}
