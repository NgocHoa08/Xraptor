import imageMap from '../../src_image_map.json';

export const img = (hash) => imageMap[hash] || '';

export const BRAND = {
  logo: img('3060d3d7f69eca7440d69c2b192ee40dd5440f12'),
  dathongbao: img('f701f07060d2ad00d069f671b754ca32f8a9b461'),
  newsletterBanner: img('9189c2fb4120b01878ec7f67bd5953c918a6b228'),
  heroSlides: [
    img('8d338a9ca345c2ba15f009afabc42bfeab3bd6dc'),
    img('be0d453b00c6fcab0a4e8ab7f40f87b4a8d7d538'),
    img('1e5411a463d68bc0419d28c2ff5052846a13d810'),
  ],
  aboutBannerBg: img('1e5411a463d68bc0419d28c2ff5052846a13d810'),
  aboutBannerGradient: img('91a656533ff8ebdc62eb706cc2ef3bc8c224858b'),
  aboutBannerPaddles: img('e9f99482a2b95a18160bfd328280131969353216'),
  categoryHero: img('af0593ccc72ba56c133a74f9344d3fab128e6435'),
  productHero: img('1d1bba08d2652a557bb645224d9d65cb96bd4fee'),
  contactHero: img('03cbad22e4fed792ddcd54174966af2a62aecbb6'),
};

export const WHY_CHOOSE_US = [
  {
    id: 'quality',
    title: 'Chất lượng quốc tế',
    desc: 'Vợt được thiết kế bằng công nghệ tiên tiến, nhẹ – bền – kiểm soát bóng tối ưu.',
    icon: 'award',
  },
  {
    id: 'variety',
    title: 'Đa dạng lựa chọn',
    desc: 'Nhiều mẫu mã, phù hợp mọi lối chơi từ kiểm soát đến sức mạnh.',
    icon: 'layers',
  },
  {
    id: 'service',
    title: 'Dịch vụ tận tâm',
    desc: 'Hỗ trợ tư vấn chọn vợt, bảo hành uy tín, giao hàng nhanh chóng.',
    icon: 'headphones',
  },
  {
    id: 'community',
    title: 'Cộng đồng Pickleball',
    desc: 'Chúng tôi đồng hành cùng các CLB, sự kiện và giải đấu để phát triển phong trào.',
    icon: 'users',
  },
];

export const CATEGORIES = [
  {
    id: 'vot',
    label: 'Vợt',
    filterKey: 'Vợt Pickleball',
    image: img('faf3ea20d9053550f5c7bc8e6e8902083f83a694'),
  },
  {
    id: 'bong',
    label: 'Bóng',
    filterKey: 'Bóng Pickleball',
    image: img('5c438f96b062387f04cfb2d232fcbbd14e1c1ee8'),
  },
  {
    id: 'giay',
    label: 'Giày',
    filterKey: 'Giày Pickleball',
    image: img('e603c7061c4684586782d6fcb4fcafd6aec6bf52'),
  },
  {
    id: 'luoi',
    label: 'Lưới',
    filterKey: 'Lưới Pickleball',
    image: img('dfd10a0c794941f0eeabfd752edcbb062a2b7d17'),
  },
];

