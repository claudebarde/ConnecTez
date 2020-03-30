type ipfs_hash = string;

type post = {
  ipfs_hash: string,
  timestamp: timestamp,
  author: address
}

type blogger = {
  posts_set: set (ipfs_hash),
  total_tips: tez,
  name: option (string)
}

type posts_map = big_map(ipfs_hash, post);
type bloggers_list = big_map(address, tez);
type bloggers = big_map(address, blogger);

type storage = {
    bloggers: bloggers,
    bloggers_tips: bloggers_list,
    all_posts: posts_map,
    last_posts: set (ipfs_hash),
    admin: address
}

type return = (list(operation), storage);

type action = 
    | Post (ipfs_hash)
    | Tip (address)
    | UpdateBlogger (string)
    | Delete (ipfs_hash)
    | Withdraw

let post = ((ipfs_hash, storage): (ipfs_hash, storage)): return => {
  /* checks that valid ipfs hash is provided */
  if(String.size(ipfs_hash) == 46n && String.sub(0n, 2n, ipfs_hash) == "Qm"){
    /* updates blogger's info */
    let new_post: post = {ipfs_hash: ipfs_hash, timestamp: Tezos.now, author: Tezos.source};
    switch (Big_map.find_opt(Tezos.sender, storage.bloggers)) {
      /* creates new blogger */
      | None => {
        let blogger : blogger = {
          posts_set: Set.add(ipfs_hash, Set.empty: set (ipfs_hash)),
          total_tips: 0mutez, 
          name: None: option (string)
        };
        /* return */
        ([]: list(operation), {...storage, 
          bloggers_tips: Big_map.add(Tezos.sender, 0mutez, storage.bloggers_tips),
          bloggers: Big_map.add(Tezos.sender, blogger, storage.bloggers),
          all_posts: Big_map.add(ipfs_hash, new_post, storage.all_posts),
          last_posts: Set.add(ipfs_hash, storage.last_posts)});
      }
      /* updates blogger's account */
      | Some (blogger) => {
        /* return */
        ([]: list(operation), {...storage, 
          bloggers: Big_map.update(Tezos.sender, 
            Some ({...blogger, posts_set: Set.add(ipfs_hash, blogger.posts_set)}), 
            storage.bloggers),
          all_posts: Big_map.add(ipfs_hash, new_post, storage.all_posts),
          last_posts: Set.add(ipfs_hash, storage.last_posts)});
      }
    }
  } else {
    failwith("Incorrect IPFS hash provided!"): return;
  }
}

let tip = ((blogger_address, storage): (address, storage)): return => {
  let new_bloggers_tips: bloggers_list = 
    switch (Big_map.find_opt(blogger_address, storage.bloggers_tips)) {
      | None => failwith ("Unable to find blogger"): bloggers_list;
      | Some (blogger_tips) => 
          Big_map.update(blogger_address, 
                          Some (blogger_tips + Tezos.amount), 
                          storage.bloggers_tips);
    };

  let new_bloggers: bloggers = 
    switch(Big_map.find_opt(blogger_address, storage.bloggers)){
      | None => failwith ("Unable to find blogger"): bloggers;
      | Some (blogger) => 
        Big_map.update(blogger_address, 
                        Some ({...blogger, total_tips: Tezos.amount + blogger.total_tips}),
                        storage.bloggers);
    };

  ([]: list(operation), {...storage, bloggers_tips: new_bloggers_tips, bloggers: new_bloggers})
}

let updateBlogger = ((name, storage): (string, storage)): return => {
  switch(Big_map.find_opt(Tezos.sender, storage.bloggers)) {
    | None => failwith ("Unknown blogger"): return
    | Some (blogger) => ([]: list(operation), {...storage, 
        bloggers: Big_map.update(Tezos.sender, Some ({...blogger, name: Some (name)}), storage.bloggers)})
  }
}

let delete = ((ipfs_hash, storage): (ipfs_hash, storage)): return => {
  // finds the blogger's info
  switch(Big_map.find_opt(Tezos.sender, storage.bloggers)){
    | None => failwith("Unknown blogger"): return
    | Some (blogger) => 
      // checks if address is linked to IPFS hash
      if(Set.mem(ipfs_hash, blogger.posts_set)){
        // updates storage
        ([]: list(operation), {...storage,
          last_posts: Set.remove(ipfs_hash, storage.last_posts),
          all_posts: Big_map.remove(ipfs_hash, storage.all_posts),
          bloggers: Big_map.update(Tezos.sender, 
            Some ({...blogger, posts_set: Set.remove(ipfs_hash, blogger.posts_set)}), 
            storage.bloggers)});
      } else {
        failwith("You are not allowed to remove this post!"): return;
      }
  }
}

let withdraw = (storage: storage): return => {
  switch (Map.find_opt(Tezos.sender, storage.bloggers_tips)){
    | None => failwith ("Unknown blogger"): return
    | Some (tips) => {
      let opt_address : option(contract(unit)) = Tezos.get_contract_opt(Tezos.sender);
      switch (opt_address) {
        | None => failwith ("Error formatting user's address"): return;
        | Some (formatted_address) => {
          // prepares transaction and sets blogger's tips to zero
          let payment : operation = Tezos.transaction (unit, tips, formatted_address);
          ([payment], {...storage, 
            bloggers_tips: Big_map.update(Tezos.sender, Some (0tez), storage.bloggers_tips)});
        }
      }
    }
  }
}

let main = ((param, storage): (action, storage)): return => {
  switch (param) {
    | Post (ipfs_hash) => post ((ipfs_hash, storage))
    | Tip (blogger) => tip ((blogger, storage))
    | UpdateBlogger (name) => updateBlogger ((name, storage))
    | Delete (ipfs_hash) => delete ((ipfs_hash, storage))
    | Withdraw => withdraw (storage)
  }
}