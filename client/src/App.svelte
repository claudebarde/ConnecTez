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

  let previousRoute = undefined;

  const routeLoaded = event => {
    console.log("previousRoute");
    if (previousRoute === "Post") {
      store.toggleDarkMode("off");
    }
    previousRoute = event.detail.name;
  };
</script>

<Navbar />
<Router {routes} on:routeLoaded={routeLoaded} />