export const FEATURED_PADDLES = [
  {
    id: 'p-1',
    sku: 'XR-1983-16',
    name: 'Vợt Pickleball Sport Series 2025 – Colorful Collection 2.0 (16mm)',
    price: 4000000,
    oldPrice: 5000000,
    category: 'Vợt Pickleball',
    subCategory: 'Xraptor 1983 16mm',
    image: img('3db3b4233fb0bd29b17662234eca7da02baf1b08'),
    gallery: [
      img('3db3b4233fb0bd29b17662234eca7da02baf1b08'),
      img('69048bebe44aabb7bdc652d86b0a50134592f17d'),
      img('1fdb7da87719c0c9bf997f66fa3523010d0707b1'),
      img('470781437c7680e236ed10876780949f9111b5d0'),
      img('eebbe065490161e91aa5084f9074f600fb0615df'),
      img('0e32b4141a7d0ea7846eface6e36ee13de96446d'),
    ],
  },
  {
    id: 'p-2',
    sku: 'XR-1983-14',
    name: 'Vợt Pickleball Xraptor 1983 14mm',
    price: 4000000,
    oldPrice: 5000000,
    category: 'Vợt Pickleball',
    subCategory: 'Xraptor 1983 14mm',
    image: img('3db3b4233fb0bd29b17662234eca7da02baf1b08'),
    defaultHoverDemo: true,
    gallery: [
      img('69048bebe44aabb7bdc652d86b0a50134592f17d'),
      img('3db3b4233fb0bd29b17662234eca7da02baf1b08'),
      img('1fdb7da87719c0c9bf997f66fa3523010d0707b1'),
      img('470781437c7680e236ed10876780949f9111b5d0'),
      img('eebbe065490161e91aa5084f9074f600fb0615df'),
      img('ee0fed0b80fbd60af491580e1aa47ac436a6f425'),
    ],
  },
  {
    id: 'p-3',
    sku: 'XR-30-16',
    name: 'Vợt Pickleball Sport Series 2025 – Colorful Collection 2.0 (16mm)',
    price: 4000000,
    oldPrice: 5000000,
    category: 'Vợt Pickleball',
    subCategory: 'Xraptor 3.0 16mm',
    image: img('69048bebe44aabb7bdc652d86b0a50134592f17d'),
  },
  {
    id: 'p-4',
    sku: 'XR-30-14',
    name: 'Vợt Pickleball Sport Series 2025 – Colorful Collection 2.0 (16mm)',
    price: 4000000,
    oldPrice: 5000000,
    category: 'Vợt Pickleball',
    subCategory: 'Xraptor 3.0 14mm',
    image: img('1fdb7da87719c0c9bf997f66fa3523010d0707b1'),
  },
  {
    id: 'p-5',
    sku: 'XR-20-16',
    name: 'Vợt Pickleball Sport Series 2025 – Colorful Collection 2.0 (16mm)',
    price: 4000000,
    oldPrice: 5000000,
    category: 'Vợt Pickleball',
    subCategory: 'Xraptor 2.0 16mm',
    image: img('470781437c7680e236ed10876780949f9111b5d0'),
  },
  {
    id: 'p-6',
    sku: 'XR-KEV-16',
    name: 'Vợt Pickleball Sport Series 2025 – Colorful Collection 2.0 (16mm)',
    price: 4000000,
    oldPrice: 5000000,
    category: 'Vợt Pickleball',
    subCategory: 'Kevlar',
    image: img('eebbe065490161e91aa5084f9074f600fb0615df'),
  },
  {
    id: 'p-7',
    sku: 'XR-F22-6',
    name: 'Vợt Pickleball Sport Series 2025 – Colorful Collection 2.0 (16mm)',
    price: 4000000,
    oldPrice: 5000000,
    category: 'Vợt Pickleball',
    subCategory: 'F22 6mm',
    image: img('0e32b4141a7d0ea7846eface6e36ee13de96446d'),
  },
  {
    id: 'p-8',
    sku: 'XR-PRO-16',
    name: 'Vợt Pickleball Sport Series 2025 – Colorful Collection 2.0 (16mm)',
    price: 4000000,
    oldPrice: 5000000,
    category: 'Vợt Pickleball',
    subCategory: 'Xraptor 1983 16mm',
    image: img('ee0fed0b80fbd60af491580e1aa47ac436a6f425'),
  },
];

