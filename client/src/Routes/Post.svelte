<script>
  import { onMount, afterUpdate } from "svelte";
  import { slide, fade, fly } from "svelte/transition";
  import { Remarkable } from "remarkable";
  import { validateAddress } from "@taquito/utils";
  import moment from "moment";
  import { push } from "svelte-spa-router";
  import store from "../store/store.js";
  import TippingBox from "../components/TippingBox.svelte";
  import Avatar from "../components/Avatar.svelte";
  import Loader from "../components/Loader.svelte";
  import Rating from "../components/Rating.svelte";
  import PromotePost from "../components/PromotePost.svelte";
  import PostComments from "../components/PostComments.svelte";
  import config from "../config.js";

  export let params;
  let loading = true;
  let md = undefined;
  let post, author, tips, bloggersAccount;
  let openTipModal = false;
  let bannerLoading = true;

  onMount(() => {
    md = new Remarkable();
    window.scrollTo(0, 0);
  });

  afterUpdate(async () => {
    if (params.blogger && params.title && $store.storage && loading) {
      let address = params.blogger;
      // checks if the hash exists in the smart contract
      let postInfo, bloggersAccountStorage;
      try {
        // fetches blogger's address if name is provided
        if (validateAddress(address) !== 3) {
          address = await $store.storage.bloggersNameToAddress.get(
            params.blogger
          );
        }
        if (address === $store.userAddress && $store.bloggerAccount) {
          // if request comes from blogger who wrote the post
          postInfo = await $store.bloggerAccount.posts.get(params.title);
        } else {
          // if request comes from an other user
          // fetches blogger's account address
          const blogger = await $store.storage.bloggers.get(address);
          // gets blogger's posts
          bloggersAccount = await $store.TezosProvider.wallet.at(
            blogger.account
          );
          bloggersAccountStorage = await bloggersAccount.storage();
          // saves total tips
          tips = bloggersAccountStorage.tips.toNumber();
          // fetches IPFS hash
          postInfo = await bloggersAccountStorage.posts.get(params.title);
        }

        const postIPFS = await fetch(
          `https://gateway.pinata.cloud/ipfs/${postInfo.ipfs_hash}`
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
        } catch (error) {
          author = store.shortenAddress(post.author);
          console.log(error);
        }
      }
    } else if (!params.blogger && !params.title) {
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
    float: left;
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
    font-weight: bold;
  }
  .author-link:hover {
    text-decoration: underline;
  }

  .loading {
    width: 50%;
    margin: 0 auto;
  }

  .banner {
    width: 100%;
    margin: 0;
    padding: 0;
    position: relative;
  }

  .banner-attribution {
    position: absolute;
    bottom: 10px;
    right: 10px;
  }

  .banner-attribution a {
    color: white;
    text-decoration: none;
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

<svelte:head>
  <title>{post ? `${post.title || 'Post'} - ConnecTez` : 'ConnecTez'}</title>
</svelte:head>
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
          <strong>Loading post from the IPFS...</strong>
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
        <div>
          <h1 class="title is-2">{post.title}</h1>
          {#if !!post.subtitle}
            <h3
              class={`subtitle is-4 is-italic ${$store.darkMode ? 'has-text-white-ter' : 'has-text-grey'}`}>
              {post.subtitle}
            </h3>
          {/if}
          {#if post.banner && post.banner.hasOwnProperty('url')}
            <div class="banner">
              {#if bannerLoading}
                <div class="banner-loading">
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                </div>
              {/if}
              <img
                src={`${post.banner.url}/download`}
                class:slide-in-fwd-center={!bannerLoading}
                style={bannerLoading ? 'display:none' : ''}
                alt="banner"
                on:load={() => (bannerLoading = false)} />
              <div class="banner-attribution">
                <a
                  href={post.banner.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="is-size-7">
                  Picture from Unsplash by {post.banner.author}
                </a>
              </div>
            </div>
          {/if}
          <div class="columns is-mobile is-vcentered" style="margin-top:10px">
            <div class="column is-2">
              <Avatar seed={post.author} />
            </div>
            <div class="column is-8">
              <p>
                Posted by
                <span
                  on:click={() => push(`#/blogger/${author}`)}
                  class="author-link is-bold">
                  {!author ? store.shortenAddress(post.author) : author}
                </span>
              </p>
              <p>On {moment(post.timestamp).format('MMM Do Y - h:mm A')}</p>
            </div>
            <div class="column is-2">
              {#if $store.userAddress && $store.userAddress !== post.author}
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
            </div>
          </div>
          {#if $store.userAddress && openTipModal}
            <TippingBox
              blogger={post.author}
              {bloggersAccount}
              on:closeModal={e => (openTipModal = false)} />
          {/if}
        </div>
        <div class="columns">
          <div class="column is-half is-offset-half has-text-right">
            <PromotePost author={post.author} title={params.title} />
          </div>
        </div>
        <div class="content">
          {@html md.render(post.content)}
        </div>
        <div class="tags">
          {#if !post.tags}
            No tags
          {:else}
            {#each post.tags as tag}
              {#if $store.darkMode}
                <span class="tag is-size-7 is-info is-lowercase">#{tag}</span>
              {:else}
                <span class="tag is-size-7 is-info is-light is-lowercase">
                  #{tag}
                </span>
              {/if}
            {/each}
          {/if}
        </div>
        <hr />
        <PostComments id={post.id} />
      </div>
    </div>
  {/if}
</main>
