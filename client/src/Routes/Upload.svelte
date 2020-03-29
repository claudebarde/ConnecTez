<script>
  import { onMount } from "svelte";
  import { fade, fly } from "svelte/transition";
  import snarkdown from "snarkdown";
  import { push } from "svelte-spa-router";
  import store from "../store/store";
  import Loader from "../components/Loader.svelte";

  let preview = false;
  let title = "";
  let post = "";
  let IPFSHash = undefined;
  let txHash = undefined;
  let errorMessage = undefined;
  let savePost = undefined; // "uploadConfirm" | "waitingForIPFSHash" | "waitingForBlockchain" | "confirmed" | "error"
  let selectIcon = false;
  let selectedIcon = undefined;
  let contentIsTooBig = false;
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

  const byteLength = str => {
    // returns the byte length of an utf8 string
    var s = str.length;
    for (let i = str.length - 1; i >= 0; i--) {
      const code = str.charCodeAt(i);
      if (code > 0x7f && code <= 0x7ff) s++;
      else if (code > 0x7ff && code <= 0xffff) s += 2;
      if (code >= 0xdc00 && code <= 0xdfff) i--; //trail surrogate
    }
    if (s / 1024 < 1) {
      return s + " B";
    } else {
      if (Math.round(s / 1024) >= 10) {
        contentIsTooBig = true;
      } else {
        contentIsTooBig = false;
      }

      return Math.round(s / 1024) + " kB";
    }
  };

  const writePost = event => {
    post = event.target.value;
  };

  const addTag = () => {
    const tag = currentTag.trim().replace(/ +/g, "-");
    if (tag.length > 0 && tags.length < 3) {
      const newTags = new Set(tags);
      newTags.add(tag);
      tags = [...newTags];
      currentTag = "";
    }
  };

  const confirmUpload = async () => {
    const PINJSON =
      process.env.NODE_ENV === "development"
        ? "http://localhost:34567/pinJSON"
        : "https://tezos-ipfs-blog.netlify.com/.netlify/functions/pinJSON";
    try {
      // checks if title and post is provided
      if (!!title.trim() && !!post.trim()) {
        savePost = "waitingForIPFSHash";
        const data = await fetch(PINJSON, {
          body: JSON.stringify({
            title,
            content: post,
            author: $store.userAddress,
            icon: selectedIcon || "scroll",
            tags
          }),
          method: "POST"
        });
        const response = await data.json();
        // checks if IPFS hash is received
        if (response.IpfsHash) {
          IPFSHash = response.IpfsHash;
          savePost = "waitingForBlockchain";
          // saves IPFS hash onto the blockchain
          const op = await $store.contractInstance.methods
            .post(IPFSHash)
            .send();
          txHash = op.hash;
          await op.confirmation(1);
          savePost = "confirmed";
        } else {
          throw new Error("No IPFS hash received");
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
      // if transaction was rejected
      if (error === "rejected") {
        const UNPINJSON =
          process.env.NODE_ENV === "development"
            ? "http://localhost:34567/unpinJSON"
            : "https://tezos-ipfs-blog.netlify.com/.netlify/functions/unpinJSON";
        const response = await fetch(UNPINJSON, {
          body: JSON.stringify({ hash: IPFSHash }),
          method: "POST"
        });
        console.log(response);
      }
    }
  };
</script>

<style>
  main {
    background-color: #f7f8f9;
    min-height: 100%;
  }

  .upload-container {
    padding-top: 80px;
    height: 100vh;
    width: 50%;
    margin: 0 auto;
    background-color: #ffffff;
  }

  .upload-buttons {
    margin: 10px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }

  .upload-textarea {
    height: 400px;
  }

  .upload-markdown {
    height: 400px;
    overflow: auto;
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

  @media only screen and (max-width: 1023px) {
    .upload-container {
      padding-top: 30px;
      width: 90%;
      height: auto;
      min-height: 100%;
    }
  }
</style>

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
          <h2 class="subtitle">Confirm IPFS Upload?</h2>
          <p>Are you sure you want to upload this post to the IPFS?</p>
          <p>
            Content uploaded to the IPFS cannot be modified without modifying
            its reference hash.
          </p>
          <div class="confirm-buttons">
            <button
              class="button is-danger is-light"
              on:click={() => (savePost = undefined)}>
              Cancel
            </button>
            <button class="button is-success is-light" on:click={confirmUpload}>
              Confirm
            </button>
          </div>
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
        push(`/post/${IPFSHash}`);
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
  <main>
    <div class="card upload-container">
      <div class="card-content">
        <h1 class="title">Write a new blog post</h1>
        <div class="field has-addons">
          <div class="control" style="width: 100%">
            <input
              class="input"
              type="text"
              placeholder="Post title"
              bind:value={title} />
          </div>
          <div class="control">
            <button
              class="button is-light is-info"
              on:click={() => (selectIcon = true)}>
              Select Icon
            </button>
          </div>
        </div>
        <div class="columns is-vcentered is-mobile">
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
          <div class="column">
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
        {#if selectedIcon}
          <p class="is-size-7" style="padding:10px 0px">
            Selected icon: "{selectedIcon}"
          </p>
        {/if}
        <p class="is-size-7" style="padding:10px 0px">
          Use Markdown to style your post
        </p>
        {#if preview}
          <div class="upload-markdown has-text-left content">
            {@html snarkdown(post)}
          </div>
        {:else}
          <textarea
            class="textarea upload-textarea"
            class:is-danger={contentIsTooBig}
            placeholder="Write your post here"
            bind:value={post}
            on:input={writePost} />
          <div
            class="has-text-right is-size-7"
            class:has-text-danger={contentIsTooBig}
            style="padding:5px">
            {byteLength(post)}
          </div>
        {/if}
        <div class="upload-buttons">
          <button class="button is-light" on:click={() => (preview = !preview)}>
            {#if preview}Edit{:else}Preview{/if}
          </button>
          {#if !!title && !!post}
            <button
              class="button is-link is-light"
              on:click={() => (savePost = 'uploadConfirm')}>
              Upload
            </button>
          {:else}
            <button class="button is-warning is-light" disabled>Upload</button>
          {/if}
        </div>
      </div>
    </div>
  </main>
{:else}
  <section class="hero is-medium is-light is-bold is-fullheight-with-navbar">
    <div class="hero-body">
      <div class="container">
        <h1 class="title">Write a new blog post</h1>
        <h2 class="subtitle">Please connect your wallet to start.</h2>
      </div>
    </div>
  </section>
{/if}
