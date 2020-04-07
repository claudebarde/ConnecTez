<script>
  import store from "../store/store.js";
  import BlogCard from "../components/BlogCard.svelte";
  import Loader from "../components/Loader.svelte";
</script>

<style>
  main {
    padding: 60px;
    overflow: auto;
  }

  @media only screen and (max-width: 1023px) {
    main {
      padding: 30px;
    }
  }
</style>

<main>
  {#if $store.storage !== undefined}
    <div class="columns is-multiline">
      {#each $store.storage.last_posts.slice(0, 30) as ipfsHash}
        <div class="column is-one-third">
          <BlogCard {ipfsHash} />
        </div>
      {:else}No post available yet!{/each}
    </div>
  {:else if $store.storage === undefined}
    <div class="media">
      <div class="media-left">
        <p class="image is-64x64">
          <Loader color="#f7fafc" size={{ width: '64px', height: '64px' }} />
        </p>
      </div>
      <div class="media-content">
        <p>
          <strong>Loading posts from the IPFS...</strong>
        </p>
        <p>
          Loading content from the IPFS can take a few seconds, please wait.
        </p>
      </div>
    </div>
  {:else}
    <div>Welcome!</div>
  {/if}
</main>
