<script>
  import { onMount } from "svelte";
  import { fly } from "svelte/transition";
  import snarkdown from "snarkdown";
  import moment from "moment";
  import { push } from "svelte-spa-router";
  import store from "../store/store.js";

  export let ipfsHash;

  let post, author;

  onMount(async () => {
    const postIPFS = await fetch(
      `https://gateway.pinata.cloud/ipfs/${ipfsHash}`
    );
    post = await postIPFS.json();
    // checks if blogger registered his/her name
    if ($store.storage && $store.userAddress) {
      try {
        const info = await $store.storage.bloggers.get($store.userAddress);
        if (info.name) {
          author = info.name;
        } else {
          author = store.shortenAddress(post.author);
        }
      } catch (error) {
        console.log(error);
      }
    }
  });
</script>

<style>
  .post-overview {
    max-height: 100px;
    overflow: hidden;
  }

  .date {
    padding-top: 20px;
  }
</style>

{#if post}
  <div class="card" in:fly={{ y: 300, delay: 200, duration: 400 }}>
    <div class="card-content">
      <div class="media">
        <figure class="media-left">
          <p class="image is-64x64">
            <img
              src={post.icon ? `icons/${post.icon}-64.png` : 'icons/scroll-64.png'}
              alt="icon" />
          </p>
        </figure>
        <div
          class="media-content"
          on:click={() => push(`/post/${ipfsHash}`)}
          style="cursor:pointer">
          <p class="title is-5">{post.title}</p>
          <p class="subtitle is-6">From {author}</p>
        </div>
      </div>

      <div class="content">
        <div class="post-overview">
          {@html snarkdown(post.content || 'Unavailable')}
        </div>
        <div class="date is-size-7">
          {moment(post.timestamp).format('MMM Do Y - h:mm A')}
        </div>
      </div>
    </div>
  </div>
{:else}
  <div class="card">
    <div class="card-content">
      <div class="content">
        <p>Fetching data from the IPFS...</p>
      </div>
    </div>
  </div>
{/if}
