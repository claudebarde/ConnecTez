<script>
  import { slide } from "svelte/transition";
  import store from "../store/store.js";
  import config from "../config.js";

  let resultsReturned = false;
  let searchResults = [];
  let input = "";
  let searchForUsername = false;
  let inputError = false;
  let inputErrorMessage = "";

  const searchIPFShashes = async (type, value) => {
    if (type === "username") {
      searchForUsername = true;
    } else {
      searchForUsername = false;
    }

    try {
      const url =
        process.env.NODE_ENV === "development"
          ? "http://localhost:34567/searchPosts"
          : "https://connectez.cc/.netlify/functions/searchPosts";
      const data = await fetch(url, {
        body: JSON.stringify({ input, type, value, network: config.DEV_ENV }),
        method: "POST"
      });
      const results = await data.json();
      if (results.error) throw new Error(results.error.message);

      if (results.count && results.count > 0) {
        searchResults = [...results.rows];
        resultsReturned = true;
      } else {
        resultsReturned = false;
        searchResults = [];
      }
    } catch (error) {
      console.log(error);
      resultsReturned = false;
      inputError = true;
      inputErrorMessage = error;
      searchResults = [];
    }
  };

  const processInput = event => {
    input = event.target.value;
    inputError = false;
    inputErrorMessage = "";
    resultsReturned = false;
    if (input.slice(0, 2) === "tz" && input.length > 3) {
      input = input.replace(/\s+/g, "");
      // user is looking for a blogger
      searchIPFShashes("address");
      searchForUsername = undefined;
    } else if (input.slice(0, 2) === "Qm" && input.length > 3) {
      // user is looking for an IPFS hash
      input = input.replace(/\s+/g, "");
      searchIPFShashes("ipfsHash");
      searchForUsername = undefined;
    } else if (input[0] === "#" && input.length > 2) {
      // user is looking for tags
      input = input.toLowerCase();
      if (input.split("").filter(char => char === "#").length <= 2) {
        searchIPFShashes("tags");
      } else {
        inputError = true;
        inputErrorMessage = "Maximum 2 tags per search";
      }
    } else if (input.length > 3) {
      // user is looking for username
      resultsReturned = false;
      // checks if the user is looking for a username and turns it into an address
      const regexp = new RegExp(input, "i");
      let name = undefined;
      name = $store.storage.bloggers_reserved_names.filter(name =>
        name.match(regexp)
      )[0];
      if (name) {
        searchIPFShashes("username", name);
        searchForUsername = name;
      } else {
        searchForUsername = undefined;
      }
    } else {
      resultsReturned = false;
      searchResults = [];
    }
  };
</script>

<style>
  .dropdown-input,
  .dropdown-input-trigger {
    width: 100%;
  }

  .dropdown-input-menu {
    margin-left: 50px;
  }
</style>

<p
  class="is-size-7 has-text-right"
  class:has-text-danger={inputError}
  style="padding-bottom:4px">
  {inputErrorMessage}
</p>
<div class="dropdown dropdown-input" class:is-active={!!resultsReturned}>
  <div class="dropdown-trigger dropdown-input-trigger">
    <div class="field">
      <p class="control has-icons-left has-icons-right">
        <input
          class="input is-large"
          class:is-danger={inputError}
          type="text"
          placeholder="Search blog posts by #tags, author, address or IPFS hash"
          on:input={processInput}
          on:focus={processInput}
          on:blur={() => setTimeout(() => (resultsReturned = false), 500)}
          value={input} />
        <span class="icon is-small is-left">
          <img src="menu-icons/search.svg" alt="search" style="opacity:0.4" />
        </span>
      </p>
    </div>
  </div>
  {#if resultsReturned}
    <div
      class="dropdown-menu dropdown-input-menu"
      role="menu"
      transition:slide={{ duration: 300 }}>
      <div class="dropdown-content">
        {#if !!searchForUsername}
          <div
            class="dropdown-item has-text-weight-semibold is-uppercase
            has-text-grey">
            {searchForUsername}
          </div>
          <hr class="dropdown-divider" />
        {/if}
        {#each searchResults as result}
          <a href={`#/post/${result}`} class="dropdown-item">{result}</a>
        {/each}
      </div>
    </div>
  {/if}
</div>
