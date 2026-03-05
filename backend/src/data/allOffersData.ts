/**
 * Promotional Offers
 * Static dataset of seasonal deals from Norwegian grocery stores.
 * Used for priority boosting in product ranking and homepage trending display.
 */

export interface PromotionalOffer {
    product_name: string;
    product_name_en: string;
    discount_type: 'percentage' | 'fixed_price' | 'multi_buy';
    discount_percent?: number;
    discount_value?: string;
    final_price?: number;
    currency?: string;
    unit_info?: string;
    unit?: string;
    notes?: string;
    brand?: string;
    chain: string;
    category: string; // New field for search accuracy
    additional_cost?: string;
    validity?: string;
}

// --- Batch 1: Grocery & Food Offers ---
const batch1Offers: PromotionalOffer[] = [
    { product_name: "Selected small bakery items (Plukk & Miks)", product_name_en: "Selected small bakery items (Pick & Mix)", chain: "Bunpris", category: "Bakery", discount_type: "multi_buy", discount_value: "3 for 30 NOK", final_price: 30, currency: "NOK", notes: "Includes gourmet roundstykke, focaccia, etc." },
    { product_name: "Drikkeyoghurt Jordbær", product_name_en: "Drinking Yoghurt Strawberry", chain: "Bunpris", category: "Dairy", discount_type: "percentage", discount_percent: 30, unit_info: "100g / 4-pack" },
    { product_name: "Nidar Storplater (Stratos, Crispo, Smash etc.)", product_name_en: "Nidar Large Chocolate Bars (Stratos, Crispo, Smash etc.)", chain: "Bunpris", category: "Snacks", discount_type: "percentage", discount_percent: 30, brand: "Nidar", unit_info: "From 150g per bar" },
    { product_name: "Selected nuts (Den Lille Nøttefabrikken)", product_name_en: "Selected nuts (Den Lille Nøttefabrikken)", chain: "Bunpris", category: "Snacks", discount_type: "percentage", discount_percent: 30 },
    { product_name: "Munkholm Radler Sitron", product_name_en: "Munkholm Radler Lemon", chain: "Bunpris", category: "Beverages", discount_type: "fixed_price", final_price: 60, currency: "NOK", additional_cost: "pant" },
    { product_name: "Sandwich (various)", product_name_en: "Sandwich (various)", chain: "Bunpris", category: "Ready Meals", discount_type: "fixed_price", final_price: 10, currency: "NOK" },
    { product_name: "BE-KIND bars (Choco nuts, sea salt, caramel almond)", product_name_en: "BE-KIND bars (Choco nuts, sea salt, caramel almond)", chain: "Bunpris", category: "Snacks", discount_type: "fixed_price", final_price: 15, currency: "NOK" },
    { product_name: "Fjordland Byggrynsgrøt (selected flavors)", product_name_en: "Fjordland Barley Porridge (selected flavors)", chain: "Bunpris", category: "Ready Meals", discount_type: "fixed_price", final_price: 15, currency: "NOK" },
    { product_name: "Vestlandslefsa", product_name_en: "Vestlandslefsa", chain: "Bunpris", category: "Bakery", discount_type: "fixed_price", final_price: 20, currency: "NOK" },
    { product_name: "Pølsebrød Hurra", product_name_en: "Hot Dog Buns Hurra", chain: "Bunpris", category: "Bakery", discount_type: "fixed_price", final_price: 25, currency: "NOK" },
    { product_name: "Burgerbrød Hurra", product_name_en: "Burger Buns Hurra", chain: "Bunpris", category: "Bakery", discount_type: "fixed_price", final_price: 30, currency: "NOK" },
    { product_name: "Kvikk Lunsj Biter", product_name_en: "Kvikk Lunsj Pieces", chain: "Bunpris", category: "Snacks", discount_type: "fixed_price", final_price: 39, currency: "NOK" },
    { product_name: "Dried Mango / Fresh Mango pieces", product_name_en: "Dried Mango / Fresh Mango pieces", chain: "Bunpris", category: "Fruits", discount_type: "fixed_price", final_price: 39, currency: "NOK" },
    { product_name: "Tropical Mango", product_name_en: "Tropical Mango", chain: "Bunpris", category: "Fruits", discount_type: "fixed_price", final_price: 29, currency: "NOK" },
    { product_name: "Danonino Yoghurt Vanilje", product_name_en: "Danonino Yoghurt Vanilla", chain: "Bunpris", category: "Dairy", discount_type: "percentage", discount_percent: 30 },
    { product_name: "Selected TINE sliced cheese", product_name_en: "Selected TINE sliced cheese", chain: "Bunpris", category: "Dairy", discount_type: "multi_buy", discount_value: "3 for 2" },
    { product_name: "Bacon Original", product_name_en: "Bacon Original", chain: "Bunpris", category: "Meat", discount_type: "fixed_price", final_price: 30, currency: "NOK" },
    { product_name: "Ritz Kjeks Original", product_name_en: "Ritz Crackers Original", chain: "Bunpris", category: "Snacks", discount_type: "fixed_price", final_price: 20, currency: "NOK" },
    { product_name: "TINE Yoghurt (selected flavors)", product_name_en: "TINE Yoghurt (selected flavors)", chain: "Bunpris", category: "Dairy", discount_type: "fixed_price", final_price: 20, currency: "NOK" },
    { product_name: "Spekeskinke families", product_name_en: "Cured Ham family pack", chain: "Bunpris", category: "Meat", discount_type: "fixed_price", final_price: 35, currency: "NOK" },
    { product_name: "Granola Jordbær", product_name_en: "Granola Strawberry", chain: "Bunpris", category: "Breakfast", discount_type: "fixed_price", final_price: 40, currency: "NOK" },
    { product_name: "Friele Instant Gull", product_name_en: "Friele Instant Gold", chain: "Bunpris", category: "Pantry", discount_type: "fixed_price", final_price: 45, currency: "NOK" },
    { product_name: "Selected Mills Salater", product_name_en: "Selected Mills Salads", chain: "Bunpris", category: "Pantry", discount_type: "percentage", discount_percent: 30 },
    { product_name: "Suniva juice (apple, orange, tropical)", product_name_en: "Suniva juice (apple, orange, tropical)", chain: "Bunpris", category: "Beverages", discount_type: "percentage", discount_percent: 30 },
    { product_name: "Solsikkebrød", product_name_en: "Sunflower Bread", chain: "Bunpris", category: "Bakery", discount_type: "fixed_price", final_price: 30, currency: "NOK" },
    { product_name: "Monster Energy 0.5L", product_name_en: "Monster Energy 0.5L", chain: "Bunpris", category: "Beverages", discount_type: "multi_buy", discount_value: "2 for 35 NOK + pant" },
    { product_name: "Kyllingfilet (Prior family pack)", product_name_en: "Chicken Fillet (Prior family pack)", chain: "Bunpris", category: "Meat", discount_type: "fixed_price", final_price: 119, currency: "NOK" },
    { product_name: "All Tex Mex (Old El Paso)", product_name_en: "All Tex Mex (Old El Paso)", chain: "Bunpris", category: "Pantry", discount_type: "percentage", discount_percent: 40 },
    { product_name: "Toro Gryter (selected)", product_name_en: "Toro Stews (selected)", chain: "Bunpris", category: "Pantry", discount_type: "fixed_price", final_price: 20, currency: "NOK" },
    { product_name: "Gilde Kjøttboller", product_name_en: "Gilde Meatballs", chain: "Bunpris", category: "Meat", discount_type: "fixed_price", final_price: 59, currency: "NOK" },
    { product_name: "Coca Cola / Fanta / Sprite 1.5L", product_name_en: "Coca Cola / Fanta / Sprite 1.5L", chain: "Bunpris", category: "Beverages", discount_type: "fixed_price", final_price: 20, currency: "NOK", additional_cost: "pant" },
    { product_name: "Big One Pizza (selected)", product_name_en: "Big One Pizza (selected)", chain: "Bunpris", category: "Ready Meals", discount_type: "percentage", discount_percent: 40 },
    { product_name: "Blomkål", product_name_en: "Cauliflower", chain: "Bunpris", category: "Vegetables", discount_type: "fixed_price", final_price: 20, currency: "NOK" },
    { product_name: "Smågodt", product_name_en: "Pick and Mix Candy", chain: "Bunpris", category: "Snacks", discount_type: "fixed_price", final_price: 9.9, currency: "NOK", unit: "per hg" },
    { product_name: "Selected nuggets / ready meals", product_name_en: "Selected nuggets / ready meals", chain: "Bunpris", category: "Ready Meals", discount_type: "percentage", discount_percent: 30 },
    { product_name: "Glutenfrie produkter Schär", product_name_en: "Gluten-free products Schär", chain: "Bunpris", category: "Pantry", discount_type: "percentage", discount_percent: 30 },
    { product_name: "Kron-is / Hennig Olsen ice cream", product_name_en: "Kron-is / Hennig Olsen ice cream", chain: "Bunpris", category: "Snacks", discount_type: "percentage", discount_percent: 30 },
];

