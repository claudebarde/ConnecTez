<script>
  import { afterUpdate } from "svelte";
  import { slide } from "svelte/transition";
  import snarkdown from "snarkdown";
  import moment from "moment";
  import { push } from "svelte-spa-router";
  import store from "../store/store.js";
  import TippingBox from "../components/TippingBox.svelte";
  import Avatar from "../components/Avatar.svelte";
  import Loader from "../components/Loader.svelte";
  import Rating from "../components/Rating.svelte";
  import config from "../config.js";

  export let params;
  let loading = true;
  let post, author, tips;
  let openTipModal = false;

  afterUpdate(async () => {
    if (params.ipfsHash && $store.storage && loading) {
      // checks if the hash exists in the smart contract
      try {
        if (
          $store.storage.last_posts.filter(el => el === params.ipfsHash)
            .length === 0
        ) {
          throw new Error("Unknown IPFS hash");
        }

        const postIPFS = await fetch(
          `https://gateway.pinata.cloud/ipfs/${params.ipfsHash}`
        );
        const pendingPost = await postIPFS.json();
        // checks if post has required properties
        config.postProps.forEach(prop => {
          if (!pendingPost.hasOwnProperty(prop)) {
            throw new Error("missing property");
          }
        });
        post = { ...pendingPost };
        loading = false;
      } catch (error) {
        console.log(error);
        post = "error";
        loading = false;
      }
      if (post && post !== "error") {
        // checks if author registered a name
        try {
          const info = await $store.storage.bloggers.get(post.author);
          if (info.name) {
            author = info.name;
          } else {
            author = store.shortenAddress(post.author);
          }
          tips = info.total_tips.toNumber();
        } catch (error) {
          author = store.shortenAddress(post.author);
          console.log(error);
        }
      }
    } else if (!params.ipfsHash) {
      post = "error";
    }
  });
</script>

<style>
  main {
    padding: 80px 30px;
    min-height: 100vh;
  }

  .post,
  .error {
    width: 50%;
    margin: 0 auto;
  }

  .tip-image-container {
    float: right;
    display: flex;
    flex-direction: column;
    justify-content: center;
    cursor: pointer;
    transition: 0.4s;
  }

  .tezos-hand {
    transition: 0.4s;
  }

  .tip-image-container:hover {
    padding-top: 15px;
  }
  .tip-image-container:hover .tezos-hand {
    margin-top: 0px;
  }

  .tip-image {
    width: 32px;
    margin-top: 15px;
  }

  .author-link {
    cursor: pointer;
  }
  .author-link:hover {
    text-decoration: underline;
  }

  .loading {
    width: 50%;
    margin: 0 auto;
  }

  @media only screen and (max-width: 1023px) {
    main {
      padding: 0px;
      padding-top: 20px;
    }
    .post,
    .error {
      width: 90%;
      margin: 0 auto;
    }

    .loading {
      width: 100%;
      margin: 0;
    }
  }
</style>

<main id="post-content">
  {#if post === undefined}
    <div class="media loading">
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
  {:else if post === 'error'}
    <article class="message is-danger error">
      <div class="message-header">
        <p>Error message</p>
        <button class="delete" aria-label="delete" />
      </div>
      <div class="message-body">
        <p>No blog post is associated to this value!</p>
        <p>The post may have been removed or unpinned.</p>
      </div>
    </article>
  {:else}
    <div class="card post" in:slide={{ duration: 800 }}>
      <div class="card-content">
        {#if openTipModal}
          <TippingBox blogger={post.author} />
        {/if}
        <div class="media">
          <figure class="media-left is-hidden-touch">
            <p
              class="image is-96x96"
              style="border-radius:10px;background-color: white">
              <img
                src={post.icon ? `icons/${post.icon}-64.png` : 'icons/scroll-64.png'}
                alt="icon" />
            </p>
          </figure>
          <div class="media-content">
            <div class="title is-size-2-desktop is-size-3-touch">
              {post.title}
            </div>
            <div class="subtitle is-size-5-desktop is-size-6-touch">
              {#if $store.userAddress !== post.author}
                <div
                  class="tip-image-container"
                  on:click={() => (openTipModal = !openTipModal)}>
                  <img
                    class="tip-image tezos-coin"
                    src="tezos-coin.png"
                    alt="tezos-coin" />
                  <img
                    class="tip-image tezos-hand"
                    src="tezos-hand.png"
                    alt="tezos-hand" />
                </div>
              {/if}
              From
              <span
                on:click={() => push(`#/blogger/${post.author}`)}
                class="author-link">
                {!author ? store.shortenAddress(post.author) : author}
              </span>
              <Avatar seed={post.author} />
              {#if tips}
                <Rating {tips} />
              {/if}
            </div>
            <p class="is-size-7 has-text-left">
              Posted on {moment(post.timestamp).format('MMM Do Y - h:mm A')}
            </p>
          </div>
        </div>
        <br />
        <div class="content">
          {@html snarkdown(post.content)}
        </div>
        <div class="tags">
          {#if !post.tags}
            No tags
          {:else}
            {#each post.tags as tag}
              {#if $store.darkMode}
                <span class="tag is-size-7 is-info">#{tag}</span>
              {:else}
                <span class="tag is-size-7 is-info is-light">#{tag}</span>
              {/if}
            {/each}
          {/if}
        </div>
      </div>
    </div>
  {/if}
</main>
