USE Beautify;

-- 1. Update Brand 1 to Malka Zai
UPDATE brands 
SET name = 'Malka Zai', 
    description = 'Royal handcrafted fine jewellery', 
    logo_url = '/malka-zai-brand.png',
    updated_at = NOW()
WHERE id = 1;

-- 2. Update Categories to match jewellery categories
UPDATE categories SET name = 'Necklaces', description = 'Royal necklaces, chokers, and diamond-studded emerald sets.', image_url = '/cat-necklaces.jpg', updated_at = NOW() WHERE id = 1;
UPDATE categories SET name = 'Earrings', description = 'Traditional Kundan jhumkas, chandeliers, and studs.', image_url = '/cat-earrings.jpg', updated_at = NOW() WHERE id = 2;
UPDATE categories SET name = 'Rings', description = 'Solitaires, cocktail rings, and emerald vintage bands.', image_url = '/cat-rings.jpg', updated_at = NOW() WHERE id = 3;
UPDATE categories SET name = 'Bangles', description = 'Handcrafted 22K antique gold and diamond bangles.', image_url = '/cat-bangles.jpg', updated_at = NOW() WHERE id = 4;
UPDATE categories SET name = 'Bracelets', description = 'Classic tennis bracelets and delicate cuffs.', image_url = '/cat-bracelets.jpg', updated_at = NOW() WHERE id = 5;

-- 3. Update existing 7 products to match Malka Zai items
-- Product 1: Royal Emerald Necklace Set (Category: Necklaces -> id 1)
UPDATE products 
SET name = 'Royal Emerald Necklace Set',
    slug = 'royal-emerald-necklace-set',
    sku = 'MZ-NECK-01',
    category_id = 1,
    brand_id = 1,
    price = 60000.00,
    discount_price = 48000.00,
    image_url = '/products/jewels/royal-emerald-necklace.jpg',
    short_description = 'Handcrafted 22K gold emerald necklace set with matching earrings.',
    description = 'An opulent royal necklace crafted in 22K yellow gold adorned with Zambian emeralds and uncut polki diamonds, paired with matching drop chandelier earrings.',
    stock_quantity = 12,
    low_stock_threshold = 2,
    active = 1,
    featured = 1,
    ingredients = '22K Yellow Gold, Natural Emeralds, Certified Diamonds',
    benefits = 'Hallmarked 916 Gold, Certified Gemstones, Royal Heritage Craftsmanship',
    how_to_use = 'Store in custom velvet jewel box. Clean gently with soft microfibre cloth.',
    size = 'Adjustable 16-18 inches',
    shade = 'Emerald & Gold',
    skin_type = 'All skin tones',
    updated_at = NOW()
WHERE id = 1;

-- Product 2: Traditional Kundan Jhumka (Category: Earrings -> id 2)
UPDATE products 
SET name = 'Traditional Kundan Jhumka',
    slug = 'traditional-kundan-jhumka',
    sku = 'MZ-EARR-02',
    category_id = 2,
    brand_id = 1,
    price = 30000.00,
    discount_price = 25500.00,
    image_url = '/products/jewels/traditional-kundan-jhumka.jpg',
    short_description = 'Traditional antique gold Kundan jhumkas adorned with emerald drops and pearls.',
    description = 'Exquisite heirloom Kundan jhumkas featuring delicate floral filigree, emerald teardrops, and fresh water pearls crafted in 22K antique gold finish.',
    stock_quantity = 15,
    low_stock_threshold = 3,
    active = 1,
    featured = 1,
    ingredients = '22K Antique Gold, Kundan Meenakari, Natural Pearls',
    benefits = 'Lightweight hollow bells, Secure screw back, Traditional Indian craftsmanship',
    how_to_use = 'Wear with traditional bridal or festive attire.',
    size = '2.8 inches drop',
    shade = 'Antique Gold & Emerald',
    skin_type = 'Hypoallergenic',
    updated_at = NOW()
WHERE id = 2;