// --- Batch 2: Household, Snacks & Non-Food Offers ---
const batch2Offers: PromotionalOffer[] = [
    { product_name: "Utvalgte OMO, Milo, Blenda og Comfort", product_name_en: "Selected OMO, Milo, Blenda and Comfort (Laundry)", chain: "Bunpris", category: "Household", discount_type: "percentage", discount_percent: 40, unit_info: "From 100 ml" },
    { product_name: "Tomater", product_name_en: "Tomatoes", chain: "Bunpris", category: "Vegetables", discount_type: "fixed_price", final_price: 39, currency: "NOK", unit: "per kg" },
    { product_name: "Kvikk Lunsj 6-pk (6 x 47g)", product_name_en: "Kvikk Lunsj 6-pack (6 x 47g)", chain: "Bunpris", category: "Snacks", discount_type: "fixed_price", final_price: 59, currency: "NOK", unit_info: "6-pack" },
    { product_name: "Barnemat på glass (Nestlé)", product_name_en: "Baby Food Jars (Nestlé)", chain: "Bunpris", category: "Baby", discount_type: "multi_buy", discount_value: "3 for 2" },
    { product_name: "Utvalgte kapsler (Evergood, Friele, Città d'Italia)", product_name_en: "Selected Coffee Capsules (Evergood, Friele, Città d'Italia)", chain: "Bunpris", category: "Pantry", discount_type: "multi_buy", discount_value: "3 for 2" },
    { product_name: "Red Bull Regular 250 ml 4-pk", product_name_en: "Red Bull Regular 250 ml 4-pack", chain: "Bunpris", category: "Beverages", discount_type: "fixed_price", final_price: 64.9, currency: "NOK", additional_cost: "pant" },
    { product_name: "Pepsi Max og Solo Super 0.33L 10-pk", product_name_en: "Pepsi Max and Solo Super 0.33L 10-pack", chain: "Bunpris", category: "Beverages", discount_type: "fixed_price", final_price: 99, currency: "NOK", additional_cost: "pant" },
    { product_name: "Urge, Coca-Cola og Fanta 0.33L 6-pk", product_name_en: "Urge, Coca-Cola and Fanta 0.33L 6-pack", chain: "Bunpris", category: "Beverages", discount_type: "fixed_price", final_price: 39.9, currency: "NOK", additional_cost: "pant" },
    { product_name: "Lambi toalettpapir 8-pk", product_name_en: "Lambi Toilet Paper 8-pack", chain: "Bunpris", category: "Household", discount_type: "fixed_price", final_price: 49.9, currency: "NOK" },
    { product_name: "Sunsilk shampoo, balsam og roll-on Bright Blossom", product_name_en: "Sunsilk shampoo, conditioner and roll-on Bright Blossom", chain: "Bunpris", category: "Personal Care", discount_type: "multi_buy", discount_value: "3 for 2" },
    { product_name: "Jordan tannbørster", product_name_en: "Jordan Toothbrushes", chain: "Bunpris", category: "Personal Care", discount_type: "multi_buy", discount_value: "3 for 2" },
    { product_name: "Utvalgte Solidox tannkremer", product_name_en: "Selected Solidox Toothpastes", chain: "Bunpris", category: "Personal Care", discount_type: "multi_buy", discount_value: "3 for 2" },
    { product_name: "Sterilan roll-on 50 ml", product_name_en: "Sterilan roll-on 50 ml", chain: "Bunpris", category: "Personal Care", discount_type: "multi_buy", discount_value: "3 for 2" },
    { product_name: "Sokker fra Pierre Robert", product_name_en: "Socks from Pierre Robert", chain: "Bunpris", category: "Clothing", discount_type: "multi_buy", discount_value: "3 for 2" },
    { product_name: "LilleGo bleier og våtservietter", product_name_en: "LilleGo Diapers and Wet Wipes", chain: "Bunpris", category: "Baby", discount_type: "multi_buy", discount_value: "3 for 2" },
    { product_name: "Utvalgte Pedigree-produkter", product_name_en: "Selected Pedigree products", chain: "Bunpris", category: "Pets", discount_type: "multi_buy", discount_value: "3 for 2" },
    { product_name: "Latz menybokser til katt", product_name_en: "Latz Cat Food Menu Boxes", chain: "Bunpris", category: "Pets", discount_type: "fixed_price", final_price: 59.9, currency: "NOK" },
    { product_name: "Smågodt (helgekupp)", product_name_en: "Pick and Mix Candy (Weekend Deal)", chain: "Bunpris", category: "Snacks", discount_type: "fixed_price", final_price: 9.9, currency: "NOK", unit: "per hg", validity: "Thursday–Saturday" },
    { product_name: "Micropopcorn saltet", product_name_en: "Microwave Popcorn Salted", chain: "Bunpris", category: "Snacks", discount_type: "fixed_price", final_price: 20, currency: "NOK" },
    { product_name: "Donuts (choco, white, sugar)", product_name_en: "Donuts (choco, white, sugar)", chain: "Bunpris", category: "Bakery", discount_type: "multi_buy", discount_value: "2 for 25 NOK" },
    { product_name: "Cookies milk choco", product_name_en: "Cookies milk choco", chain: "Bunpris", category: "Snacks", discount_type: "fixed_price", final_price: 30, currency: "NOK" },
    { product_name: "Godt & Blandet Original / Super / Juicy Giant", product_name_en: "Godt & Blandet Original / Super / Juicy Giant", chain: "Bunpris", category: "Snacks", discount_type: "percentage", discount_percent: 30 },
    { product_name: "Sørlandschips (selected varieties)", product_name_en: "Sørlandschips (Crisps) (selected varieties)", chain: "Bunpris", category: "Snacks", discount_type: "percentage", discount_percent: 30 },
    { product_name: "Knatter (cola, skogsbær, sigemenn)", product_name_en: "Knatter (Candy) (cola, skogsbær, sigemenn)", chain: "Bunpris", category: "Snacks", discount_type: "percentage", discount_percent: 30 },
    { product_name: "Kims potetsticks og French Fries", product_name_en: "Kims Potato Sticks and French Fries", chain: "Bunpris", category: "Snacks", discount_type: "percentage", discount_percent: 30 },
    { product_name: "Utvalgte produkter fra Maarud", product_name_en: "Selected products from Maarud (Snacks)", chain: "Bunpris", category: "Snacks", discount_type: "fixed_price", final_price: 30, currency: "NOK" },
    { product_name: "Faxe Kondi Original og Appelsin 0.33L 6-pk", product_name_en: "Faxe Kondi Soda Original and Orange 0.33L 6-pack", chain: "Bunpris", category: "Beverages", discount_type: "fixed_price", final_price: 30, currency: "NOK", additional_cost: "pant" },
    { product_name: "Extra Sweetmint og Eucalyptus", product_name_en: "Extra Sweetmint Gum and Eucalyptus", chain: "Bunpris", category: "Snacks", discount_type: "fixed_price", final_price: 39, currency: "NOK" },
    { product_name: "Cheez Doodles 450g", product_name_en: "Cheez Doodles 450g", chain: "Bunpris", category: "Snacks", discount_type: "fixed_price", final_price: 69, currency: "NOK" },
    { product_name: "Kinder Maxi 18 stk", product_name_en: "Kinder Maxi 18 pcs", chain: "Bunpris", category: "Snacks", discount_type: "fixed_price", final_price: 79, currency: "NOK" },
    { product_name: "Peanøtter Original XXL", product_name_en: "Peanuts Original XXL", chain: "Bunpris", category: "Snacks", discount_type: "fixed_price", final_price: 49, currency: "NOK" },
    { product_name: "Mars, Snickers og Twix (10-pk)", product_name_en: "Mars, Snickers and Twix (10-pack)", chain: "Bunpris", category: "Snacks", discount_type: "fixed_price", final_price: 99, currency: "NOK" },
    { product_name: "Kinder Bueno 430g", product_name_en: "Kinder Bueno 430g", chain: "Bunpris", category: "Snacks", discount_type: "fixed_price", final_price: 99, currency: "NOK" },
];