export const BALL_PROMO = img('be07c900e619ab9af00217775a83b3b01083e292');
export const BALL_PRODUCTS = [
  { id: 'b-1', sku: 'XR-B01', name: 'Bóng Pickleball cao cấp', price: 250000, oldPrice: 320000, category: 'Bóng Pickleball', image: img('f195c5d4eb3e95269bce8b9097890c78b35b6361') },
  { id: 'b-2', sku: 'XR-B02', name: 'Bóng Pickleball luyện tập', price: 180000, oldPrice: 240000, category: 'Bóng Pickleball', image: img('d73fec73c38fbf289c920c7ae560ec92d3ba8c0b') },
  { id: 'b-3', sku: 'XR-B03', name: 'Bóng Pickleball cao cấp', price: 250000, oldPrice: 320000, category: 'Bóng Pickleball', image: img('8262d9d55f0614c388c27dd39fc968993f018fac') },
  { id: 'b-4', sku: 'XR-B04', name: 'Bóng Pickleball luyện tập', price: 180000, oldPrice: 240000, category: 'Bóng Pickleball', image: img('d6d128426298ad7030b16e665e4e2705868ddbd9') },
  { id: 'b-5', sku: 'XR-B05', name: 'Bóng Pickleball cao cấp', price: 250000, oldPrice: 320000, category: 'Bóng Pickleball', image: img('f7e5a50432e91930132da3b98ba9a1601a50b3c5') },
  { id: 'b-6', sku: 'XR-B06', name: 'Bóng Pickleball luyện tập', price: 180000, oldPrice: 240000, category: 'Bóng Pickleball', image: img('470c6ca2c9c0d694b45e2cc9e34383e7f069fdec') },
];

export const SHOE_PROMO = img('40d9b1981c60f78a46f5d117a581d6a5043d70e6');
export const SHOE_PRODUCTS = [
  { id: 's-1', sku: 'XR-S01', name: 'Giày chơi Pickleball nhẹ và bền', price: 1850000, oldPrice: 2200000, category: 'Giày Pickleball', image: img('707a471c69a1cbdb0b71ca087fc427761fe71071') },
  { id: 's-2', sku: 'XR-S02', name: 'Giày chơi Pickleball Sport Series 2025 – Colorful', price: 1950000, oldPrice: 2400000, category: 'Giày Pickleball', image: img('1757316bbb591b56da34876f6a67603fefe03828') },
  { id: 's-3', sku: 'XR-S03', name: 'Giày chơi Pickleball thời trang nữ cao cấp', price: 2100000, oldPrice: 2600000, category: 'Giày Pickleball', image: img('bcb10927b26c40262aafd006f84776b5f4427781') },
  { id: 's-4', sku: 'XR-S04', name: 'Giày chơi Pickleball thời trang nam cao cấp', price: 2150000, oldPrice: 2650000, category: 'Giày Pickleball', image: img('bdbc74e475d65b06329ef55bfd8ab3504cfd7fd5') },
  { id: 's-5', sku: 'XR-S05', name: 'Giày chơi Pickleball Sport Series 2025 – Colorful', price: 1950000, oldPrice: 2400000, category: 'Giày Pickleball', image: img('b91dd6557c3e0725fdeed498b8e137acf394e621') },
  { id: 's-6', sku: 'XR-S06', name: 'Giày chơi Pickleball Sport Series 2025 – Colorful', price: 1950000, oldPrice: 2400000, category: 'Giày Pickleball', image: img('eb57569eae129b047c97abbdba0a791af4297034') },
];

