type ipfs_hash = string;
type post = {
  ipfs_hash: ipfs_hash,
  timestamp: timestamp,
  info: map(string, string)
}

type action = 
  | Post ((ipfs_hash, string))
  | Tip
  | UpdateBlogger ((string, string))
  | DeletePost (ipfs_hash)
  | Withdraw (tez)
  | UpdateHashProperties ((nat, string));

type storage = {
  version: nat,
  postsList: set (ipfs_hash),
  posts: big_map(string, post),
  blogger: address,
  admin: address,
  info: map(string, string),
  tips: tez, // keeps track of all the tips ever sent to blogger
  hashLength: nat, // 46n
  hashChars: string // "Qm"
}

type return = (list(operation), storage);

/* 
  Saves new post
*/
let post = (ipfs_hash: ipfs_hash, title: string, s: storage): return => {
  if(Tezos.source != s.blogger) {
    failwith("UnauthorizedAction"): return ;
  } else {
    if(Set.mem(title, s.postsList)){
      // if title already exists
      failwith("DuplicateTitle"): return ;
    } else {
      if(String.size(ipfs_hash) != s.hashLength && String.sub(0n, 2n, ipfs_hash) != s.hashChars) {
        // if hash is not correctly formatted
        failwith("WrongHashFormat"): return;
      } else {
        let newPostsList = Set.add(title, s.postsList) ;
        let newPost: post = { ipfs_hash, timestamp: Tezos.now, info: Map.empty: map(string, string) };

        ([]: list (operation), 
        {...s, 
        postsList: newPostsList, 
        posts: Big_map.update(title, Some (newPost), s.posts)}) ;
      }
    }
  }
}

/* 
  Receives reader's tip
*/
let tip = (s: storage): return => {
  if(Tezos.amount == 0tez) {
    failwith("NoAmount"): return ;
  } else {
    if(Tezos.source == s.blogger){
      failwith("NoSelfTipping"): return ;
    } else {
      let newTips = s.tips + Tezos.amount ;

      ([]: list (operation), {...s, tips: newTips}) ;
    }
  }
}

/* 
  Update blogger's info
*/
let updateBlogger = (key: string, value: string, s: storage): return => {
  if(Tezos.source != s.blogger) {
    failwith("UnauthorizedAction"): return ;
  } else {
    ([]: list (operation), {...s, info: Map.update(key, Some (value), s.info)})
  }
}

/* 
  Delete post
*/
let deletePost = (ipfs_hash: ipfs_hash, s: storage): return => {
  if(Tezos.source != s.blogger || Tezos.source != s.admin) {
    // only blogger and admin can delete posts
    failwith("UnauthorizedAction"): return ;
  } else {
    if(!Set.mem(ipfs_hash, s.postsList)){
      failwith("UnknowHash"): return ;
    } else {
      ([]: list (operation), {...s, postsList: Set.remove(ipfs_hash, s.postsList)})
    }
  }
}

/* 
  Withdraw tezzies from tips
*/
let withdraw = (tezzies: tez, s: storage): return => {
  if(Tezos.source != s.blogger) {
    failwith("UnauthorizedAction"): return ;
  } else {
    if(tezzies < Tezos.balance){
      failwith("InsufficientBalance"): return ;
    } else {
      let recipient: contract(unit) = 
          switch(Tezos.get_contract_opt(s.blogger): option(contract(unit))){
            | None => failwith ("InvalidAddress"): contract(unit)
            | Some (contract) => contract
        };

      ([Tezos.transaction((), tezzies, recipient)], s) ;
    }
  }
}

/* 
  Update hash properties
  In case IPFS changes hash format in the future
*/
let updateHashProperties = (length: nat, chars: string, s: storage): return => {
  if(Tezos.source != s.blogger) {
    failwith("UnauthorizedAction"): return ;
  } else {
    ([]: list (operation), {...s, hashLength: length, hashChars: chars})
  }
}

/* 
  MAIN ENTRY POINT 
*/
let main = ((param, storage): (action, storage)): return => {
  switch (param) {
    | Post (data) => post(data[0], data[1], storage)
    | Tip  => tip (storage)
    | UpdateBlogger (info) => updateBlogger(info[0], info[1], storage)
    | DeletePost (ipfs_hash) => deletePost(ipfs_hash, storage)
    | Withdraw (v) => withdraw(v, storage)
    | UpdateHashProperties (props) => updateHashProperties(props[0], props[1], storage)
  }
}