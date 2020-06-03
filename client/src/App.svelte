<script>
  import Router from "svelte-spa-router";
  import Home from "./Routes/Home.svelte";
  import Post from "./Routes/Post.svelte";
  import Upload from "./Routes/Upload.svelte";
  import Profile from "./Routes/Profile.svelte";
  import Blogger from "./Routes/Blogger.svelte";
  import NotFound from "./Routes/NotFound.svelte";
  import Navbar from "./components/Navbar/Navbar.svelte";
  import store from "./store/store.js";

  const routes = {
    "/": Home,
    "/post/:ipfsHash": Post,
    "/upload": Upload,
    "/profile": Profile,
    "/blogger/:address": Blogger,
    "*": NotFound
  };

  let previousLocation = undefined;

  const routeLoaded = event => {
    if (previousLocation && previousLocation.includes("/post/")) {
      store.toggleDarkMode("off");
    }
    previousLocation = event.detail.location;
  };
</script>

<style>
  .ui {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  .ui-main {
    flex: 1 0 auto;
  }

  footer {
    flex-shrink: 0;
    padding: 10px 0px;
  }
</style>

<Navbar />
<div class="ui">
  <div class="ui-main">
    <Router {routes} on:routeLoaded={routeLoaded} />
  </div>
  <footer class="is-size-7 has-text-centered">
    <p>🌮 All rights reserved 2020, Claude Barde 🌮</p>
    <p>
      The identicons are provided by
      <a href="https://tzkt.io" target="_blank" rel="noopener noreferrer">
        Baking Bad
      </a>
    </p>
  </footer>
</div>
