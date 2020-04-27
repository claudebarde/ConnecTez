<script>
  import store from "../store/store.js";
  import BlogCard from "../components/BlogCard.svelte";
  import Loader from "../components/Loader.svelte";
  import Search from "../components/Search.svelte";
  import TrendingTags from "../components/TrendingTags.svelte";
</script>

<style>
  main {
    padding: 60px;
    overflow: auto;
    width: 80%;
    margin: 0 auto;
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

  .highlights {
    margin: -20px 0px 40px 0px;
  }

  @media only screen and (max-width: 1023px) {
    main {
      padding: 30px;
      width: 100%;
      margin: 0;
    }
  }
</style>

<svelte:head>
  <title>ConnecTez</title>
</svelte:head>
<main>
  <div class="card landing">
    <div class="card-content">
      <div class="columns">
        <div class="column is-half">
          <h1 class="title is-3">Welcome to ConnecTez!</h1>
          <h3 class="subtitle is-spaced">
            Where the Tezos blockchain meets the IPFS
          </h3>
          <div class="container">
            ConnecTez is a blogging platform that allows you to create and
            manage fully decentralized blog posts, to read content posted by
            other users and to receive tips from your readers!
            <br />
            <br />
            The content of the posts is hosted on the IPFS while the IPFS hash
            identifying your unique posts is stored on the Tezos blockchain.
            <br />
            <br />
            All you have to do is connect your wallet, sit back and create your
            blog posts :)
          </div>
        </div>
        <div class="column is-half illustration">
          <img
            src="undraw_blogging_vpvv.svg"
            alt="blogging-illustration"
            class="illustration__pic" />
        </div>
      </div>
    </div>
  </div>
  <div class="box">
    <Search />
  </div>
  {#if $store.storage !== undefined}
    {#if $store.storage.highlights && $store.storage.highlights.length > 0}
      <div class="column is-multiline highlights">
        {#each store.chunkPostsList($store.storage.highlights, 3) as chunk}
          {#if chunk.length === 3}
            <div class="column is-one-third">
              <BlogCard
                maxHeight={200}
                ipfsHash={chunk[0].ipfs_hash}
                type="highlight"
                orientation="portrait" />
            </div>
            <div class="column is-one-third">
              <BlogCard
                maxHeight={200}
                ipfsHash={chunk[1].ipfs_hash}
                type="highlight"
                orientation="portrait" />
            </div>
            <div class="column is-one-third">
              <BlogCard
                maxHeight={200}
                ipfsHash={chunk[2].ipfs_hash}
                type="highlight"
                orientation="portrait" />
            </div>
          {:else if chunk.length === 2}
            <div class="column is-half">
              <BlogCard
                maxHeight={200}
                ipfsHash={chunk[0].ipfs_hash}
                type="highlight"
                orientation="portrait" />
            </div>
            <div class="column is-half">
              <BlogCard
                maxHeight={200}
                ipfsHash={chunk[1].ipfs_hash}
                type="highlight"
                orientation="portrait" />
            </div>
          {:else if chunk.length === 1}
            <div class="column is-full">
              <BlogCard
                maxHeight={200}
                ipfsHash={chunk[0].ipfs_hash}
                type="highlight"
                orientation="landscape" />
            </div>
          {/if}
        {/each}
      </div>
    {/if}
    <div class="box">
      <div class="columns is-vcentered">
        <div class="column is-one-quarter">
          <h2 class="subtitle">Trending Tags:</h2>
        </div>
        <div class="column is-three-quarters">
          <TrendingTags />
        </div>
      </div>
    </div>
    {#each store.chunkPostsList($store.storage.last_posts.slice(0, 30), 4) as chunk, index}
      {#if chunk.length === 4}
        {#if index % 2 === 0}
          <div class="tile is-ancestor">
            <div class="tile is-4 is-vertical">
              <div class="tile is-parent">
                <div class="tile is-child is-hidden-touch" style="display:flex">
                  <BlogCard
                    maxHeight={500}
                    ipfsHash={chunk[0]}
                    type="normal"
                    orientation="portrait" />
                </div>
                <div
                  class="tile is-child is-hidden-desktop"
                  style="display:flex">
                  <BlogCard
                    maxHeight={200}
                    ipfsHash={chunk[0]}
                    type="normal"
                    orientation="portrait" />
                </div>
              </div>
            </div>
            <div class="tile is-8 is-vertical">
              <div class="tile">
                <div class="tile is-parent">
                  <div class="tile is-child" style="display:flex">
                    <BlogCard
                      maxHeight={200}
                      ipfsHash={chunk[1]}
                      type="normal"
                      orientation="portrait" />
                  </div>
                </div>
                <div class="tile is-parent">
                  <div class="tile is-child" style="display:flex">
                    <BlogCard
                      maxHeight={200}
                      ipfsHash={chunk[2]}
                      type="normal"
                      orientation="portrait" />
                  </div>
                </div>
              </div>
              <div class="tile is-parent">
                <div class="tile is-child">
                  <BlogCard
                    maxHeight={100}
                    ipfsHash={chunk[3]}
                    type="normal"
                    orientation="portrait" />
                </div>
              </div>
            </div>
          </div>
        {:else}
          <div class="tile is-ancestor">
            <div class="tile is-8 is-vertical">
              <div class="tile">
                <div class="tile is-parent">
                  <div class="tile is-child" style="display:flex">
                    <BlogCard
                      maxHeight={200}
                      ipfsHash={chunk[1]}
                      type="normal"
                      orientation="portrait" />
                  </div>
                </div>
                <div class="tile is-parent">
                  <div class="tile is-child" style="display:flex">
                    <BlogCard
                      maxHeight={200}
                      ipfsHash={chunk[2]}
                      type="normal"
                      orientation="portrait" />
                  </div>
                </div>
              </div>
              <div class="tile is-parent">
                <div class="tile is-child">
                  <BlogCard
                    maxHeight={200}
                    ipfsHash={chunk[3]}
                    type="normal"
                    orientation="portrait" />
                </div>
              </div>
            </div>
            <div class="tile is-4 is-vertical">
              <div class="tile is-parent">
                <div class="tile is-child" style="display:flex">
                  <BlogCard
                    maxHeight={500}
                    ipfsHash={chunk[0]}
                    type="normal"
                    orientation="portrait" />
                </div>
              </div>
            </div>
          </div>
        {/if}
      {:else if chunk.length === 3}
        <div class="tile is-ancestor">
          <div class="tile is-parent">
            <div class="tile is-child">
              <BlogCard
                maxHeight={200}
                ipfsHash={chunk[0]}
                type="normal"
                orientation="portrait" />
            </div>
          </div>
          <div class="tile is-parent">
            <div class="tile is-child">
              <BlogCard
                maxHeight={200}
                ipfsHash={chunk[1]}
                type="normal"
                orientation="portrait" />
            </div>
          </div>
          <div class="tile is-parent">
            <div class="tile is-child">
              <BlogCard
                maxHeight={200}
                ipfsHash={chunk[2]}
                type="normal"
                orientation="portrait" />
            </div>
          </div>
        </div>
      {:else if chunk.length === 2}
        <div class="tile is-ancestor">
          <div class="tile is-parent">
            <div class="tile is-child">
              <BlogCard
                maxHeight={200}
                ipfsHash={chunk[0]}
                type="normal"
                orientation="portrait" />
            </div>
          </div>
          <div class="tile is-parent">
            <div class="tile is-child">
              <BlogCard
                maxHeight={200}
                ipfsHash={chunk[1]}
                type="normal"
                orientation="portrait" />
            </div>
          </div>
        </div>
      {:else}
        <div class="tile is-ancestor">
          <div class="tile is-parent">
            <div class="tile is-child">
              <BlogCard
                maxHeight={100}
                ipfsHash={chunk[0]}
                type="normal"
                orientation="landscape" />
            </div>
          </div>
        </div>
      {/if}
    {:else}
      <h1 class="title is-4 has-text-centered">Not post yet!</h1>
    {/each}
  {:else if $store.storage === undefined}
    <div class="media" style="margin-top:20px;">
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