// --- Batch 3: COOP Marked Offers ---
const batch3Offers: PromotionalOffer[] = [
    { product_name: "Coop Hakkede Tomater 390g", product_name_en: "Coop Chopped Tomatoes 390g", chain: "COOP Marked", category: "Pantry", discount_type: "multi_buy", discount_value: "2 for 25 NOK", currency: "NOK" },
    { product_name: "Coop Dogz Paté 300g", product_name_en: "Coop Dogz Paté 300g", chain: "COOP Marked", category: "Pets", discount_type: "multi_buy", discount_value: "2 for 25 NOK", currency: "NOK" },
    { product_name: "Coop Pasta 500g", product_name_en: "Coop Pasta 500g", chain: "COOP Marked", category: "Pantry", discount_type: "multi_buy", discount_value: "2 for 30 NOK", currency: "NOK" },
    { product_name: "Coop Sprø Pommes Frites 450g", product_name_en: "Coop Crispy French Fries 450g", chain: "COOP Marked", category: "Ready Meals", discount_type: "multi_buy", discount_value: "2 for 60 NOK", currency: "NOK" },
    { product_name: "Coop Steinovnspizza 340g", product_name_en: "Coop Stone Oven Pizza 340g", chain: "COOP Marked", category: "Ready Meals", discount_type: "multi_buy", discount_value: "2 for 70 NOK", currency: "NOK" },
    { product_name: "Coop Baconterninger 200g", product_name_en: "Coop Bacon Cubes 200g", chain: "COOP Marked", category: "Meat", discount_type: "multi_buy", discount_value: "2 for 80 NOK", currency: "NOK" },
    { product_name: "Gilde Skinnfri Kjøttpølse 450g", product_name_en: "Gilde Skinless Meat Sausage 450g", chain: "COOP Marked", category: "Meat", discount_type: "multi_buy", discount_value: "2 for 70 NOK", currency: "NOK" },
    { product_name: "Freia Store Plater/Poser 150–200g", product_name_en: "Freia Large Bars/Bags 150–200g", chain: "COOP Marked", category: "Snacks", discount_type: "multi_buy", discount_value: "2 for 80 NOK", currency: "NOK", brand: "Freia" },
    { product_name: "Mat i Farta (Tine selected)", product_name_en: "Mat i Farta (Tine selected)", chain: "COOP Marked", category: "Dairy", discount_type: "multi_buy", discount_value: "2 for 20 NOK", currency: "NOK", brand: "Tine" },
    { product_name: "Jarlsberg 700g", product_name_en: "Jarlsberg 700g", chain: "COOP Marked", category: "Dairy", discount_type: "fixed_price", final_price: 99.9, currency: "NOK" },
    { product_name: "Diplom-Is på boks 1–1.2L", product_name_en: "Diplom-Is Tub 1–1.2L", chain: "COOP Marked", category: "Snacks", discount_type: "fixed_price", final_price: 49.9, currency: "NOK" },
    { product_name: "Coop Partymix 250g", product_name_en: "Coop Partymix 250g", chain: "COOP Marked", category: "Snacks", discount_type: "multi_buy", discount_value: "2 for 70 NOK", currency: "NOK" },
    { product_name: "Coop Seigmenn 300g", product_name_en: "Coop Jelly Men 300g", chain: "COOP Marked", category: "Snacks", discount_type: "multi_buy", discount_value: "2 for 60 NOK", currency: "NOK" },
    { product_name: "Coop Choco Lenses 189g", product_name_en: "Coop Choco Lenses 189g", chain: "COOP Marked", category: "Snacks", discount_type: "multi_buy", discount_value: "2 for 70 NOK", currency: "NOK" },
    { product_name: "Coop Chilinøtter 200g", product_name_en: "Coop Chili Nuts 200g", chain: "COOP Marked", category: "Snacks", discount_type: "multi_buy", discount_value: "2 for 55 NOK", currency: "NOK" },
    { product_name: "Coop Dagens Middager", product_name_en: "Coop Today's Dinners", chain: "COOP Marked", category: "Ready Meals", discount_type: "percentage", discount_percent: 25 },
    { product_name: "Coop Nakkekoteletter", product_name_en: "Coop Pork Neck Chops", chain: "COOP Marked", category: "Meat", discount_type: "fixed_price", final_price: 99.9, currency: "NOK", unit: "per kg" },
    { product_name: "Sopps Spaghetti 500g", product_name_en: "Sopps Spaghetti 500g", chain: "COOP Marked", category: "Pantry", discount_type: "fixed_price", final_price: 14.9, currency: "NOK" },
    { product_name: "Tine Lettrømme 300g", product_name_en: "Tine Light Sour Cream 300g", chain: "COOP Marked", category: "Dairy", discount_type: "fixed_price", final_price: 19.9, currency: "NOK", brand: "Tine" },
    { product_name: "Stabburet Leverpostei 100g", product_name_en: "Stabburet Liver Paté 100g", chain: "COOP Marked", category: "Pantry", discount_type: "fixed_price", final_price: 9.9, currency: "NOK" },
    { product_name: "Friele Kaffe (selected 20-pk / 250g)", product_name_en: "Friele Coffee (selected 20-pk / 250g)", chain: "COOP Marked", category: "Pantry", discount_type: "fixed_price", final_price: 49.9, currency: "NOK", brand: "Friele" },
    { product_name: "Libero Bleier (Coop member offer)", product_name_en: "Libero Diapers (Coop member offer)", chain: "COOP Marked", category: "Baby", discount_type: "percentage", discount_percent: 50, notes: "Coop member only" },
    { product_name: "Coop Smågodt (Friday only)", product_name_en: "Coop Pick and Mix Candy (Friday only)", chain: "COOP Marked", category: "Snacks", discount_type: "fixed_price", final_price: 12, currency: "NOK", unit: "per hg", validity: "Friday" },
    { product_name: "Pære", product_name_en: "Pear", chain: "COOP Marked", category: "Fruits", discount_type: "fixed_price", final_price: 24.9, currency: "NOK", unit: "per kg" },
    { product_name: "Kiwi", product_name_en: "Kiwi", chain: "COOP Marked", category: "Fruits", discount_type: "multi_buy", discount_value: "2 for 10 NOK", currency: "NOK" },
    { product_name: "Norske Poteter (løsvekt)", product_name_en: "Norwegian Potatoes (bulk)", chain: "COOP Marked", category: "Vegetables", discount_type: "fixed_price", final_price: 14.9, currency: "NOK", unit: "per kg" }
];

