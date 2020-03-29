<script>
  import store from "../store/store.js";
  import BlogCard from "../components/BlogCard.svelte";
</script>

<style>
  main {
    padding: 80px;
    min-height: 100vh;
    background-color: #f7f8f9;
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
      {#each $store.storage.last_posts as postData}
        <div class="column is-one-third">
          <BlogCard {postData} />
        </div>
      {:else}No post available yet!{/each}
    </div>
  {:else if $store.storage === undefined}
    <div>Loading...</div>
  {:else}
    <div>Welcome!</div>
  {/if}
</main>