export const NET_PROMO = img('31a42db6ddb7639d4c87a654a27637830ad32536');
export const NET_PRODUCTS = [
  { id: 'n-1', sku: 'XR-N01', name: 'Lưới Pickleball Sport Series 2025', price: 3200000, oldPrice: 3800000, category: 'Lưới Pickleball', image: img('ed941b8af4bfef5f75aeb4b918018f4a7382aae2') },
  { id: 'n-2', sku: 'XR-N02', name: 'Lưới Pickleball Sport Series 2025', price: 3200000, oldPrice: 3800000, category: 'Lưới Pickleball', image: img('3def02a4236ec38cfbf9d5175d71386f47908c3d') },
  { id: 'n-3', sku: 'XR-N03', name: 'Lưới Pickleball Sport Series 2025', price: 3200000, oldPrice: 3800000, category: 'Lưới Pickleball', image: img('673701e222e4294a2ae87609af4d4c18f0e85b40') },
  { id: 'n-4', sku: 'XR-N04', name: 'Lưới Pickleball Sport Series 2025', price: 3200000, oldPrice: 3800000, category: 'Lưới Pickleball', image: img('a7ed53bd300c6cfd688ad9e28e240b4265b78097') },
  { id: 'n-5', sku: 'XR-N05', name: 'Lưới Pickleball Sport Series 2025', price: 3200000, oldPrice: 3800000, category: 'Lưới Pickleball', image: img('2c7be1ae56ba9152fccce6482ea316436e3628a0') },
  { id: 'n-6', sku: 'XR-N06', name: 'Lưới Pickleball Sport Series 2025', price: 3200000, oldPrice: 3800000, category: 'Lưới Pickleball', image: img('957d66367ec7cfd2c493052d23e0ec2209042712') },
];

export const CATEGORY_PAGE_PRODUCTS = [
  { id: 'c-1', sku: 'XR-B03', name: 'Bóng Pickleball cao cấp', price: 250000, oldPrice: 320000, category: 'Bóng Pickleball', image: img('8262d9d55f0614c388c27dd39fc968993f018fac') },
  { id: 'c-2', sku: 'XR-B04', name: 'Bóng Pickleball luyện tập', price: 180000, oldPrice: 240000, category: 'Bóng Pickleball', image: img('d6d128426298ad7030b16e665e4e2705868ddbd9') },
  { id: 'c-3', sku: 'XR-B05', name: 'Bóng Pickleball cao cấp', price: 250000, oldPrice: 320000, category: 'Bóng Pickleball', image: img('f7e5a50432e91930132da3b98ba9a1601a50b3c5') },
  { id: 'c-4', sku: 'XR-B01', name: 'Bóng Pickleball cao cấp', price: 250000, oldPrice: 320000, category: 'Bóng Pickleball', image: img('f195c5d4eb3e95269bce8b9097890c78b35b6361') },
  { id: 'c-5', sku: 'XR-B02', name: 'Bóng Pickleball luyện tập', price: 180000, oldPrice: 240000, category: 'Bóng Pickleball', image: img('d73fec73c38fbf289c920c7ae560ec92d3ba8c0b') },
  { id: 'c-6', sku: 'XR-B06', name: 'Bóng Pickleball cao cấp', price: 250000, oldPrice: 320000, category: 'Bóng Pickleball', image: img('470c6ca2c9c0d694b45e2cc9e34383e7f069fdec') },
  { id: 'c-7', sku: 'XR-S01', name: 'Giày chơi Pickleball nhẹ và bền', price: 1850000, oldPrice: 2200000, category: 'Giày Pickleball', image: img('707a471c69a1cbdb0b71ca087fc427761fe71071') },
  { id: 'c-8', sku: 'XR-S06', name: 'Giày chơi Pickleball thời trang nữ cao cấp', price: 2100000, oldPrice: 2600000, category: 'Giày Pickleball', image: img('eb57569eae129b047c97abbdba0a791af4297034') },
  { id: 'c-9', sku: 'XR-S07', name: 'Giày chơi Pickleball thời trang nam cao cấp', price: 2150000, oldPrice: 2650000, category: 'Giày Pickleball', image: img('3ce84847e456fccedd053e256ccd6d8f9487ed95') },
  { id: 'c-10', sku: 'XR-N01', name: 'Lưới Pickleball Sport Series 2025', price: 3200000, oldPrice: 3800000, category: 'Lưới Pickleball', image: img('ed941b8af4bfef5f75aeb4b918018f4a7382aae2') },
  { id: 'c-11', sku: 'XR-N03', name: 'Lưới Pickleball Sport Series 2025', price: 3200000, oldPrice: 3800000, category: 'Lưới Pickleball', image: img('673701e222e4294a2ae87609af4d4c18f0e85b40') },
  { id: 'c-12', sku: 'XR-N07', name: 'Lưới Pickleball Sport Series 2025', price: 3200000, oldPrice: 3800000, category: 'Lưới Pickleball', image: img('bf11164631f9c5bdf0e2950c0a9f60f9fc6c4139') },
];

