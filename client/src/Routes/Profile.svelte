<script>
  import { afterUpdate } from "svelte";
  import moment from "moment";
  import store from "../store/store.js";

  let profile;
  let loading = true;

  afterUpdate(async () => {
    if ($store.storage && loading) {
      try {
        profile = await $store.storage.bloggers.get($store.userAddress);
        loading = false;
      } catch (error) {
        //console.log(error);
      }
    }
  });
</script>

<style>
  main {
    height: 100vh;
    background-color: #f7f8f9;
  }

  .profile-container {
    padding-top: 80px;
    height: 100vh;
    width: 50%;
    margin: 0 auto;
    background-color: #ffffff;
  }

  .profile {
    width: 100%;
  }

  @media only screen and (max-width: 1023px) {
    .profile-container {
      padding-top: 30px;
      width: 90%;
    }
  }
</style>

<main>
  <div class="card profile-container">
    <div class="card-content">
      <h1 class="title is-size-4">Profile</h1>
      {#if profile}
        <table class="table profile">
          <tbody>
            <tr>
              <td>Name</td>
              {#if profile.name !== 'undefined'}
                <td>{profile.name}</td>
              {:else}
                <td>
                  <button class="button is-small is-light is-info">
                    Add your name
                  </button>
                </td>
              {/if}
            </tr>
            <tr>
              <td>Total Tips</td>
              <td>ꜩ {profile.total_tips.toNumber() / 1000000}</td>
            </tr>
            <tr>
              <td>Current tips</td>
              <td>ꜩ {$store.userTips / 1000000}</td>
            </tr>
            <tr>
              <td>Blog posts</td>
              <td>
                {#each profile.posts_list as post}
                  <div class="columns is-mobile">
                    <div class="column is-half">
                      <a href={`/#/post/${post.ipfs_hash}`}>
                        {post.ipfs_hash.slice(0, 10)}...
                      </a>
                    </div>
                    <div class="column is-half">
                      <span class="is-size-7">
                        {moment(Date.parse(post.timestamp)).format('MMM Do Y')}
                      </span>
                    </div>
                  </div>
                {:else}
                  <div>No post yet</div>
                {/each}
              </td>
            </tr>
          </tbody>
        </table>
      {/if}
    </div>
  </div>
</main>