-- Product 3: Vintage Emerald Ring (Category: Rings -> id 3)
UPDATE products 
SET name = 'Vintage Emerald Ring',
    slug = 'vintage-emerald-ring',
    sku = 'MZ-RING-03',
    category_id = 3,
    brand_id = 1,
    price = 50000.00,
    discount_price = 37500.00,
    image_url = '/products/jewels/vintage-emerald-ring.jpg',
    short_description = 'Intricately designed vintage gold ring crowned with an oval royal emerald.',
    description = 'A statement cocktail ring in 18K yellow gold, featuring a certified 3.5 carat natural oval emerald enclosed in an ornate floral diamond halo.',
    stock_quantity = 10,
    low_stock_threshold = 2,
    active = 1,
    featured = 1,
    ingredients = '18K Yellow Gold, 3.5ct Natural Emerald, VS-SI Diamonds',
    benefits = 'Comfort fit inner band, Conflict-free diamonds, Certified gemstone authenticity',
    how_to_use = 'Perfect for cocktail soirees and special celebrations.',
    size = 'US Size 7 (Resizing complimentary)',
    shade = 'Deep Emerald Green',
    skin_type = 'Nickel-safe',
    updated_at = NOW()
WHERE id = 3;

-- Product 4: Designer Gold Bangles (Category: Bangles -> id 4)
UPDATE products 
SET name = 'Designer Gold Bangles',
    slug = 'designer-gold-bangles',
    sku = 'MZ-BANG-04',
    category_id = 4,
    brand_id = 1,
    price = 40000.00,
    discount_price = 32800.00,
    image_url = '/products/jewels/designer-gold-bangles.jpg',
    short_description = 'Pair of 22K hallmarked floral designer gold bangles with diamond accents.',
    description = 'A majestic set of two openable kadas adorned with intricate jali latticework, floral ruby-emerald rosettes, and sparkling pavé diamonds.',
    stock_quantity = 8,
    low_stock_threshold = 2,
    active = 1,
    featured = 1,
    ingredients = '22K Hallmarked Gold, Synthetic Rubies, Emerald accents',
    benefits = 'Side safety clasp with hinge, 100% BIS Hallmarked, Timeless heirloom piece',
    how_to_use = 'Slide onto wrist and secure with side hinge lock.',
    size = 'Standard 2.6 (Medium)',
    shade = 'Lustrous Gold',
    skin_type = 'All skin tones',
    updated_at = NOW()
WHERE id = 4;

-- Product 5: Diamond Tennis Bracelet (Category: Bracelets -> id 5)
UPDATE products 
SET name = 'Diamond Tennis Bracelet',
    slug = 'diamond-tennis-bracelet',
    sku = 'MZ-BRAC-05',
    category_id = 5,
    brand_id = 1,
    price = 38000.00,
    discount_price = 29900.00,
    image_url = '/products/jewels/diamond-tennis-bracelet.jpg',
    short_description = 'Brilliant cut round diamonds set in handcrafted 18K white gold tennis bracelet.',
    description = 'A timeless 7-inch tennis bracelet featuring 48 precision-set round brilliant cut diamonds totaling 2.5 carats in seamless four-prong 18K white gold baskets.',
    stock_quantity = 6,
    low_stock_threshold = 1,
    active = 1,
    featured = 1,
    ingredients = '18K White Gold, 2.50 Ctw Round Brilliant Diamonds (F-G, VS)',
    benefits = 'Double safety lock, High-flex articulative links, Everyday royal luxury',
    how_to_use = 'Fasten box clasp and fold down dual safety latches.',
    size = '7 inches',
    shade = 'Sparkling White Gold',
    skin_type = 'Hypoallergenic',
    updated_at = NOW()
WHERE id = 5;

