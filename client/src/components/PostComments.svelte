<script>
  import { onMount } from "svelte";
  import { fade, fly } from "svelte/transition";
  import moment from "moment";
  import store from "../store/store.js";
  import config from "../config.js";
  import Avatar from "./Avatar.svelte";

  export let id;

  let comment = "";
  let comments = [];
  let loadingComments = true;
  let charCount = 0;
  let charCountExceeded = false;
  let submitComment = false;
  let pinningComments = false;

  const countChars = event => {
    const text = event.target.value;
    charCount = text.length;
    if (text.length <= 445) {
      charCountExceeded = false;
      comment = text;
    } else {
      charCountExceeded = true;
    }
  };

  const confirmComment = async () => {
    submitComment = false;
    pinningComments = true;
    const PINCOMMENT =
      process.env.NODE_ENV === "development"
        ? "http://localhost:34567/pinComment"
        : "https://connectez.cc/.netlify/functions/pinComment";
    try {
      const data = await fetch(PINCOMMENT, {
        body: JSON.stringify({
          id,
          comment,
          author: $store.userAddress,
          network: config.DEV_ENV
        }),
        method: "POST"
      });
      const response = await data.json();
      if (response.error) {
        console.log("Error:", response);
      } else if (response.IpfsHash) {
        // comment was added
        comments = [
          {
            postID: id,
            author: $store.userAddress,
            comment,
            timestamp: Date.now()
          },
          ...comments
        ];
        comment = "";
        pinningComments = false;
      }
    } catch (error) {
      console.log("Error:", error);
    }
  };

  onMount(async () => {
    const FETCHCOMMENTS =
      process.env.NODE_ENV === "development"
        ? "http://localhost:34567/fetchComments"
        : "https://connectez.cc/.netlify/functions/fetchComments";
    try {
      const data = await fetch(FETCHCOMMENTS, {
        body: JSON.stringify({
          id,
          network: config.DEV_ENV
        }),
        method: "POST"
      });
      const response = await data.json();
      if (response.length > 0) {
        comments = [...response];
      }
      loadingComments = false;
    } catch (error) {
      console.log("Error:", error);
      loadingComments = false;
    }
  });
</script>

<style>
  .comment-confirm p {
    padding-bottom: 10px;
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
</style>

{#if submitComment}
  <div class="modal is-active">
    <div
      class="modal-background"
      in:fade={{ duration: 200 }}
      out:fade={{ delay: 100, duration: 200 }} />
    <div
      class="modal-content"
      in:fly={{ y: -200, duration: 400, delay: 100 }}
      out:fly={{ y: -200, duration: 400, delay: 0 }}>
      <div class="box comment-confirm">
        <h2 class="subtitle">Confirm Comment Upload?</h2>
        <p>Are you sure you want to upload this comment to the IPFS?</p>
        <p>
          Comments cannot be modified once they are uploaded. Your comment will
          be stored in the IPFS with the other comments attached to this post.
        </p>
        <p>
          Your comment will not be saved in the blockchain, this doesn't create
          any fee!
        </p>
        <div class="confirm-buttons">
          <button
            class="button is-danger is-light"
            on:click={() => (submitComment = false)}>
            Cancel
          </button>
          <button class="button is-success is-light" on:click={confirmComment}>
            Confirm
          </button>
        </div>
      </div>
    </div>
    <button
      class="modal-close is-large"
      aria-label="close"
      on:click={() => (submitComment = false)} />
  </div>
{/if}
{#if comments.length > 0}
  <h3 class="subtitle">Comments</h3>
{/if}
{#each comments as comment, index (comment.timestamp)}
  <article class="media">
    <figure class="media-left">
      <p class="image is-64x64">
        <Avatar seed={comment.author} />
      </p>
    </figure>
    <div class="media-content">
      <div class="field">
        <div class="control">{comment.comment}</div>
      </div>
      <nav class="level">
        <div class="level-left">
          <div class="level-item is-size-7 is-italic">
            From {store.shortenAddress(comment.author)}
          </div>
        </div>
        <div class="level-right">
          <div class="level-item is-size-7">
            {moment(comment.timestamp).fromNow()}
          </div>
        </div>
      </nav>
    </div>
  </article>
{:else}
  {#if loadingComments}
    <p style="padding:20px 0px">Loading comments...</p>
  {:else}
    <p style="padding:20px 0px">No comment yet!</p>
  {/if}
{/each}
<h3 class="subtitle">Leave a comment</h3>
{#if $store.userAddress}
  <article class="media">
    <figure class="media-left">
      <p class="image is-64x64">
        <Avatar seed={$store.userAddress} />
      </p>
    </figure>
    <div class="media-content">
      <div class="field">
        <p class="control">
          <textarea
            class="textarea"
            class:is-danger={charCountExceeded}
            class:has-background-light={$store.darkMode}
            placeholder="Leave a comment..."
            on:input={countChars}
            value={comment} />
        </p>
      </div>
      <nav class="level">
        <div class="level-left">
          <div
            class="level-item is-size-7 is-italic"
            class:has-text-danger={charCountExceeded}>
            {charCount}/445 character{charCount < 2 ? '' : 's'}
          </div>
        </div>
        <div class="level-right">
          <div class="level-item">
            <button
              class="button is-info is-small"
              class:is-light={!$store.darkMode}
              class:is-loading={pinningComments}
              disabled={charCountExceeded}
              on:click={() => (submitComment = true)}>
              Submit
            </button>
          </div>
        </div>
      </nav>
    </div>
  </article>
{:else}
  <div>
    You must identify yourself by connecting your wallet to leave a comment.
  </div>
{/if}
