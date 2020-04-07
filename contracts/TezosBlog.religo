type ipfs_hash = string;

type post = {
  ipfs_hash: string,
  timestamp: timestamp,
  author: address
}

type blogger = {
  posts_set: set (ipfs_hash),
  total_tips: tez, // keeps track of total amount of tips since the beginning
  name: option (string)
}

type posts_map = big_map(ipfs_hash, post);
type bloggers_list = big_map(address, tez);
type bloggers = big_map(address, blogger);

type storage = {
  bloggers: bloggers,
  bloggers_tips: bloggers_list, // keeps track of current amount of tips
  all_posts: posts_map,
  last_posts: set (ipfs_hash),
  bloggers_reserved_names: set (string),
  admin: address,
  updateNameFee: tez,
  paused: bool,
  revenue: tez
}

type delete_record = {ipfs_hash: ipfs_hash, blogger_addr: address};

type return = (list(operation), storage);

type action = 
    | Post (ipfs_hash)
    | Tip (address)
    | UpdateBlogger (string)
    | DeletePost (ipfs_hash)
    | Withdraw
    | PauseContract
    | AdminDeletePost (delete_record)
    | AdminWithdraw

/*
  ENTRY POINTS
*/
let post = ((ipfs_hash, storage): (ipfs_hash, storage)): return => {
  if(storage.paused == false){
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
  } else {
    failwith("The contract has been paused!"): return;
  }
}

let tip = ((blogger_address, storage): (address, storage)): return => {
  if(storage.paused == false){
    // bloggers cannot tip themselves
    if(blogger_address != Tezos.source){
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

      ([]: list(operation), {...storage, bloggers_tips: new_bloggers_tips, bloggers: new_bloggers});
    } else {
      failwith("You cannot tip yourself!"): return;
    }
  } else {
    failwith("The contract has been paused!"): return;
  }
}

let updateBlogger = ((name, storage): (string, storage)): return => {
  if(storage.paused == false){
    // checks if name is not reserved
    if(Set.mem(name, storage.bloggers_reserved_names) == false){
      // checks if right fee has been sent
      if(Tezos.amount == storage.updateNameFee){
        switch(Big_map.find_opt(Tezos.sender, storage.bloggers)) {
          | None => failwith ("Unknown blogger"): return
          | Some (blogger) => ([]: list(operation), {...storage, 
              bloggers: Big_map.update(Tezos.sender, Some ({...blogger, name: Some (name)}), storage.bloggers),
              bloggers_reserved_names: Set.add(name, storage.bloggers_reserved_names),
              revenue: storage.revenue + Tezos.amount})
        }
      } else {
        failwith("Wrong update fee provided"): return;
      }
    } else {
      failwith("Name is already reserved!"): return;
    }
  } else {
    failwith("The contract has been paused!"): return;
  }
}

let delete_ipfs_hash = ((blogger_addr, ipfs_hash, storage): (address, ipfs_hash, storage)): return => 
  switch(Big_map.find_opt(blogger_addr, storage.bloggers)){
    // finds the blogger's info
    | None => failwith("Unknown blogger"): return
    | Some (blogger) => 
      // checks if address is linked to IPFS hash
      if(Set.mem(ipfs_hash, blogger.posts_set)){
        // updates storage
        ([]: list(operation), {...storage,
          last_posts: Set.remove(ipfs_hash, storage.last_posts),
          all_posts: Big_map.remove(ipfs_hash, storage.all_posts),
          bloggers: Big_map.update(blogger_addr, 
            Some ({...blogger, posts_set: Set.remove(ipfs_hash, blogger.posts_set)}), 
            storage.bloggers)});
      } else {
        failwith("You are not allowed to remove this post!"): return;
      }
    }

let deletePost = ((ipfs_hash, storage): (ipfs_hash, storage)): return => {
  if(storage.paused == false){
    delete_ipfs_hash((Tezos.sender, ipfs_hash, storage));
  } else {
    failwith("The contract has been paused!"): return;
  }
}

let withdraw = (storage: storage): return => {
  if(storage.paused == false){
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
  } else {
    failwith("The contract has been paused!"): return;
  }
}

/* 
  ADMIN FUNCTIONS 
*/
let adminPause = (storage: storage): return => {
  if(Tezos.source == storage.admin){
    ([]: list (operation), {...storage, paused: !storage.paused})
  } else {
    failwith("You are not allowed to perform this action!"): return;
  }
}

let adminDeletePost = ((delete_info, storage): (delete_record, storage)): return => {
  if(Tezos.source == storage.admin){
    delete_ipfs_hash((delete_info.blogger_addr, delete_info.ipfs_hash, storage));
  } else {
    failwith("You are not allowed to perform this action!"): return;
  }
}

let adminWithdraw = (storage: storage): return => {
  if(Tezos.source == storage.admin && storage.revenue > 0tez) {
    switch (Tezos.get_contract_opt(storage.admin) : option(contract(unit))) {
      | Some(contract) => {
          let withdrawal: operation = Tezos.transaction(unit, storage.revenue, contract);
          ([withdrawal], {...storage, revenue: 0tez});
        }
      | None => failwith("Invalid contract"): return
    }
  } else {
    failwith("You are not allowed to perform this action!"): return;
  }
}

/* 
  MAIN ENTRY POINT 
*/
let main = ((param, storage): (action, storage)): return => {
  switch (param) {
    | Post (ipfs_hash) => post ((ipfs_hash, storage))
    | Tip (blogger) => tip ((blogger, storage))
    | UpdateBlogger (name) => updateBlogger ((name, storage))
    | DeletePost (ipfs_hash) => deletePost ((ipfs_hash, storage))
    | Withdraw => withdraw (storage)
    | PauseContract => adminPause (storage)
    | AdminDeletePost (param) => adminDeletePost ((param, storage))
    | AdminWithdraw => adminWithdraw(storage)
  }
}