// --- Batch 4: Joker Offers ---
const batch4Offers: PromotionalOffer[] = [
    { product_name: "Eldorado Mix & Match", product_name_en: "Eldorado Mix & Match", chain: "Joker", category: "Pantry", discount_type: "multi_buy", discount_value: "3 for 2", notes: "All Eldorado products (selected assortment)" },
    { product_name: "Tilbehør Discount (Saritas, Toro, etc.)", product_name_en: "Sides Discount (Saritas, Toro, etc.)", chain: "Joker", category: "Pantry", discount_type: "percentage", discount_percent: 30 },
    { product_name: "Big Juicy Burger", product_name_en: "Big Juicy Burger", chain: "Joker", category: "Meat", discount_type: "fixed_price", final_price: 69.9, currency: "NOK", brand: "Folkets", unit_info: "2x180g" },
    { product_name: "Big Beef Burger", product_name_en: "Big Beef Burger", chain: "Joker", category: "Meat", discount_type: "fixed_price", final_price: 69.9, currency: "NOK", brand: "Folkets", unit_info: "2x180g" },
    { product_name: "Biff Stroganoff", product_name_en: "Beef Stroganoff", chain: "Joker", category: "Ready Meals", discount_type: "fixed_price", final_price: 69.9, currency: "NOK", brand: "Fersk & Ferdig", unit_info: "480g" },
    { product_name: "Kyllingfilet Strimler", product_name_en: "Chicken Fillet Strips", chain: "Joker", category: "Meat", discount_type: "fixed_price", final_price: 69.9, currency: "NOK", brand: "Prior", unit_info: "400g" },
    { product_name: "Fiskekaker Hjerte", product_name_en: "Fish Cakes Heart", chain: "Joker", category: "Meat", discount_type: "fixed_price", final_price: 69.9, currency: "NOK", brand: "Fiskemannen", unit_info: "960g" },
    { product_name: "Svin Ytrefilet", product_name_en: "Pork Loin", chain: "Joker", category: "Meat", discount_type: "fixed_price", final_price: 69.9, currency: "NOK", brand: "Gilde", unit_info: "400g" },
    { product_name: "Kyllingkjøttdeig", product_name_en: "Minced Chicken", chain: "Joker", category: "Meat", discount_type: "percentage", discount_percent: 40, brand: "Prior", unit_info: "400g" },
    { product_name: "Karbonadedeig", product_name_en: "Minced Meat", chain: "Joker", category: "Meat", discount_type: "percentage", discount_percent: 40, brand: "Folkets", unit_info: "400g" },
    { product_name: "Findus Ferdigretter", product_name_en: "Findus Ready Meals", chain: "Joker", category: "Ready Meals", discount_type: "fixed_price", final_price: 59.9, currency: "NOK", brand: "Findus", unit_info: "540g–600g" },
    { product_name: "Barilla pasta / pesto / sauce", product_name_en: "Barilla pasta / pesto / sauce", chain: "Joker", category: "Pantry", discount_type: "percentage", discount_percent: 30, brand: "Barilla" },
    { product_name: "Synnøve Gulost bit", product_name_en: "Synnøve Cheese block", chain: "Joker", category: "Dairy", discount_type: "percentage", discount_percent: 40, brand: "Synnøve", unit_info: "480g / 800g" },
    { product_name: "Rugsprø / Husman", product_name_en: "Crispbread", chain: "Joker", category: "Bakery", discount_type: "multi_buy", discount_value: "Ukens 10", brand: "Wasa", unit_info: "200g / 260g" },
    { product_name: "Gulrot", product_name_en: "Carrot", chain: "Joker", category: "Vegetables", discount_type: "fixed_price", final_price: 16.9, currency: "NOK", brand: "Gartner", unit_info: "750g" },
    { product_name: "Epler og Pærer", product_name_en: "Apples and Pears", chain: "Joker", category: "Fruits", discount_type: "fixed_price", final_price: 24.9, currency: "NOK", unit: "per kg" },
    { product_name: "Paprika", product_name_en: "Bell Pepper", chain: "Joker", category: "Vegetables", discount_type: "fixed_price", final_price: 29.9, currency: "NOK", brand: "Season", unit_info: "300g" },
    { product_name: "Klementiner", product_name_en: "Clementines", chain: "Joker", category: "Fruits", discount_type: "fixed_price", final_price: 39.9, currency: "NOK", brand: "Cevita", unit: "per kg" },
    { product_name: "Grovt Brød", product_name_en: "Wholemeal Bread", chain: "Joker", category: "Bakery", discount_type: "fixed_price", final_price: 29.9, currency: "NOK", brand: "Bakehuset", unit_info: "750g" },
    { product_name: "Salami / Spekeskinke", product_name_en: "Salami / Cured Ham", chain: "Joker", category: "Meat", discount_type: "fixed_price", final_price: 29.9, currency: "NOK", brand: "Gilde", unit_info: "80g / 130g" },
    { product_name: "Appelsinjuice / Eplejuice", product_name_en: "Orange Juice / Apple Juice", chain: "Joker", category: "Beverages", discount_type: "fixed_price", final_price: 24.9, currency: "NOK", brand: "Sunniva / Tine", unit_info: "1L" },
    { product_name: "Yoghurt Vanilje", product_name_en: "Vanilla Yogurt", chain: "Joker", category: "Dairy", discount_type: "fixed_price", final_price: 29.9, currency: "NOK", brand: "Q-Meieriene", unit_info: "800g" },
    { product_name: "Brødmiks", product_name_en: "Bread Mix", chain: "Joker", category: "Bakery", discount_type: "fixed_price", final_price: 24.9, currency: "NOK", brand: "Regal", unit_info: "1kg" },
    { product_name: "Pepsi Max 0.5L", product_name_en: "Pepsi Max 0.5L", chain: "Joker", category: "Beverages", discount_type: "multi_buy", discount_value: "2 for 30 NOK", brand: "Pepsi", additional_cost: "pant" },
    { product_name: "Maarud Tortilla Chips Cheese", product_name_en: "Maarud Tortilla Chips Cheese", chain: "Joker", category: "Snacks", discount_type: "fixed_price", final_price: 29.9, currency: "NOK", brand: "Maarud", unit_info: "175g" },
    { product_name: "Cloetta Candy Selection", product_name_en: "Cloetta Candy Selection", chain: "Joker", category: "Snacks", discount_type: "percentage", discount_percent: 30, brand: "Cloetta", unit_info: "100-220g" },
    { product_name: "Berthas Gulrotkake / Sjokoladekake", product_name_en: "Berthas Carrot Cake / Chocolate Cake", chain: "Joker", category: "Bakery", discount_type: "fixed_price", final_price: 49.9, currency: "NOK", brand: "Berthas", unit_info: "360g" },
    { product_name: "Gilde Pålegg Skinke", product_name_en: "Gilde Ham Cold Cuts", chain: "Joker", category: "Meat", discount_type: "percentage", discount_percent: 30, brand: "Gilde", unit_info: "70g" },
    { product_name: "Maggi Nudler", product_name_en: "Maggi Noodles", chain: "Joker", category: "Pantry", discount_type: "percentage", discount_percent: 30, brand: "Maggi", unit_info: "64-75g" },
    { product_name: "Hennig-Olsen Småis", product_name_en: "Hennig-Olsen Ice Cream", chain: "Joker", category: "Snacks", discount_type: "percentage", discount_percent: 30, brand: "Hennig-Olsen", unit_info: "95-210ml" },
    { product_name: "Gilde Burger Original/Cheese", product_name_en: "Gilde Burger Original/Cheese", chain: "Joker", category: "Meat", discount_type: "percentage", discount_percent: 30, brand: "Gilde", unit_info: "800g" }
];

