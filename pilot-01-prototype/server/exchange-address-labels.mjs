// Exchange-owned addresses used to label whale transfers on /whales.
// Source rule: only addresses published by the exchange itself in its proof-of-reserves wallet list (one source per
// address: the official PoR page a reader can open, plus the exact data file read). Fetched 2026-10-13.
// Bitget, Kraken and Coinbase publish no per-address list (Merkle/attestation only), so they have no labels here.
// Binance.US rows predate this list and come from the DefiLlama CEX owners list.
const REVIEWED = "2026-10-13";
const BINANCE_POR = Object.freeze({ source: "https://www.binance.com/en/proof-of-reserves", dataSource: "https://www.binance.com/bapi/apex/v1/public/apex/market/por/address", asOf: "2026-10-02" });
const OKX_POR = Object.freeze({ source: "https://www.okx.com/proof-of-reserves/download", dataSource: "https://static.okx.com/cdn/okx/por/chain/por_csv_2026090800_V1.zip", asOf: "2026-09-08" });
const BYBIT_POR = Object.freeze({ source: "https://www.bybit.com/app/user/proof-of-reserve", dataSource: "https://www.bybit.com/common-static/por/bybit_por_202609.csv", asOf: "2026-09-23" });
const DEFILLAMA_CEX = Object.freeze({ source: "https://github.com/DefiLlama/DefiLlama-Adapters/blob/main/cex/index.js", dataSource: null, asOf: "2026-10-13" });
const row = (address, label, owner, ref) => Object.freeze({ address, label, owner, source: ref.source, dataSource: ref.dataSource, asOf: ref.asOf, reviewedAt: REVIEWED });