-- Product 6: Graceful Pendant Necklace (Category: Necklaces -> id 1)
UPDATE products 
SET name = 'Graceful Pendant Necklace',
    slug = 'graceful-pendant-necklace',
    sku = 'MZ-NECK-06',
    category_id = 1,
    brand_id = 1,
    price = 25000.00,
    discount_price = 21000.00,
    image_url = '/products/jewels/graceful-pendant-necklace.jpg',
    short_description = 'Delicate gold chain holding a teardrop emerald encased in sparkling diamonds.',
    description = 'An understated luxury piece featuring an exquisite pear-cut Colombian emerald pendant suspended from an 18K solid yellow gold Singapore twist chain.',
    stock_quantity = 14,
    low_stock_threshold = 3,
    active = 1,
    featured = 1,
    ingredients = '18K Yellow Gold, 1.8ct Pear Cut Emerald, Round Diamonds',
    benefits = 'Adjustable chain loop, Everyday luxury elegance, Certified hallmarked',
    how_to_use = 'Wear solo or layered with gold collar necklaces.',
    size = '18 inch chain with 2 inch extender',
    shade = 'Emerald & Gold',
    skin_type = 'All skin tones',
    updated_at = NOW()
WHERE id = 6;

-- Product 7: Classic Green Stud Earrings (Category: Earrings -> id 2)
UPDATE products 
SET name = 'Classic Green Stud Earrings',
    slug = 'classic-green-stud-earrings',
    sku = 'MZ-EARR-07',
    category_id = 2,
    brand_id = 1,
    price = 23000.00,
    discount_price = 18500.00,
    image_url = '/products/jewels/classic-green-studs.jpg',
    short_description = 'Timeless green gemstone studs bordered with round brilliant diamonds.',
    description = 'Minimalist royal studs designed with round faceted emerald centerpieces encircled by a halo of micro-pave natural diamonds in 18K white gold.',
    stock_quantity = 18,
    low_stock_threshold = 4,
    active = 1,
    featured = 1,
    ingredients = '18K White Gold, Natural Round Emeralds, Micro-pavé Diamonds',
    benefits = 'Secure butterfly push back, Day-to-night versatility, Premium brilliance',
    how_to_use = 'Secure into earlobe piercings using provided 18K push-backs.',
    size = '9mm diameter',
    shade = 'Vibrant Green & White Gold',
    skin_type = 'Hypoallergenic',
    updated_at = NOW()
WHERE id = 7;

-- Product 8: Floral Diamond Ring (Category: Rings -> id 3)
INSERT INTO products (id, name, slug, sku, category_id, brand_id, price, discount_price, image_url, short_description, description, stock_quantity, low_stock_threshold, active, featured, ingredients, benefits, how_to_use, size, shade, skin_type, created_at, updated_at)
VALUES (8, 'Floral Diamond Ring', 'floral-diamond-ring', 'MZ-RING-08', 3, 1, 35000.00, 27800.00, '/products/jewels/floral-diamond-ring.jpg', 'Exquisite blooming floral motif diamond ring in lustrous yellow gold.', 'A showstopping blossom cocktail ring with multi-tiered petal filigree in 22K yellow gold holding a cluster of brilliant round center diamonds.', 9, 2, 1, 1, '22K Yellow Gold, 1.2 Ctw Natural Diamonds', 'Architectural floral filigree, Handcrafted bezel borders, Hallmarked purity', 'Wear on index or middle finger for maximum regal presence.', 'US Size 6.5', 'Yellow Gold', 'All skin tones', NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    slug = VALUES(slug),
    sku = VALUES(sku),
    category_id = VALUES(category_id),
    brand_id = VALUES(brand_id),
    price = VALUES(price),
    discount_price = VALUES(discount_price),
    image_url = VALUES(image_url),
    short_description = VALUES(short_description),
    description = VALUES(description),
    stock_quantity = VALUES(stock_quantity),
    low_stock_threshold = VALUES(low_stock_threshold),
    active = VALUES(active),
    featured = VALUES(featured),
    ingredients = VALUES(ingredients),
    benefits = VALUES(benefits),
    how_to_use = VALUES(how_to_use),
    size = VALUES(size),
    shade = VALUES(shade),
    skin_type = VALUES(skin_type),
    updated_at = NOW();