/** All offers combined */
export const allOffers: PromotionalOffer[] = [...batch1Offers, ...batch2Offers, ...batch3Offers, ...batch4Offers];

/**
 * Pre-compute searchable keywords for each offer.
 * Each entry maps keywords (lowercased, split) to an offer index.
 */
const offerKeywords = allOffers.map(offer => {
    const text = `${offer.product_name} ${offer.product_name_en} ${offer.category} ${offer.brand || ''}`.toLowerCase();
    return {
        id: offer.product_name,
        keywords: text.split(/\s+/).filter(k => k.length > 2)
    };
});

const QUERY_MAPPINGS: Record<string, string> = {
    'apple': 'epler', 'apples': 'epler', 'eple': 'epler',
    'banana': 'bananer', 'bananas': 'bananer', 'banan': 'bananer',
    'pear': 'pærer', 'pears': 'pærer', 'pære': 'pærer',
    'orange': 'appelsiner', 'oranges': 'appelsiner', 'appelsin': 'appelsiner',
    'grapes': 'druer', 'drue': 'druer',
    'lemon': 'sitron', 'lemons': 'sitroner',
    'lime': 'lime', 'limes': 'lime',
    'carrot': 'gulrøtter', 'carrots': 'gulrøtter', 'gulrot': 'gulrøtter',
    'potato': 'poteter', 'potatoes': 'poteter', 'potet': 'poteter',
    'tomato': 'tomater', 'tomatoes': 'tomater', 'tomat': 'tomater',
    'cucumber': 'agurk', 'cucumbers': 'agurk',
    'broccoli': 'brokkoli',
    'onion': 'løk', 'onions': 'løk',
    'garlic': 'hvitløk',
    'paprika': 'paprika', 'peppers': 'paprika',
    'bread': 'brød',
    'pasta': 'pasta',
    'rice': 'ris',
    'milk': 'melk',
    'cheese': 'ost',
    'butter': 'smør',
    'eggs': 'egg', 'egg': 'egg',
    'kneipp': 'kneippbrød',
    'chicken': 'kylling',
    'chicken fillet': 'kyllingfilet',
    'minced meat': 'kjøttdeig',
    'salmon': 'laks',
    'sausages': 'pølser',
    'bacon': 'bacon',
    'coffee': 'kaffe',
    'pizza': 'pizza',
    'soda': 'brus',
    'flour': 'hvetemel',
    'sugar': 'sukker',
    'salt': 'salt',
    'pepper': 'pepper',
    'oil': 'olje',
    'cream': 'fløte',
    'yogurt': 'yoghurt',
    'yeast': 'gjær',
};

