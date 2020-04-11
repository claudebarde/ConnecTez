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

  .landing {
    margin: 0px 0px 30px 0px;
  }

  .illustration {
    text-align: center;
  }

  .illustration__pic {
    max-width: 300px;
  }

  @media only screen and (max-width: 1023px) {
    main {
      padding: 30px;
    }
  }
</style>

<main>
  <div class="card landing">
    <div class="card-content">
      <div class="columns">
        <div class="column is-two-fifth">
          <h1 class="title">Welcome to Tezblog!</h1>
          <h3 class="subtitle">Where the Tezos blockchain meets the IPFS</h3>
          <div class="container">
            TezBlog is a blogging platform that allows you to create and manage
            fully decentralized blog posts that are hosted on the IPFS network
            using the Markdown formatting syntax, to read content posted by
            other users and to receive tips from your readers!
            <br />
            <br />
            The content of the posts is hosted on the IPFS while the IPFS hash
            identifying your unique posts is stored on the Tezos blockchain.
          </div>
        </div>
        <div class="column is-one-fifth is-hidden-touch" />
        <div class="column is-two-fifth illustration">
          <img
            src="undraw_blogging_vpvv.svg"
            alt="blogging-illustration"
            class="illustration__pic" />
        </div>
      </div>
    </div>
  </div>
  {#if $store.storage !== undefined}
    <div class="columns is-multiline">
      {#each $store.storage.last_posts.reverse().slice(0, 30) as ipfsHash}
        <div class="column is-one-third">
          <BlogCard {ipfsHash} />
        </div>
      {:else}
        <h1 class="title is-4 has-text-centered">Not post yet!</h1>
      {/each}
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
