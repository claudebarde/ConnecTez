type highlight = {
  ipfs_hash: string,
  startTime: timestamp,
  endTime: timestamp,
  creator: address
};

type bloggerInfo = {account: address, name: option (string), other: map(string, string)};

type storage = {
  bloggers: big_map(address, bloggerInfo),
  bloggers_reserved_names: set (string),
  highlights: list(highlight),
  admin: address,
  updateNameFee: tez,
  highlightFee: tez, // per day
  revenue: tez,
  blacklist: set (address)
}

type new_highlight = {ipfs_hash: string, duration: nat}; // duration in days

type return = (list(operation), storage);

type action = 
    | AddBlogger ((address, address))
    | RemoveBlogger (address)
    | UpdateBlogger (string)
    | AddHighlight (new_highlight)
    | AdminWithdraw
    | Blacklist (address)

/*
  ENTRY POINTS
*/

let addBlogger = (bloggerAddr: address, accountAddr: address, s: storage): return => {
  // checks if tx originates from blogger
  if(bloggerAddr != Tezos.source){
    failwith("UnauthorizedAction"): return ;
  } else {
    // checks if blogger is not in the blacklist
    if(Set.mem(bloggerAddr, s.blacklist)){
      failwith("BlacklistedAddress"): return ;
    } else {
      // checks if blogger doesn't already exists
      switch(Big_map.find_opt(bloggerAddr, s.bloggers)) {
        | Some (b) => failwith("BloggerAlreadyExists"): return ;
        | None => {
            let info = {account: accountAddr, name: None: option (string), other: Map.empty: map(string, string)} ;

            ([]: list (operation), 
            {...s, bloggers: Big_map.add(bloggerAddr, info, s.bloggers)})
          }        
      }
    }
  }
}

let removeBlogger = (bloggerAddr: address, s: storage): return => {
  if(Tezos.source != s.admin) {
    failwith("UnauthorizedAction"): return ;
  } else {
    ([]: list (operation), {...s, bloggers: Big_map.remove(bloggerAddr, s.bloggers)})
  }
}

let updateBlogger = ((name, s): (string, storage)): return => {
  if(String.length(name) >= 4n){
      // checks if name is not reserved
      if(Set.mem(name, s.bloggers_reserved_names) == false){
        // checks if right fee has been sent
        if(Tezos.amount == s.updateNameFee){
          switch(Big_map.find_opt(Tezos.source, s.bloggers)) {
            | None => failwith ("UnknownBlogger"): return
            | Some (blogger) => {
                // updates bloggers' reserved names
                // removes previous name
                let previousName = 
                  switch(blogger.name){
                    | None => ""
                    | Some (n) => n
                  };
                let updatedBloggersNames = Set.remove(previousName, s.bloggers_reserved_names);
                // returns new storage
                ([]: list(operation), {...s, 
                bloggers: Big_map.update(Tezos.source, Some ({...blogger, name: Some (name)}), s.bloggers),
                bloggers_reserved_names: Set.add(name, updatedBloggersNames),
                revenue: s.revenue + Tezos.amount})
              }
          }
        } else {
          failwith("WrongFee"): return;
        }
      } else {
        failwith("NameAlreadyExists"): return;
      }
    } else {
      failwith("WrongNameLength"): return;
    }
}

let addHighlight = ((info, s): (new_highlight, storage)): return => {
  // checks if amount equals duration * fee
  if(Tezos.amount == info.duration * s.highlightFee){
    // creates new highlight
        let newHighlight = {
          ipfs_hash: info.ipfs_hash,
          startTime: Tezos.now,
          endTime: Tezos.now + int(info.duration * 24n * 60n * 60n),
          creator: Tezos.sender
        };
        ([]: list(operation), {...s, highlights: [newHighlight, ...s.highlights]});
  } else {
    failwith("WrongAmount!"): return;
  }
}


let adminWithdraw = (storage: storage): return => {
  if(Tezos.source == storage.admin && storage.revenue > 0tez) {
    switch (Tezos.get_contract_opt(storage.admin) : option(contract(unit))) {
      | Some(contract) => {
          let withdrawal: operation = Tezos.transaction(unit, storage.revenue, contract);
          ([withdrawal], {...storage, revenue: 0tez});
        }
      | None => failwith("InvalidContract"): return
    }
  } else {
    failwith("UnauthorizedAction!"): return;
  }
}

let blacklist = (addr: address, s: storage): return => {
  if(Tezos.source != s.admin) {
    failwith("UnauthorizedAction"): return ;
  } else {
    ([]: list (operation), {...s, blacklist: Set.add(addr, s.blacklist)})
  }
}

/* 
  MAIN ENTRY POINT 
*/
let main = ((param, storage): (action, storage)): return => {
  switch (param) {
    | AddBlogger (data) => addBlogger(data[0], data[1], storage)
    | RemoveBlogger (b) => removeBlogger(b, storage)
    | UpdateBlogger (name) => updateBlogger((name, storage))
    | AddHighlight (info) => addHighlight((info, storage))
    | AdminWithdraw => adminWithdraw(storage)
    | Blacklist (b) => blacklist(b, storage)
  }
}