/**
 * Ensures that a query word exists as a standalone word in the target text.
 */
function isStrictWordMatch(text: string, query: string): boolean {
    const normalizedText = text.toLowerCase();
    const normalizedQuery = query.toLowerCase();
    const mappedQuery = QUERY_MAPPINGS[normalizedQuery] || normalizedQuery;

    // Word boundary regex that accounts for Norwegian compound words (ends-with or starts-with)
    const strictRegex = new RegExp(`(\\b${normalizedQuery})|(${normalizedQuery}\\b)|(\\b${mappedQuery})|(${mappedQuery}\\b)`, 'i');
    return strictRegex.test(normalizedText);
}

/**
 * Find the best matching promotional offers for a given product name.
 */
export const findMatchingOffers = (itemName: string): PromotionalOffer[] => {
    const query = itemName.toLowerCase().trim();
    if (query.length < 2) return [];

    // Get mapped query (e.g., 'coffee' -> 'kaffe')
    const mappedQuery = QUERY_MAPPINGS[query] || null;

    const matches: { offer: PromotionalOffer; score: number }[] = [];

    for (const offer of allOffers) {
        const offerNameNo = offer.product_name.toLowerCase();
        const offerNameEn = (offer.product_name_en || '').toLowerCase();
        const brand = (offer.brand || '').toLowerCase();

        let score = 0;

        // --- STRICT PREFIX MATCH ---
        // The query (or its first N chars) must appear at the START of the offer product name.
        // This prevents "salt" from matching "BE-KIND bars (sea salt, caramel almond)"
        // but allows "salt" to match "Salt original" or "Salted butter".

        const prefixLen = Math.min(query.length, 12); // Use up to 12 chars for prefix check
        const queryPrefix = query.substring(0, prefixLen);
        const mappedPrefix = mappedQuery ? mappedQuery.substring(0, Math.min(mappedQuery.length, 12)) : null;

        const nameStartsWithQuery = offerNameNo.startsWith(queryPrefix) || offerNameEn.startsWith(queryPrefix);
        const nameStartsWithMapped = mappedPrefix && (offerNameNo.startsWith(mappedPrefix) || offerNameEn.startsWith(mappedPrefix));

        // Also check if the first word of the offer matches the query exactly
        const offerFirstWordNo = offerNameNo.split(/[\s,.(]/)[0];
        const offerFirstWordEn = offerNameEn.split(/[\s,.(]/)[0];
        const firstWordMatch =
            offerFirstWordNo === query ||
            offerFirstWordEn === query ||
            (mappedQuery && (offerFirstWordNo === mappedQuery || offerFirstWordEn === mappedQuery));

        if (nameStartsWithQuery || nameStartsWithMapped) {
            score += 30; // Strong prefix match
        } else if (firstWordMatch) {
            score += 25; // First word exact match
        }

        // Brand match bonus
        if (brand && (brand === query || brand.startsWith(queryPrefix) || (mappedQuery && brand === mappedQuery))) {
            score += 15;
        }

        // Only keep matches with a meaningful score
        if (score >= 25) {
            matches.push({ offer, score });
        }
    }

    if (matches.length === 0) return [];

    matches.sort((a, b) => b.score - a.score);

    return matches.map(m => m.offer);
};

/**
 * Get the display label for a discount.
 * e.g., "40% OFF", "30 kr", "3 for 2"
 */
export function getDiscountLabel(offer: PromotionalOffer): string {
    switch (offer.discount_type) {
        case 'percentage':
            return `${offer.discount_percent}% OFF`;
        case 'fixed_price':
            return `${offer.final_price} kr`;
        case 'multi_buy':
            return offer.discount_value || 'Multi-buy';
        default:
            return 'Deal';
    }
}
