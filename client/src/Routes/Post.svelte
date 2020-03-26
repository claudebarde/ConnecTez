<script>
  import { onMount } from "svelte";
  import { slide } from "svelte/transition";
  import snarkdown from "snarkdown";
  import moment from "moment";
  import store from "../store/store.js";

  export let params;
  let post;
  let openTipModal = false;

  onMount(async () => {
    if (params.ipfsHash) {
      try {
        const postIPFS = await fetch(
          `https://gateway.pinata.cloud/ipfs/${params.ipfsHash}`
        );
        post = await postIPFS.json();
      } catch (error) {
        console.log(error);
        post = "error";
      }
    } else {
      post = "error";
    }
  });
</script>

<style>
  main {
    padding: 80px 30px;
    background-color: #f7f8f9;
    height: 100vh;
  }

  .post,
  .error {
    width: 50%;
    margin: 0 auto;
  }
</style>

<main>
  {#if post === undefined}
    Loading...
  {:else if post === 'error'}
    <article class="message is-danger error">
      <div class="message-header">
        <p>Error message</p>
        <button class="delete" aria-label="delete" />
      </div>
      <div class="message-body">No blog post is associated to this value!</div>
    </article>
  {:else}
    <div class="card post" in:slide={{ duration: 800 }}>
      <div class="card-content">
        {#if openTipModal}
          <article class="message is-info" transition:slide={{ duration: 400 }}>
            <div class="message-body">
              <div>How much would you like to tip?</div>
              <br />
              <div class="tags">
                <span class="tag is-info">XTZ 0.1</span>
                <span class="tag is-info">XTZ 0.2</span>
                <span class="tag is-info">XTZ 0.5</span>
                <span class="tag is-info">XTZ 0.8</span>
                <span class="tag is-info">XTZ 1</span>
                <span class="tag is-info">XTZ 2</span>
              </div>
            </div>
          </article>
        {/if}
        <div class="media">
          <figure class="media-left">
            <p class="image is-96x96">
              <img
                src={post.icon ? `icons/${post.icon}-64.png` : 'icons/scroll-64.png'}
                alt="icon" />
            </p>
          </figure>
          <div class="media-content">
            <p class="title is-2">{post.title}</p>
            <p class="subtitle is-5">
              From {store.shortenAddress(post.author)}
            </p>
          </div>
          <div class="media-right">
            <img
              src="tezos-coin-in-hand-100.png"
              alt="tip-icon"
              class="image is-32x32"
              style="cursor:pointer"
              on:click={() => (openTipModal = !openTipModal)} />
          </div>
        </div>
        <br />
        <div class="content">
          {@html snarkdown(post.content)}
        </div>
        <div class="is-size-7 has-text-right">
          Posted on {moment(post.timestamp).format('MMM Do Y - h:mm A')}
        </div>
      </div>
    </div>
  {/if}
</main>
