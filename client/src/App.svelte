<script>
  import Router from "svelte-spa-router";
  import Home from "./Routes/Home.svelte";
  import Post from "./Routes/Post.svelte";
  import Upload from "./Routes/Upload.svelte";
  import NotFound from "./Routes/NotFound.svelte";
  import Navbar from "./components/Navbar/Navbar.svelte";

  const routes = {
    "/": Home,
    "/post/:ipfsHash": Post,
    "/upload": Upload,
    "*": NotFound
  };
</script>

<Navbar />
<Router {routes} />
