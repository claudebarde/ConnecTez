type post = {
  ipfs_hash: string,
  timestamp: timestamp
}

type posts_list = list (post);

type blogger = {
  posts_list: posts_list,
  current_tips: tez,
  total_tips: tez,
  name: string
}

type ipfs_hash = string;

type storage = {
    bloggers: big_map(address, blogger),
    bloggers_tips: big_map(address, tez),
    last_posts: posts_list
}

type return = (list(operation), storage);

type action = 
    | Post (ipfs_hash)
    | Tip (address)
    | UpdateBlogger (string)
    | Withdraw

let post = ((ipfs_hash, storage): (ipfs_hash, storage)): return => {
  /* checks that valid ipfs hash is provided */
  if(String.size(ipfs_hash) == 46n && String.sub(0n, 2n, ipfs_hash) == "Qm"){
    /* updates blogger's info */
    let new_post: post = {ipfs_hash: ipfs_hash, timestamp: Tezos.now};
    switch (Big_map.find_opt(Tezos.sender, storage.bloggers)) {
      /* creates new blogger */
      | None => {
        let blogger : blogger = {
          posts_list: [new_post], 
          current_tips: 0mutez, 
          total_tips: 0mutez, 
          name: "undefined"
        };
        /* return */
        ([]: list(operation), {...storage, 
          bloggers_tips: Big_map.add(Tezos.sender, 0mutez, storage.bloggers_tips),
          bloggers: Big_map.add(Tezos.sender, blogger, storage.bloggers),
          last_posts: [new_post, ...storage.last_posts]});
      }
      /* updates blogger's account */
      | Some (blogger) => {
        /* return */
        ([]: list(operation), {...storage, 
          bloggers: Big_map.update(Tezos.sender, 
            Some ({...blogger, posts_list: [new_post,...blogger.posts_list]}), 
            storage.bloggers),
          last_posts: [new_post, ...storage.last_posts]});
      }
    }
  } else {
    failwith("Incorrect IPFS hash provided!"): return;
  }
}

let tip = ((blogger_address, storage): (address, storage)): return => {
  switch (Big_map.find_opt(blogger_address, storage.bloggers_tips)) {
    | None => failwith ("Unable to find blogger"): return;
    | Some (blogger_tips) => 
      ([]: list(operation), {...storage, 
        bloggers_tips: 
          Big_map.update(blogger_address, Some (blogger_tips + Tezos.amount), storage.bloggers_tips)})
  }
}

let updateBlogger = ((name, storage): (string, storage)): return => {
  switch(Big_map.find_opt(Tezos.sender, storage.bloggers)) {
    | None => failwith ("Unknown blogger"): return
    | Some (blogger) => ([]: list(operation), {...storage, 
        bloggers: Big_map.update(Tezos.sender, Some ({...blogger, name}), storage.bloggers)})
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
    | Withdraw => withdraw (storage)
  }
}