<script>
  import { onMount } from "svelte";
  import store from "../store/store.js";
  import config from "../config.js";

  onMount(async () => {
    if ($store.trendingTags.length === 0) {
      try {
        const url =
          process.env.NODE_ENV === "development"
            ? "http://localhost:34567/searchTrendingTags"
            : "https://connectez.cc/.netlify/functions/searchTrendingTags";
        const data = await fetch(url, {
          body: JSON.stringify({ network: config.DEV_ENV }),
          method: "POST"
        });
        const results = await data.json();
        results.sort();
        if (results.length > 0) {
          // finds max 4 words with the most occurrences
          const occurrences = {};
          results.forEach(tag => {
            tag = tag.toLowerCase();
            if (occurrences.hasOwnProperty(tag)) {
              occurrences[tag] += 1;
            } else {
              occurrences[tag] = 1;
            }
          });
          const sortedTags = Object.keys(occurrences)
            .sort(function(a, b) {
              return occurrences[b] - occurrences[a];
            })
            .slice(0, 4);
          store.updateTrendingTags(sortedTags);
        } else {
          store.updateTrendingTags(["Tezos is always trending ⚡️"]);
        }
      } catch (error) {
        console.log(error);
      }
    }
  });
</script>

{#if $store.trendingTags.length > 0}
  <div class="field is-grouped">
    {#each $store.trendingTags as tag}
      <div class="control">
        <div class="tags has-addons are-medium">
          <span class="tag">#</span>
          <span class="tag is-info">{tag}</span>
        </div>
      </div>
    {/each}
  </div>
{:else}Loading...{/if}