export const ALL_PRODUCTS = [
  ...FEATURED_PADDLES,
  ...BALL_PRODUCTS,
  ...SHOE_PRODUCTS,
  ...NET_PRODUCTS,
  ...CATEGORY_PAGE_PRODUCTS.filter((p) => !['c-1','c-2','c-3','c-4','c-5','c-6','c-7','c-10','c-11'].includes(p.id)),
];

export const TESTIMONIALS = [
  {
    id: 't-1',
    quote: 'Chất liệu cao cấp, thiết kế tinh tế, chơi lâu không mỏi.',
    name: 'Anh Nam',
    location: 'TP Hồ Chí Minh',
    avatar: img('9b13007baec869fed7eb0c1e462dc2309867d245'),
  },
  {
    id: 't-2',
    quote: 'Vợt thời trang, vừa đẹp vừa mạnh mẽ.',
    name: 'Chị Doanh',
    location: 'Cầu Giấy, Hà Nội',
    avatar: img('3c1d7aef318808d830a7ee7ab8061f118a4d820d'),
  },
  {
    id: 't-3',
    quote: 'Trọng lượng vừa phải, dễ kiểm soát từng cú đánh.',
    name: 'Anh Phú Quý',
    location: 'TP Hồ Chí Minh',
    avatar: img('dfe2b2d723c12dc48adc31d560b5eff844c99401'),
  },
];

export const VIDEO_REVIEWS = [
  { id: 'v-1', image: img('9b13007baec869fed7eb0c1e462dc2309867d245'), title: 'Trải nghiệm vợt Xraptor 1983 16mm' },
  { id: 'v-2', image: img('3c1d7aef318808d830a7ee7ab8061f118a4d820d'), title: 'Review Pickleball Sport Series 2025' },
  { id: 'v-3', image: img('02afb1d051a24751e7b518fbb0e5299aa393f61c'), title: 'Kỹ thuật giao bóng chuẩn thi đấu' },
  { id: 'v-4', image: img('d9eab251bb7937f16f1da6d23924bf0f61626aeb'), title: 'Cộng đồng Pickleball Xraptor' },
];

export const BLOG_POSTS = [
  {
    id: 'blog-1',
    tag: 'Tin tức',
    date: '17 tháng 3, 2025',
    title: 'Lorem ipsum dolor sit amet, consectetur adipisci elit, sed eiusmod tempor',
    image: img('fecfc0c2e45e07ea4bd8021688d59e3d681ca6aa'),
  },
  {
    id: 'blog-2',
    tag: 'Tin tức',
    date: '17 tháng 3, 2025',
    title: 'Lorem ipsum dolor sit amet, consectetur adipisci elit, sed eiusmod tempor',
    image: img('5e1af1538ca0a8b737ff80b6cd0d4392d3e9a1a0'),
  },
  {
    id: 'blog-3',
    tag: 'Tin tức',
    date: '17 tháng 3, 2025',
    title: 'Lorem ipsum dolor sit amet, consectetur adipisci elit, sed eiusmod tempor',
    image: img('91aa53858649d494dba37bf6bbc906c425261614'),
  },
];

export const SIDEBAR_FILTERS = {
  paddles: [
    'Xraptor 1983 16mm',
    'Xraptor 1983 14mm',
    'Xraptor 3.0 14mm',
    'Xraptor 3.0 16mm',
    'Xraptor 2.0 16mm',
    'F22 6mm',
    'Kevlar',
  ],
  accessories: [
    'Bóng Pickleball',
    'Giày Pickleball',
    'Lưới Pickleball',
  ],
};

export function formatVND(amount) {
  return amount.toLocaleString('vi-VN') + ' đ';
}
