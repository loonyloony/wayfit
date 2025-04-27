module 0xab310610823f47b2e4a58a1987114793514d63605826a766b0c2dd4bd2b6d3d3::boar_challenge {
    struct ChallengeWon has copy, drop {
        pool_id: 0x2::object::ID,
        winner: address,
        amount: u64,
    }
    
    struct ChallengePool has store, key {
        id: 0x2::object::UID,
        total_balance: 0x2::balance::Balance<0x2::sui::SUI>,
        participants: 0x2::vec_map::VecMap<address, 0x2::balance::Balance<0x2::sui::SUI>>,
        winners: 0x2::vec_map::VecMap<address, u64>,
        progress: 0x2::vec_map::VecMap<address, u64>,
        target_exercises: u64,
        start_time: u64,
        duration_days: u64,
        rewards_distributed: bool,
    }
    
    struct ChallengeNFT has store, key {
        id: 0x2::object::UID,
        owner: address,
        pool_id: 0x2::object::ID,
        name: 0x1::string::String,
        has_won: bool,
        last_exercise_day: u64,
    }
    
    struct CustomNFT has store, key {
        id: 0x2::object::UID,
        owner: address,
        name: 0x1::string::String,
    }
    
    struct GemLevelKey has copy, drop, store {
        dummy_field: bool,
    }
    
    struct PowerKey has copy, drop, store {
        dummy_field: bool,
    }
    
    public entry fun complete_exercise(arg0: &mut ChallengePool, arg1: &mut ChallengeNFT, arg2: &0x2::clock::Clock, arg3: &mut 0x2::tx_context::TxContext) {
        let v0 = 0x2::tx_context::sender(arg3);
        assert!(0x2::vec_map::contains<address, 0x2::balance::Balance<0x2::sui::SUI>>(&arg0.participants, &v0), 0);
        assert!(arg1.owner == v0 && arg1.pool_id == 0x2::object::id<ChallengePool>(arg0), 2);
        let v1 = 0x2::clock::timestamp_ms(arg2);
        assert!(v1 < arg0.start_time + arg0.duration_days * 86400000, 1);
        let v2 = (v1 - arg0.start_time) / 86400000 + 1;
        assert!(arg1.last_exercise_day < v2, 6);
        let v3 = 0x2::vec_map::get_mut<address, u64>(&mut arg0.progress, &v0);
        *v3 = *v3 + 1;
        arg1.last_exercise_day = v2;
    }
    
    public entry fun create_custom_nft(arg0: vector<u8>, arg1: &mut 0x2::tx_context::TxContext) {
        let v0 = 0x2::tx_context::sender(arg1);
        let v1 = CustomNFT{
            id    : 0x2::object::new(arg1), 
            owner : v0, 
            name  : 0x1::string::utf8(arg0),
        };
        let v2 = GemLevelKey{dummy_field: false};
        0x2::dynamic_field::add<GemLevelKey, u64>(&mut v1.id, v2, 1);
        let v3 = PowerKey{dummy_field: false};
        0x2::dynamic_field::add<PowerKey, u64>(&mut v1.id, v3, 100);
        0x2::transfer::public_transfer<CustomNFT>(v1, v0);
    }
    
    public entry fun distribute_rewards(arg0: &mut ChallengePool, arg1: &0x2::clock::Clock, arg2: &mut 0x2::tx_context::TxContext) {
        assert!(!arg0.rewards_distributed, 4);
        assert!(0x2::clock::timestamp_ms(arg1) >= arg0.start_time + arg0.duration_days * 86400000, 5);
        let v0 = 0;
        while (v0 < 0x2::vec_map::size<address, 0x2::balance::Balance<0x2::sui::SUI>>(&arg0.participants)) {
            let (v1, v2) = 0x2::vec_map::get_entry_by_idx<address, 0x2::balance::Balance<0x2::sui::SUI>>(&arg0.participants, v0);
            if (*0x2::vec_map::get<address, u64>(&arg0.progress, v1) >= arg0.target_exercises) {
                let v3 = 0x2::balance::value<0x2::sui::SUI>(v2);
                0x2::transfer::public_transfer<0x2::coin::Coin<0x2::sui::SUI>>(0x2::coin::take<0x2::sui::SUI>(&mut arg0.total_balance, v3, arg2), *v1);
                0x2::vec_map::insert<address, u64>(&mut arg0.winners, *v1, v3);
                let v4 = ChallengeWon{
                    pool_id : 0x2::object::id<ChallengePool>(arg0), 
                    winner  : *v1, 
                    amount  : v3,
                };
                0x2::event::emit<ChallengeWon>(v4);
            };
            v0 = v0 + 1;
        };
        arg0.rewards_distributed = true;
    }
    
    public fun get_nft_attributes(arg0: &CustomNFT) : (u64, u64) {
        let v0 = GemLevelKey{dummy_field: false};
        let v1 = PowerKey{dummy_field: false};
        (*0x2::dynamic_field::borrow<GemLevelKey, u64>(&arg0.id, v0), *0x2::dynamic_field::borrow<PowerKey, u64>(&arg0.id, v1))
    }
    
    public fun get_player_progress(arg0: &ChallengePool, arg1: address) : u64 {
        if (0x2::vec_map::contains<address, u64>(&arg0.progress, &arg1)) {
            *0x2::vec_map::get<address, u64>(&arg0.progress, &arg1)
        } else {
            0
        }
    }
    
    public fun get_pool_info(arg0: &ChallengePool) : (u64, u64, u64, u64, bool) {
        (0x2::balance::value<0x2::sui::SUI>(&arg0.total_balance), arg0.target_exercises, arg0.start_time, arg0.duration_days, arg0.rewards_distributed)
    }
    
    public entry fun init_pool(arg0: u64, arg1: u64, arg2: &0x2::clock::Clock, arg3: &mut 0x2::tx_context::TxContext) {
        let v0 = ChallengePool{
            id                  : 0x2::object::new(arg3), 
            total_balance       : 0x2::balance::zero<0x2::sui::SUI>(), 
            participants        : 0x2::vec_map::empty<address, 0x2::balance::Balance<0x2::sui::SUI>>(), 
            winners             : 0x2::vec_map::empty<address, u64>(), 
            progress            : 0x2::vec_map::empty<address, u64>(), 
            target_exercises    : arg0, 
            start_time          : 0x2::clock::timestamp_ms(arg2), 
            duration_days       : arg1, 
            rewards_distributed : false,
        };
        0x2::transfer::share_object<ChallengePool>(v0);
    }
    
    public fun is_winner(arg0: &ChallengePool, arg1: address) : bool {
        0x2::vec_map::contains<address, u64>(&arg0.winners, &arg1)
    }
    
    public entry fun join_challenge(arg0: &mut ChallengePool, arg1: 0x2::coin::Coin<0x2::sui::SUI>, arg2: &0x2::clock::Clock, arg3: &mut 0x2::tx_context::TxContext) {
        let v0 = 0x2::tx_context::sender(arg3);
        assert!(0x2::clock::timestamp_ms(arg2) < arg0.start_time + arg0.duration_days * 86400000, 1);
        let v1 = 0x2::coin::into_balance<0x2::sui::SUI>(arg1);
        if (0x2::vec_map::contains<address, 0x2::balance::Balance<0x2::sui::SUI>>(&arg0.participants, &v0)) {
            0x2::balance::join<0x2::sui::SUI>(0x2::vec_map::get_mut<address, 0x2::balance::Balance<0x2::sui::SUI>>(&mut arg0.participants, &v0), v1);
        } else {
            0x2::vec_map::insert<address, 0x2::balance::Balance<0x2::sui::SUI>>(&mut arg0.participants, v0, v1);
            0x2::vec_map::insert<address, u64>(&mut arg0.progress, v0, 0);
        };
        0x2::balance::join<0x2::sui::SUI>(&mut arg0.total_balance, 0x2::balance::split<0x2::sui::SUI>(&mut v1, 0x2::balance::value<0x2::sui::SUI>(&v1)));
        let v2 = ChallengeNFT{
            id                : 0x2::object::new(arg3), 
            owner             : v0, 
            pool_id           : 0x2::object::id<ChallengePool>(arg0), 
            name              : 0x1::string::utf8(b"Challenge NFT"), 
            has_won           : false, 
            last_exercise_day : 0,
        };
        0x2::transfer::public_transfer<ChallengeNFT>(v2, v0);
    }
    
    public entry fun upgrade_gem(arg0: &mut CustomNFT, arg1: 0x2::coin::Coin<0x2::sui::SUI>, arg2: &mut 0x2::tx_context::TxContext) {
        assert!(arg0.owner == 0x2::tx_context::sender(arg2), 2);
        assert!(0x2::coin::value<0x2::sui::SUI>(&arg1) >= 100000000, 3);
        0x2::transfer::public_transfer<0x2::coin::Coin<0x2::sui::SUI>>(0x2::coin::from_balance<0x2::sui::SUI>(0x2::coin::into_balance<0x2::sui::SUI>(arg1), arg2), @0x4c76d83354aee4487f1f5f8347a47b6c14724ac5dde76c85f277e7b0de4f75f8);
        let v0 = GemLevelKey{dummy_field: false};
        let v1 = 0x2::dynamic_field::borrow_mut<GemLevelKey, u64>(&mut arg0.id, v0);
        *v1 = *v1 + 1;
        let v2 = PowerKey{dummy_field: false};
        let v3 = 0x2::dynamic_field::borrow_mut<PowerKey, u64>(&mut arg0.id, v2);
        *v3 = *v3 + 50;
    }
    
    // decompiled from Move bytecode v6
}