export const EXCHANGE_ADDRESS_LABEL_ROWS = Object.freeze({
  ethereum: Object.freeze([
    row("0x030e37ddd7df1b43db172b23916d523f1599c6cb", "Binance", "binance", BINANCE_POR),
    row("0x18e226459ccf0eec276514a4fd3b226d8961e4d1", "Binance", "binance", BINANCE_POR),
    row("0x1b46970cfe6a271e884f636663c257a5a571fb2c", "Binance", "binance", BINANCE_POR),
    row("0x21a31ee1afc51d94c2efccaa2092ad1028285549", "Binance", "binance", BINANCE_POR),
    row("0x22132139bf7f3921b1cadeab931f4fbf7bf2bc9e", "Binance", "binance", BINANCE_POR),
    row("0x26bff98f6f37c8d560684eaf2afd1149bf76633e", "Binance", "binance", BINANCE_POR),
    row("0x28c6c06298d514db089934071355e5743bf21d60", "Binance", "binance", BINANCE_POR),
    row("0x308a2a0712570daeea77c8ba9c27a32cdc4000d4", "Binance", "binance", BINANCE_POR),
    row("0x32e11a20337ebc79abd0eeab2d91bafbd9591149", "Binance", "binance", BINANCE_POR),
    row("0x38aaef3782910bdd9ea3566c839788af6ff9b200", "Binance", "binance", BINANCE_POR),
    row("0x3a3c006053a9b40286b9951a11be4c5808c11dc8", "Binance", "binance", BINANCE_POR),
    row("0x43684d03d81d3a4c70da68febdd61029d426f042", "Binance", "binance", BINANCE_POR),
    row("0x4976a4a02f38326660d17bf34b431dc6e2eb2327", "Binance", "binance", BINANCE_POR),
    row("0x4a9e49a45a4b2545cb177f79c7381a30e1dc261f", "Binance", "binance", BINANCE_POR),
    row("0x4aec0e98fc1fb55b9cc2faaa7a81acca42cb4e96", "Binance", "binance", BINANCE_POR),
    row("0x4ed6cf63bd9c009d247ee51224fc1c7041f517f1", "Binance", "binance", BINANCE_POR),
    row("0x4fdfe365436b5273a42f135c6a6244a20404271e", "Binance", "binance", BINANCE_POR),
    row("0x56eddb7aa87536c09ccc2793473599fd21a8b17f", "Binance", "binance", BINANCE_POR),
    row("0x5a52e96bacdabb82fd05763e25335261b270efcb", "Binance", "binance", BINANCE_POR),
    row("0x71a7de1bdad3904b312717843597f549d2a79eb8", "Binance", "binance", BINANCE_POR),
    row("0x756b86fd69914db92229c07c7393d7d9948fed33", "Binance", "binance", BINANCE_POR),
    row("0x835678a611b28684005a5e2233695fb6cbbb0007", "Binance", "binance", BINANCE_POR),
    row("0x86523c87c8ec98c7539e2c58cd813ee9d1a08d96", "Binance", "binance", BINANCE_POR),
    row("0x87433fec6f8d9df13d1e17c4b11364ecd2e93a51", "Binance", "binance", BINANCE_POR),
    row("0x9696f59e4d72e237be84ffd425dcad154bf96976", "Binance", "binance", BINANCE_POR),
    row("0x98adef6f2ac8572ec48965509d69a8dd5e8bba9d", "Binance", "binance", BINANCE_POR),
    row("0xa64b436964e7415c0e70b9989a53e1fb9a90e726", "Binance", "binance", BINANCE_POR),
    row("0xa7c0d36c4698981fab42a7d8c783674c6fe2592d", "Binance", "binance", BINANCE_POR),
    row("0xad354cfbaa4a8572dd6df021514a3931a8329ef5", "Binance", "binance", BINANCE_POR),
    row("0xb93b82f33e2653b544e046128f3cb47879dc917b", "Binance", "binance", BINANCE_POR),
    row("0xbe0eb53f46cd790cd13851d5eff43d12404d33e8", "Binance", "binance", BINANCE_POR),
    row("0xc8daf809c7d7c27dd62d006196d8901ba57e5eae", "Binance", "binance", BINANCE_POR),
    row("0xd3a22590f8243f8e83ac230d1842c9af0404c4a1", "Binance", "binance", BINANCE_POR),
    row("0xdfd5293d8e347dfe59e90efd55b2956a1343963d", "Binance", "binance", BINANCE_POR),
    row("0xe1940f578743367f38d3f25c2d2d32d6636929b6", "Binance", "binance", BINANCE_POR),
    row("0xee7ae85f2fe2239e27d9c1e23fffe168d63b4055", "Binance", "binance", BINANCE_POR),
    row("0xf977814e90da44bfa03b6295a0616a897441acec", "Binance", "binance", BINANCE_POR),
    row("0xa073345811e360e9b66f24bc11f3a4bfa924f236", "OKX", "okx", OKX_POR),
    row("0x08f619716db7c6245401b543e59acac1d25cb483", "OKX", "okx", OKX_POR),
    row("0xc5451b523d5fffe1351337a221688a62806ad91a", "OKX", "okx", OKX_POR),
    row("0x42436286a9c8d63aafc2eebbca193064d68068f2", "OKX", "okx", OKX_POR),
    row("0x69a722f0b5da3af02b4a205d6f0c285f4ed8f396", "OKX", "okx", OKX_POR),
    row("0x65a0947ba5175359bb457d3b34491edf4cbf7997", "OKX", "okx", OKX_POR),
    row("0xcba38020cd7b6f51df6afaf507685add148f6ab6", "OKX", "okx", OKX_POR),
    row("0x5c52cc7c96bde8594e5b77d5b76d042cb5fae5f2", "OKX", "okx", OKX_POR),
    row("0xe9172daf64b05b26eb18f07ac8d6d723acb48f99", "OKX", "okx", OKX_POR),
    row("0x461249076b88189f8ac9418de28b365859e46bfd", "OKX", "okx", OKX_POR),
    row("0xb0a27099582833c0cb8c7a0565759ff145113d64", "OKX", "okx", OKX_POR),
    row("0xdce83237fbf279c4522e7cac4b10428e2b8694da", "OKX", "okx", OKX_POR),
    row("0xbe2ec156292587338d4e9f80f5439e6152d56fc5", "OKX", "okx", OKX_POR),
    row("0x03d0aad7c6a0b36f47d852a28ff0fb7bc9ae46b6", "OKX", "okx", OKX_POR),
    row("0x7a91e803db0e58b6fecc4e42c86b366778475e3c", "OKX", "okx", OKX_POR),
    row("0x8f1aae22d0b4335945950d0bbd0f3743d3fc6f22", "OKX", "okx", OKX_POR),
    row("0x9db8b860692c41e709d48d089de64cf01e6e317e", "OKX", "okx", OKX_POR),
    row("0xcc5d36fb0126515cb7988bbeee8445f03c304b2a", "OKX", "okx", OKX_POR),
    row("0xd049e4ddf1133af3a7a27390b4c9018141df1a49", "OKX", "okx", OKX_POR),
    row("0xe7b29ff45392876143c7b863d57fb2326afe0ff1", "OKX", "okx", OKX_POR),
    row("0xf683b33e21e85ee6c0e25af2fff5b2b115f32617", "OKX", "okx", OKX_POR),
    row("0xfad70cb84e104817a7e9345d25ed0d3048af2d2d", "OKX", "okx", OKX_POR),
    row("0xccdcfc4598f539408fc0393b42905c1e0d24a91e", "OKX", "okx", OKX_POR),
    row("0x0607c628054a7db3d36eed7c4a408eda8260de09", "OKX", "okx", OKX_POR),
    row("0x559432e18b281731c054cd703d4b49872be4ed53", "OKX", "okx", OKX_POR),
    row("0x1a557020c52f9d2495b2c12eb137ee7b5d467a4f", "OKX", "okx", OKX_POR),
    row("0x5b873ffcad5dccdc61c1a53c391fb76cb316a841", "OKX", "okx", OKX_POR),
    row("0x7f61dc44c15ca818f96c6fc40739e5aa732e240c", "OKX", "okx", OKX_POR),
    row("0x7fe830ec109e112f549d6ee9d3e9540e7785997b", "OKX", "okx", OKX_POR),
    row("0x7cfe28094f4531809992ed89060a61413116365d", "OKX", "okx", OKX_POR),
    row("0x32dc16f4631a27b042a974d05c1ccf8a303e8199", "OKX", "okx", OKX_POR),
    row("0xe404fe9b7b0d0e88e77731517202fb392f67cd74", "OKX", "okx", OKX_POR),
    row("0x01f66697aec1e7de7773115243247952245fd3a4", "OKX", "okx", OKX_POR),
    row("0x65e891ec42fcaa19459fe6221163e1a3f8cf7ea6", "OKX", "okx", OKX_POR),
    row("0xedc0a430dd32eb8cfcc3a344979f0e21bc48bf0d", "OKX", "okx", OKX_POR),
    row("0x92ea7496eba5f001d620005f88f3e8e686e3d4ea", "OKX", "okx", OKX_POR),
    row("0xa9ac43f5b5e38155a288d1a01d2cbc4478e14573", "OKX", "okx", OKX_POR),
    row("0x6709383e211ab08a6e3270532e756220400424a6", "OKX", "okx", OKX_POR),
    row("0xf418263a6468c80d3bcb71033c56aacf81b241ba", "OKX", "okx", OKX_POR),
    row("0xa09fe38187abecc2768b98b80ea30afbc2fbd774", "OKX", "okx", OKX_POR),
    row("0x6cc5f688a315f3dc28a7781717a9a798a59fda7b", "OKX", "okx", OKX_POR),
    row("0x5041ed759dd4afc3a72b8192c143f72f4724081a", "OKX", "okx", OKX_POR),
    row("0x91d40e4818f4d4c57b4578d9eca6afc92ac8debe", "OKX", "okx", OKX_POR),
    row("0x4a4aaa0155237881fbd5c34bfae16e985a7b068d", "OKX", "okx", OKX_POR),
    row("0xf89d7b9c864f589bbf53a82105107622b35eaa40", "Bybit", "bybit", BYBIT_POR),
    row("0xa7a93fd0a276fc1c0197a5b5623ed117786eed06", "Bybit", "bybit", BYBIT_POR),
    row("0xee5b5b923ffce93a870b3104b7ca09c3db80047a", "Bybit", "bybit", BYBIT_POR),
    row("0x88a1493366d48225fc3cefbdae9ebb23e323ade3", "Bybit", "bybit", BYBIT_POR),
    row("0x6bd869be16359f9e26f0608a50497f6ef122ee3e", "Bybit", "bybit", BYBIT_POR),
    row("0x922fa922da1b0b28d0af5aa274d7326eaa108c3d", "Bybit", "bybit", BYBIT_POR),
    row("0x801bfd99636ec8961f7e2d2dd0a296d726f5f1ae", "Bybit", "bybit", BYBIT_POR),
    row("0x412dd3f282b1fa20d3232d86ae060dec644249f6", "Bybit", "bybit", BYBIT_POR),
    row("0x6f4565c9d673dbdd379aba0b13f8088d1af3bb0c", "Bybit", "bybit", BYBIT_POR),
    row("0xb829e684df8e31b402a4d4aedf3bbc18a52e7589", "Bybit", "bybit", BYBIT_POR),
    row("0x371c31f9221459e10565cfe78937cbda5db1791c", "Bybit", "bybit", BYBIT_POR),
    row("0xcab3f132a11e5b723fc20ddab8bb1b858d00a8e8", "Bybit", "bybit", BYBIT_POR),
    row("0x80a9b4aab0ad3c73cce1c9223236b722db5d6628", "Bybit", "bybit", BYBIT_POR),
    row("0xc22166664e820cda6bf4cedbdbb4fa1e6a84c440", "Bybit", "bybit", BYBIT_POR),
    row("0x6b9b774502e6afaafcac84f840ac8a0844a1abe3", "Bybit", "bybit", BYBIT_POR),
    row("0xdae4fdcb7fc93738ec6d5b1ea92b7c7f75e4f2f6", "Bybit", "bybit", BYBIT_POR),
    row("0x72187db55473b693ded367983212fe2db3768829", "Bybit", "bybit", BYBIT_POR),
    row("0x63bee4a7e4aa5d76dc6ab9b9d1852aabb9a40936", "Bybit", "bybit", BYBIT_POR),
    row("0x33ae83071432116ae892693b45466949a38ac74c", "Bybit", "bybit", BYBIT_POR),
    row("0x79ae8c1b31b1e61c4b9d1040217a051f954d4433", "Bybit", "bybit", BYBIT_POR),
    row("0x30ba21597f22aafa4b0e86c250c8a6eebaf0da54", "Bybit", "bybit", BYBIT_POR),
    row("0xc273a2e3fc4c8f8610ebe51123dc32d233913da7", "Bybit", "bybit", BYBIT_POR),
    row("0x25c7d768a7d53e6ebe5590c621437126c766e1ea", "Bybit", "bybit", BYBIT_POR),
    row("0x6206ae3781f9f1b6fbcf44c7240b1be14f3169ef", "Bybit", "bybit", BYBIT_POR),
    row("0xa9cf4aa55c675badb68519e3cfa8f4be942e6d11", "Bybit", "bybit", BYBIT_POR),
    row("0x869bcee3a0bad2211a65c63ec47dbd3d85a84d68", "Bybit", "bybit", BYBIT_POR),
    row("0x61b2aa17c1c1114e7583bb31f777ff4bdc7ab717", "Bybit", "bybit", BYBIT_POR),
    row("0x3bd0e57e2917d3d9a93f479b3a23b28c3f31a789", "Bybit", "bybit", BYBIT_POR),
    row("0xb24692d17babefd97ea2b4ca604a481a7cc2c8ea", "Bybit", "bybit", BYBIT_POR),
    row("0xc93e48d89f2d6dbc1672908aa68ce7c24d0413b4", "Bybit", "bybit", BYBIT_POR),
    row("0xd860962a96cd471bbe60a83c33e65011d40eb65f", "Bybit", "bybit", BYBIT_POR),
    row("0x3db4cb6d753d9e0ba7cc84e576d17dcd01b6b67d", "Bybit", "bybit", BYBIT_POR),
    row("0x7c41c7d883dbbe1edfcefca9d7a7592dd30c8b51", "Bybit", "bybit", BYBIT_POR),
    row("0x933646d78ede6f1ef5cf4a0a03e3a819c8057922", "Bybit", "bybit", BYBIT_POR),
    row("0x3cef1f90be0f15f1573bda7a3e045cca9cff1d15", "Bybit", "bybit", BYBIT_POR),
    row("0x429b41e5eb73e2266affbc2d7a41553bd8f1ede1", "Bybit", "bybit", BYBIT_POR),
    row("0x4e5e17e8ef17c9a7ef9798ddf78f3a2c38367d16", "Bybit", "bybit", BYBIT_POR),
    row("0xd7c4d4b3f076bf9fe391190c42676b4dc269ee02", "Bybit", "bybit", BYBIT_POR),
    row("0x01e2fb8f565d5e3cb9e0e8f0b607a96169b94393", "Bybit", "bybit", BYBIT_POR),
    row("0x495eb9345788ee6be50c9c36ed67ffa2beb3699f", "Bybit", "bybit", BYBIT_POR),
    row("0x61189da79177950a7272c88c6058b96d4bcd6be2", "Binance.US", "binance-us", DEFILLAMA_CEX),
    row("0x34ea4138580435b5a521e460035edb19df1938c1", "Binance.US", "binance-us", DEFILLAMA_CEX),
    row("0xf60c2ea62edbfe808163751dd0d8693dcb30019c", "Binance.US", "binance-us", DEFILLAMA_CEX),
    row("0x6a4561ef7874a76b4bf0d3edca31dfcd51603414", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0xbf94f0ac752c739f623c463b5210a7fb2cbb420b", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0xae0cbaba071d58efc278a815b2cb652286e192ff", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0xb47a0ac7798d8308467b2b96ac632ed43c9cb6d7", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x12a8bdc0470ab29a229d828526641b7d1f170fcf", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x25236e080106b5387df201fbbd9a6b870917676d", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x3d55ccb2a943d88d39dd2e62daf767c69fd0179f", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x68841a1806ff291314946eebd0cda8b348e73d6d", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0xa7efae728d2936e78bda97dc267687568dd593f3", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0xeaed6576334b003d1c5c4797d9c7bb025a20c038", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0xd576392cb12b7749ba33f8d223f64e65ee32f03f", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0xdad24044e36587d975d7b5bceb6467fac21e0c81", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0xf7858da8a6617f7c6d0ff2bcafdb6d2eedf64840", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0xdc3ce895714844b4775b6d06f0dae513542cee10", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0xc5a93444cc4da6efb9e6fc6e5d3cb55a53b52396", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x7eb6c83ab7d8d9b8618c0ed973cbef71d1921ef2", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x313eb1c5e1970eb5ceef6aebad66b07c7338d369", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x9723b6d608d4841eb4ab131687a5d4764eb30138", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x96fdc631f02207b72e5804428dee274cf2ac0bcd", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x06d3a30cbb00660b85a30988d197b1c282c6dcb6", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x276cdba3a39abf9cedba0f1948312c0681e6d5fd", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x9e3bb2cd5a89fcc4b826230b144c4917881bea85", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x4e2757e46103556f98d4d036d8efe18389b89f51", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0xcd5bd47d3d1d8412b241ce9015c5032142948c12", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0xbda23b750dd04f792ad365b5f2a6f1d8593796f2", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0xa27cef8af2b6575903b676e5644657fae96f491f", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0xe983845a04c681a295dd9ce1fa8c2c8505932da3", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x3f482c72a2b3e777746f5755cc0ff1323ea2ad16", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0xd266529641eeffaa2b2a0bc99daa5b32ef241078", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x0ff9491b236a36cc183823e39d7532194143fdb1", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x0475dd0e4194422a8cac486dc69173f535d0baf4", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0xdb0ed345cb52c2f2457918afa3eb4b682e264ad0", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0xf7c63e75b90c60d7b343106a39658f8b3ca6e4d2", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x6667a4b7eff4a0b86781fb3b187622cd3c257f09", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x793aa889e19a130ee4cb8b63c79aa3bdccc663cb", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x728d92a8023bfbe0d4f3fdd549ed3b4996a0eba9", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x56fd42ecd77c88bdd959be54af10d1759b473dff", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0xeb196a61f9a1e35bf5053b65aaa57c5541dcba86", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0xc5267f13b9b4ba7bb73bdd53a2a3c944733a2961", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x9938ee74ba7a5c1abcd157272a18fcfc9ec9e8d5", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x06324bad3913cb69cb5e748a3ed72f9d692324bb", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x7d4a2c448fe5b07c62228140417b3565bbe1b86b", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0xf02e3c0095f6de36c76364d4cc53eb06d1288fc1", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x8ad740adce08f2f3579884eac0a12e581304ac3b", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x7926c83479e2708edfd83a39d62084693e192298", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x4d619eb6db0b9b6184d9881c4828c0effff84eda", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0xc0d01a27fd89e6bbc68f43e94ade3dfca2c27674", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x80335e658ee73756bb8220bdb77f99e98322035f", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0xe7c8fdd899ab06ac1023e8a3e867c5fa7e751450", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0xc6724cf116573eab588fb0d73dcdc16929493cea", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x9ce5a8098270f07a0a56398febda76a8ee2858c4", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x9d65bf1bce7a10814228f4d81d8cf99a6b0f44aa", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x19abcd6b8516d2b4d9aa3bbf700b38a30dc154fc", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x6ededbad1e864105fa2538ddfbf4e7214b9e6529", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x7a93539c1bf9a96f87044925deb7a0849266213e", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x11b113383ce08e84001dc614f141ae4c27221e31", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0xfe908731af54c56dfd63948f18ce5878a3b8a1ad", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0xd19d3341227967610b94e7aebe8c971d2d48f419", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x611f7bf868a6212f871e89f7e44684045ddfb09d", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0xd03e6a53a3298ba1cd9b0dbf525ad728f4f8ad6e", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0xfa13971666d0e6f2715d68eb44bb7964fc22b14b", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0xddf81e81ab956695600d8639356c045e5c8a8c94", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x3e7d48c8ae2e50c2b9adedc8e276d3cc92b39458", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x1e43e7a911b1b0229ea7d64e11ae260c482a0870", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x86aee064cc073d0dc95ba86633067b2c615040bb", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0xce9abe75d561f065f1c4adb188b260df9de32ca7", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x3b9694465483cbb677b700a91c26f487193a6e03", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x6d29fc1267b1691c0cd43a8d35b27135957ffea9", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x7c7061221666e41b87ca5817cfa2fcac09b3d943", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x08af9c4767236221c55069dd523e2f7a0013e898", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x739768219c831ec1f747bf904f0e25c2d99c7dc1", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0xe3bb282457ce7b3be31f0441f3fc051b9fc6a9c3", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x3bb00393bfa5e76b7f31e93948f7d3cef12942ad", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0xf7b17e0b2478ad21ac594e4b0954ece63d059064", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x1811068091a2459ee38a8dde52cce5b2acfc1b61", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0xc18475f347cc757b3cc49025820248a5f27d97ce", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0xd99d81949146b4c13a4a42c9a6addbbd2db932ad", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x400d8280acf364f683e989462879fd8dd358067d", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x5ca38fb7cf2b587026a1650f0d2b0a13c41f5d0f", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0xd5f8c864f21824daf3a4b22d9c33693642ed7634", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x26704ccfcd45b5780dcd58d38b12f5e0cdb481a0", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x3b98b9e9cb75c1cb1729aab8f09ced2936505e4f", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x8167a1ebf00ff5886d1b5908419bb1159d8cf6a4", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x7fea5b4568751533039179116e372e26b6b41b13", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x0c48511102453352fe570370672cd556bf0e63f9", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x445f16314284b43dfa1fd3cd77b9dea4a1bebd97", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x073f564419b625a45d8aea3bb0de4d5647113ad7", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x0003b5aa5e30e97fcc596bb5d0f3a75255e08d4e", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x87d0d6c8cdd71a658ecf1566f13e4cbc562beaf9", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0xd7f4a5613b38cb8c09229b7aed99803242fdf0a0", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0xea3b7dac6b96502a04c701d5e71b51912f70143f", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x1dfc6bec8499fcb5e3151c7c6d27feb9d7eae1d4", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x85dcd76d4fbd3aa0c85c27b9441222c19a14134b", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x3d2335cac7b31411467ef03168c5869452fb7e86", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x608c27519c5e65a61cfc1d2c9e658e5c57a2e3d7", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x767a905b77b0a40801488c6af8b8b5992b43511c", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x3425519651e4c42833633fe5c0e24ed89c1023a3", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x173810f8ca9c4c631aeb1d6c36d007f054fee980", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x45f329ff834a84fccea2319f91e1993540b22a2a", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0xcee27e2fa3675248ecbf53f67fd59e71fa82c8cd", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x41836676f779c4188499c301df67aa9a0510fd6f", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0xebf6c883a1d60ab38c8ed4780aadbfe4c805ed4f", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x72ec2e073324960a4ec15758bab80f9ffd53f903", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0xbb3c6d28def21b6297016622a57a0b05015e3ad2", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0xe11eb181b936b47e37b8e5bd2e65c79bd71ce86f", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0xcff6efc78928d873f9c30251decefaf2ad92fbed", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x9c22a4039f269e72de6b029b273be059cdbb831c", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0xcf3061b9e65f1f84d0839bb54d79a471eed7b11a", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x1db92e2eebc8e0c075a02bea49a2935bcd2dfcf4", "Bybit", "bybit", BYBIT_POR), // added 2026-10-14, verified in official PoR data
    row("0xbaed383ede0e5d9d72430661f3285daa77e9439f", "Bybit", "bybit", BYBIT_POR), // added 2026-10-14, verified in official PoR data
    row("0xa16f524a804beaed0d791de0aa0b5836295a2a84", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x62383739d68dd0f844103db8dfb05a7eded5bbe6", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("0x89b59726f9c42c350641182536bb045b9c6a36ca", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
  ]),
  btc: Object.freeze([
    row("34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo", "Binance", "binance", BINANCE_POR),
    row("12VuUfQHTGqWDvBzm8TBad1mZBm4hjGEzN", "Binance", "binance", BINANCE_POR),
    row("1DEuKerATHWRfyB14s6QCt4LPkfCTx4zaW", "Binance", "binance", BINANCE_POR),
    row("1KuPikhUYtHz3fmSQ2UvotpUuN672NuEcm", "Binance", "binance", BINANCE_POR),
    row("1PJiGp2yDLvUgqeBsuZVCBADArNsk6XEiw", "Binance", "binance", BINANCE_POR),
    row("1PPWMe42cywnM61nVatkmiggwdRQYLiCyS", "Binance", "binance", BINANCE_POR),
    row("1Pzaqw98PeRfyHypfqyEgg5yycJRsENrE7", "Binance", "binance", BINANCE_POR),
    row("31jUs8yQNVc9p6YuUPctWCkdhH7u8UiUba", "Binance", "binance", BINANCE_POR),
    row("32BgTv3NSYbMsBTwDbNNN2GKZPCTJSkqDv", "Binance", "binance", BINANCE_POR),
    row("32KqbtrRVxC6GLUJgJhVQtFTaCdq4GrgBb", "Binance", "binance", BINANCE_POR),
    row("1CY7fykRLWXeSbKB885Kr4KjQxmDdvW923", "OKX", "okx", OKX_POR),
    row("bc1qxe6nlda4y4h6ekj7jm9klr6vn6h9pmy8pn6yzycceqzj08532z4qxxrlza", "OKX", "okx", OKX_POR),
    row("16rF2zwSJ9goQ9fZfYoti5LsUqqegb5RnA", "OKX", "okx", OKX_POR),
    row("1FY6RL8Ju9b6CGsHTK68yYEcnzUasufyCe", "OKX", "okx", OKX_POR),
    row("1BsdDaJtgFZrLfzEXvh6cD4VhtHHSHhMea", "OKX", "okx", OKX_POR),
    row("178E8tYZ5WJ6PpADdpmmZd67Se7uPhJCLX", "OKX", "okx", OKX_POR),
    row("1Lj2mCPJYbbC2X6oYwV6sXnE8CZ4heK5UD", "OKX", "okx", OKX_POR),
    row("bc1q88zfnu6wjqqpxyaksmc3mcgakwaqt7z68tkw0jx87gdn25fhfkuqy23psm", "OKX", "okx", OKX_POR),
    row("bc1q2tmtz7fje4qh3prfa3hjmghnh7c9fsyndlzf96w5rycw55jyxwnshqpgtd", "OKX", "okx", OKX_POR),
    row("1LnoZawVFFQihU8d8ntxLMpYheZUfyeVAK", "OKX", "okx", OKX_POR),
    row("bc1q2qqqt87kh33s0er58akh7v9cwjgd83z5smh9rp", "Bybit", "bybit", BYBIT_POR),
    row("1GrwDkr33gT6LuumniYjKEGjTLhsL5kmqC", "Bybit", "bybit", BYBIT_POR),
    row("bc1qs5vdqkusz4v7qac8ynx0vt9jrekwuupx2fl5udp9jql3sr03z3gsr2mf0f", "Bybit", "bybit", BYBIT_POR),
    row("16jVbMCcqq1deKrMB3esL2HPso7kvqUsec", "Bybit", "bybit", BYBIT_POR),
    row("bc1qa2eu6p5rl9255e3xz7fcgm6snn4wl5kdfh7zpt05qp5fad9dmsys0qjg0e", "Bybit", "bybit", BYBIT_POR),
    row("139RYdfv7vNtbnK88juMR3s4pgwvB4db9Y", "Bybit", "bybit", BYBIT_POR),
    row("1Ko6Sbu8VgZaQNZMfRgNjR8zVzVN9wL7aX", "Bybit", "bybit", BYBIT_POR),
    row("1LrsskS2hmLvevKiqASDymS8xRmJ7Gp83u", "Bybit", "bybit", BYBIT_POR),
    row("14ug9BVtGnxY8ezvd5cr1PXHeXBYXkpsdw", "Bybit", "bybit", BYBIT_POR),
    row("12rFmDggwCNrRL6vuPEjzCDSskTRPjDajP", "Bybit", "bybit", BYBIT_POR),
    row("32bhzEniykYRFADVaRM5PYswsjC23cxtes", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("32z4XkTCBMp4QfcoobxaXtJkWngyHqGjHp", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("33TDwJRsFJbtSEwkXGwtJkj3Ey3Gman3TV", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("34HpHYiyQwg69gFmCq2BGHjF1DZnZnBeBP", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("34ryUknRsda7w9yXqzjLhgRPZLPV43rpsd", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("36BddqksxL9RctZ8D8aFxKRFEbqPnEiDc6", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("36oiSkAi1VVuUpfdv8E2V5fZ2EarHRJpis", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("36yB51gULVXXnvyWmvAoCVjq6igZUiHf3y", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("378GLcve92X2Q4UrCyoMFDL5k5QrzeG7JN", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("395vnFScKQ1ay695C6v7gf89UzoFpx3WuJ", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("39884E3j6KZj82FK4vcCrkUvWYL5MQaS3v", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("39CnKMu9KWvFAabLJ5BYghVfSqHgC2VShe", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("3AQ8bAh88TQU7JV1H3ovXrwsuV6s3zYZuN", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("3AeUiDpPPUrUBS377584sFCpx8KLfpX9Ry", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("3AtnehKDkFPC1bKvdrEVPSRGCtxQH8F1R8", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("3BzYxZXkdpkrFTWzKkWGRoWXJMuN2Ko621", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("3CySuFKbBS29M7rE5iJakZRNqb3msMeFoN", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("3E97AjYaCq9QYnfFMtBCYiCEsN956Rvpj2", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("3EVVc8e2rxwUuERtdJCduWig8DnpsUqyA6", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("3F1ZmTDAv6q3xrnT3tpm55DkCDzxhstU2Z", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("3F9CGMu7JSJnMHA8jFM2KgxuH6hhxtvENP", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("3FHNBLobJnbCTFTVakh5TXmEneyf5PT61B", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("3FJ9hQuRtzy7pCqKHjeBGRDcY3fJbhHYXD", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("3GdMytxx7d2b5ERwWmQttBWtKJmS8bjGj9", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("3HdGoUTbcztBnS7UzY4vSPYhwr424CiWAA", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("3HkPQSi1xso1Zh1EeqLjkMpura63fr5HRn", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("3HkgC2R5PhqyXy6RVFyemvxN1VuFbQiQ5V", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("3JFJPpH8Chwo7CDbyYQ4XcfgcjEP1FGRMJ", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("3JqPhvKkAPcFB3oLELBT7z2tQdjpnxuDi9", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("3KRduELtTmxBtqYpZviPysXoJDxdtdxFLZ", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("3Kyo49ThRZPMukuYqPgqPejYeUpHvkA1EM", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("3LQUu4v9z6KNch71j7kbj8GPeAGUo1FW6a", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("3LcgLHzTvjLKBixBvkKGiadtiw2GBSKKqH", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("3M219KR5vEneNb47ewrPfWyb5jQ2DjxRP6", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("3M3EtJGx5Dy9nCATLDhyRCrKGc38QC9z2e", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("3NPL82eaehTFh4r3StpHqVQBTnZJFaGsyy", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("3NXCvmLGz9SxYi6TnjbBQfQMcwiZ1iQETa", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("3NjHh71XgjikBoTNYdWgXiNeZcLaKNThgb", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("3Nm3c4gqVmvCmeP1sYvDchbb1r4QMu6emn", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("3PXBET2GrTwCamkeDzKCx8DeGDyrbuGKoc", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("3Q6ZCgJ3e4shasccLHen1VNUpReZTsjmsR", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("3QK5vQ9hucSg8ZC8Vizq83qEWeHFLAWMud", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("bc1p7x4aaws8t8cmmccu39kun6cajglx6ntuta7lhyxjt2cwrw4k89zqn0wley", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("bc1q32lyrhp9zpww22phqjwwmelta0c8a5q990ghs6", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("bc1q5n5dy7jgqhmpnmx44d3780qefzaphjreds0z9y", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("bc1q5qvs2dzzydqt4ygfn0k0ertjnv8ctytgcdz7l0", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("bc1q5rsc4uscnmemlwru8xsys26k3xgxewqfnf3k7j", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("bc1q78ufzeu8w8fwvxuphrdlg446xhyptf28fkatu5", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("bc1q7t9fxfaakmtk8pj7tdxjvwsng6y9x76czuaf5h", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("bc1q9n7j6a5wwru6tad9xrlncnagresvyjt96pl3en", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("bc1qdtmav38lca8yu3rrcknnqx5242cckgxqws7m72", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("bc1qm34lsc65zpw79lxes69zkqmk6ee3ewf0j77s3h", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("bc1qq393eyjh8hdjvcchy0mxquhh9wx8h3kzlkchfs", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("bc1qquax5zzensg9mkejdgq3q3h76v34cug96zk0f6", "Binance", "binance", BINANCE_POR), // added 2026-10-14, verified in official PoR data
    row("14kHu26yWkVD8qAnBfcFXHXxgquNoSpKum", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("1DnHx95d2t5URq2SYvVk6kxGryvTEbTnTs", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("15Exz1BAVan4Eweagy1rcPJnfyc6KJ4GvL", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("18QUDxjDZAqAJorr4jkSEWHUDGLBF9uRCc", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("1M6E6vPaYsuCb34mDNS2aepu2aJyL6xBG4", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("1CE8chGD6Nu8qjcDF2uR1wMKyoWb8Kyxwz", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("13jTtHxBPFwZkaCdm6BwJMMJkqvTpBZccw", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("1FfgXrQUjX5nQ4zsiLBWjvFwW61jQHCqn", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("1DVTB9YKi4KNjyEbAHPp17T8R1Pp17nSmA", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("3KbDzhb8B5pUU7Wk1y26J8D4cxYLmxJsca", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("3A8tCFwWyHQey1npTAWYTtrjLPKLXpSpLd", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("3AWGaggM87Nnhit5DwYYfXyvzW1NYutCw2", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("31qq3eDdNyvyoDGrNYAAN5GU2BagDNANFf", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("3BdEq8vnX1o1J4Zpwj6wkPh5FxrgxLAibr", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("3PDMVx1YRhySaPEtCV2AT1aEq9DwgPU4uq", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("3MYrRpUhNWxB8Ydk9gvMou5yZNtXNynxcT", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("3DWvnsbAJJTLufQ4AhQY7LsVQrKoLjEHXQ", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("39ZEaLMDxWi5EWx9cQ2W3ixDP8rWHhz8GY", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("3PHu7Z1dtRYbeum2SNWFCA4Fmq8r3UeXdQ", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("3NXxvFdsXK8DPRuGKbhNsvtP5FoL1s6hzF", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("3Jg623UZuqvvFLYbBsqqYiBCAyWUQUDG8k", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("3HoEwvrqYRnrizFN7gTg5ouSbV3Tek9pab", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("3FMAKm9fEXfNXYtb6qBGaJvG3DRKtvPy5E", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("3JJ4LULa6VtcVVxZC9tsNN9JM693mcrCeE", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("3LkDsn4LZgYnMqZF2wAXCVs6kc72xpNLLz", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("3BexyYLsJQuN96qDRsnrU9yACnUSxxjWXx", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("3JwZq9s3yBhi8FikgYu2RvhjyBAhnSiLgy", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("3JqzTCvFxye7nrVWGTBH2CNqZ7bbFppBww", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("3FbmQz3WvASHgCQUz3C2JmGdkd1gQFLdC2", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("3FMrfjg6zD3CTXSHLAiRcn3RFyBR8MMFR9", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("3KeFqqpbJawWvAudsi4q8Zx9Lewponyyht", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("39smXTQdqD2W767ipLishHV4diSV4xNFxA", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("392Bq5jWV8NWUTdV59VCqoYviY5KP9q9Ee", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("3K376tvxysV4XDtTTEUF47Xc8LHdjof6kR", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("3DUGtYyorAm9vhpo3KbMURMiR2CByP6BoM", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("bc1qpkgxexfg8ah0j0ffk3ge3d4para29r8ugx02ch7daja3s8u4247qw2d2jq", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("3BnCzXEqQi7VDMfCaGY9zbSySuy5uQUaRp", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("3C766rkZjRvmvhGmyGeH2x33ciUrZHarvE", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("3Ca537VX1HufiVRfKVogWcD85RV3iuFs53", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("3BxyyKih6788xBQKk8aMg1cD3qP1x7Gqgr", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("3Bvj92ASRnTnqj9kdABSgXJgrBDy6XEgzq", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("bc1qeymqdnsgk0vyefrjxy60pathtjamfamsdc5eqd2un63tf3k7k5ks6ayj9w", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("bc1qe4wh2v669c6vrhxunjagwm5ar8tspkujk9ef6m0xsqz8tk8t68hs43uamj", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("bc1q8ad2qzkg2g6wrydeqjuwrg0ft5ktu69fzky8m2jzu9g6a5tq6c2qpp685j", "OKX", "okx", OKX_POR), // added 2026-10-14, verified in official PoR data
    row("1KHch51TT2eazxYkUXtr38GXtPTjf8Mue", "Bybit", "bybit", BYBIT_POR), // added 2026-10-14, verified in official PoR data
    row("12XZMdaAGmcHf4ocFSqpd8jFd1WH7RHUPs", "Bybit", "bybit", BYBIT_POR), // added 2026-10-14, verified in official PoR data
    row("1DLeNApsHNNzUMNZJVoXeyEY5sdp8vzx3w", "Bybit", "bybit", BYBIT_POR), // added 2026-10-14, verified in official PoR data
    row("1HDnsptgeJ6fYFHCgd1TFzLSRpuVcV51GL", "Bybit", "bybit", BYBIT_POR), // added 2026-10-14, verified in official PoR data
    row("1Nb9NUVWpjruzafXh2uKK5v5xxEEL1hPrH", "Bybit", "bybit", BYBIT_POR), // added 2026-10-14, verified in official PoR data
  ]),
});
