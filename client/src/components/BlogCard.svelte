<script>
  import { onMount, afterUpdate } from "svelte";
  import { fly } from "svelte/transition";
  import { Remarkable } from "remarkable";
  import moment from "moment";
  import { push } from "svelte-spa-router";
  import store from "../store/store.js";
  import config from "../config.js";

  export let ipfsHash, maxHeight, type, orientation;

  let md = undefined;
  let post, author, error;
  let updated = false;

  onMount(async () => {
    md = new Remarkable();
    try {
      const postIPFS = await fetch(
        `https://gateway.pinata.cloud/ipfs/${ipfsHash}`
      );
      const pendingPost = await postIPFS.json();
      // checks if post has required properties
      config.postProps.forEach(prop => {
        if (!pendingPost.hasOwnProperty(prop)) {
          throw new Error("missing property");
        }
      });
      post = { ...pendingPost };
    } catch (error) {
      console.log(error);
      error = true;
    }
  });

  afterUpdate(async () => {
    // checks if blogger registered his/her name
    if ($store.storage && post && !updated) {
      // fetches blogger's name
      try {
        const info = await $store.storage.bloggers.get(post.author);
        if (info.name) {
          author = info.name;
        } else {
          author = store.shortenAddress(post.author);
        }
        updated = true;
      } catch (error) {
        author = store.shortenAddress(post.author);
        console.log(error);
      }
    }
  });
</script>

<style>
  .post-overview {
    overflow: hidden;
    position: relative;
    width: 100%;
    margin-bottom: 60px;
  }

  .text-fading {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    text-align: center;
    margin: 0;
    background-image: linear-gradient(to bottom, transparent, white);
  }

  .date {
    padding-top: 20px;
  }

  .tags-list {
    padding-top: 10px;
  }

  .highlight {
    border: none;
    border-left: solid 6px white;
    border-image: linear-gradient(#dd6b20, #fbd38d) 0 100%;
  }

  .tags-date {
    position: absolute;
    bottom: 10px;
  }
</style>

{#if post}
  {#if orientation === 'landscape'}
    <div class="columns is-gapless is-vcentered">
      {#if post.banner && post.banner.hasOwnProperty('url')}
        <div class="column is-5">
          <figure class="image is-5by4">
            <img src={`${post.banner.url}/download`} alt="banner" />
          </figure>
        </div>
      {/if}
      <div class={`column ${post.banner ? 'is-7' : 'is-12'}`}>
        <div class="card" style="width:100%">
          <div class="card-content" style="height:100%;position:relative">
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
                <p class="subtitle is-6">
                  {!author ? 'loading...' : 'From ' + author}
                </p>
              </div>
            </div>
            <div class="content">
              <div class="post-overview" style={`height:${maxHeight}px`}>
                <div>
                  {@html md.render(post.content || 'Unavailable')}
                </div>
                <div
                  class="text-fading"
                  style={`padding:${maxHeight / 2}px 0px`} />
              </div>
              <div class="tags-date">
                <div class="tags-list is-size-7 has-text-grey-light">
                  {#each post.tags as tag}#{tag.toLowerCase()}&nbsp;{/each}
                </div>
                <div class="date is-size-7">
                  {moment(post.timestamp).format('MMM Do Y - h:mm A')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  {:else if orientation === 'portrait'}
    <div
      class="card"
      class:highlight={type === 'highlight'}
      in:fly={{ y: 300, delay: 200, duration: Math.random() * (1000 - 500) + 500 }}
      style="width:100%">
      {#if post.banner && post.banner.hasOwnProperty('url')}
        <div class="card-image">
          <figure class="image is-5by4">
            <img src={`${post.banner.url}/download`} alt="banner" />
          </figure>
        </div>
      {/if}
      <div class="card-content" style="height:100%;position:relative">
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
            <p class="subtitle is-6">
              {!author ? 'loading...' : 'From ' + author}
            </p>
          </div>
        </div>
        <div class="content">
          <div class="post-overview" style={`height:${maxHeight}px`}>
            <div>
              {@html md.render(post.content || 'Unavailable')}
            </div>
            <div class="text-fading" style={`padding:${maxHeight / 2}px 0px`} />
          </div>
          <div class="tags-date">
            <div class="tags-list is-size-7 has-text-grey-light">
              {#each post.tags as tag}#{tag.toLowerCase()}&nbsp;{/each}
            </div>
            <div class="date is-size-7">
              {moment(post.timestamp).format('MMM Do Y - h:mm A')}
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
{:else}
  {#if error}
    <div class="notification is-danger">
      This content is unavailable at the moment.
      <br />
      Please try again later.
    </div>
  {/if}
{/if}
