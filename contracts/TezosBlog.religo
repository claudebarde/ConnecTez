type post = {
  ipfs_hash: string,
  title: string,
  timestamp: timestamp
}

type posts_list = list (post);

type blogger = {
  posts_list: posts_list,
  current_tips: tez,
  total_tips: tez,
  name: string
}

type post_params = {
  ipfs_hash: string,
  title: string
}

type storage = {
    bloggers: big_map(address, blogger),
    bloggers_tips: big_map(address, tez),
    last_posts: posts_list
}

type return = (list(operation), storage);

type action = 
    | Post (post_params)
    | Tip (address)
    | UpdateBlogger (string)
    | Withdraw

let post = ((params, storage): (post_params, storage)): return => {
  /* checks that valid ipfs hash is provided */
  if(String.size(params.ipfs_hash) == 46n && String.slice(0n, 1n, params.ipfs_hash) == "Qm"){
    /* updates blogger's info */
    let new_post: post = {ipfs_hash: params.ipfs_hash, title: params.title, timestamp: Tezos.now};
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
          let payment : operation = Tezos.transaction (unit, tips, formatted_address);
          ([payment], storage);
        }
      }
    }
  }
}

let main = ((param, storage): (action, storage)): return => {
  switch (param) {
    | Post (params) => post ((params, storage))
    | Tip (blogger) => tip ((blogger, storage))
    | UpdateBlogger (name) => updateBlogger ((name, storage))
    | Withdraw => withdraw (storage)
  }
}