/**
 * The commodity catalogue behind /market-page.
 *
 * Two identifiers per entry, deliberately:
 *
 *   slug          Unique per catalogue entry. This is the URL identity —
 *                 /market-page/<slug> — so it must never repeat.
 *   commoditySlug The key the price/trend data is filed under in
 *                 marketIntelligenceService (and in the backend's
 *                 /api/market/* responses).
 *
 * They differ wherever we list several varieties of one traded commodity:
 * the three peppers all price off `pepper`, the three onions off `onion`,
 * and both birds off `poultry`. Before the split, all three peppers shared
 * the slug "pepper" and so could not have had pages of their own.
 */

import YellowMaizeImage from "../assets/images/yellow maize.jpg";
import WhiteMaizeImage from "../assets/images/white maize.png";
import YellowSoyaImage from "../assets/images/yellow soya.jpg";
import Yam from "../assets/images/yam.jpg";
import Tomato from "../assets/images/tomatoes.jpg";
import Rice from "../assets/images/rice.jpg";
import Pepper from "../assets/images/pepper.jpg";
import Pepper2 from "../assets/images/pepper2.jpg";
import Pepper3 from "../assets/images/pepper3.jpg";
import Onion from "../assets/images/onion.jpg";
import Onion2 from "../assets/images/onion2.png";
import Onion3 from "../assets/images/onion3.jpg";
import LiveChicken from "../assets/images/live chicken.jpg";
import DressedChicken from "../assets/images/dressed chicken.png";
import Beans from "../assets/images/beans.jpg";
import Plantain from "../assets/images/plantain.png";
import Cassava from "../assets/images/cassava.jpg";
import Sorghum from "../assets/images/sorghum.jpg";

export const commodities = [
  {
    id: 1,
    slug: "yellow-maize",
    commoditySlug: "yellow-maize",
    name: "Yellow Maize",
    category: "Maize",
    image: YellowMaizeImage,
    description: "Premium quality yellow maize",
    about:
      "Yellow maize is the main feed grain in Ghana, moving in 100kg bags from the transition and northern belts into poultry and livestock feed mills. Prices firm up ahead of the March-May planting window and ease once the major-season harvest lands.",
  },
  {
    id: 2,
    slug: "white-maize",
    commoditySlug: "white-maize",
    name: "White Maize",
    category: "Maize",
    image: WhiteMaizeImage,
    description: "High-grade white maize",
    about:
      "White maize is the food-grade grain behind banku, kenkey and corn dough. It trades at a premium to yellow maize when household demand is strong, and follows the same major-season harvest calendar.",
  },
  {
    id: 3,
    slug: "yellow-soybeans",
    commoditySlug: "soybeans",
    name: "Yellow Soybeans",
    category: "Soybeans",
    image: YellowSoyaImage,
    description: "Fresh yellow soybeans",
    about:
      "Soybeans are a rotation crop across the northern savannah, sold to oil crushers and feed processors. Demand is growing faster than local supply, which keeps a floor under the price even in harvest months.",
  },
  {
    id: 4,
    slug: "yam",
    commoditySlug: "yam",
    name: "Yam",
    category: "Yam",
    image: Yam,
    description: "Puna yam",
    about:
      "Puna yam is the export-grade tuber from the Bono and Northern yam belt. Prices climb through the lean months before the new-yam harvest, then fall sharply once fresh tubers reach the markets.",
  },
  {
    id: 5,
    slug: "tomatoes",
    commoditySlug: "tomatoes",
    name: "Tomatoes",
    category: "Tomatoes",
    image: Tomato,
    description: "Fresh tomatoes",
    about:
      "Tomatoes are the most volatile line on this market. Crates move fast and spoil faster, and the dry-season squeeze between January and March can lift the price of the same crate by half within weeks.",
  },
  {
    id: 6,
    slug: "rice",
    commoditySlug: "rice",
    name: "Rice",
    category: "Rice",
    image: Rice,
    description: "Jasmine rice",
    about:
      "Locally milled jasmine rice competes directly with imports, which caps how far the price can run. Demand lifts around December festivals and settles through the middle of the year.",
  },
  {
    id: 7,
    slug: "black-cobra-pepper",
    commoditySlug: "pepper",
    name: "Black Cobra Pepper",
    category: "Pepper",
    image: Pepper,
    description: "Black Cobra pepper",
    about:
      "A hot, thin-walled chilli grown for the fresh market and for drying. It prices off the general pepper market, which rises through the dry season as irrigated volumes thin out.",
  },
  {
    id: 8,
    slug: "anaheim-pepper",
    commoditySlug: "pepper",
    name: "Anaheim Pepper",
    category: "Pepper",
    image: Pepper2,
    description: "Anaheim pepper",
    about:
      "A mild, long-fruited chilli favoured by hotels and processors. It follows the same pepper price line, with buyers paying up for consistent grading rather than for heat.",
  },
  {
    id: 9,
    slug: "aleppo-pepper",
    commoditySlug: "pepper",
    name: "Aleppo Pepper",
    category: "Pepper",
    image: Pepper3,
    description: "Aleppo pepper",
    about:
      "Grown mainly for drying and milling into flake. Because most of the crop is dried rather than sold fresh, it holds value better than the fresh chillies through a glut.",
  },
  {
    id: 10,
    slug: "red-onion",
    commoditySlug: "onion",
    name: "Red Onion",
    category: "Onion",
    image: Onion,
    description: "Purple/Red onion",
    about:
      "The staple cooking onion, largely trucked in from the north and across the Sahel border. Prices are strongly seasonal and swing with the condition of imported stock.",
  },
  {
    id: 11,
    slug: "white-onion",
    commoditySlug: "onion",
    name: "White Onion",
    category: "Onion",
    image: Onion2,
    description: "White onion",
    about:
      "Milder than the red, and bought mostly by restaurants and processors. Thinner volumes mean the price moves with the wider onion market rather than setting its own.",
  },
  {
    id: 12,
    slug: "yellow-onion",
    commoditySlug: "onion",
    name: "Yellow Onion",
    category: "Onion",
    image: Onion3,
    description: "Yellow onions",
    about:
      "Stores better than the red or white varieties, which makes it the one worth holding when the market is oversupplied. It tracks the general onion price with a shallower trough.",
  },
  {
    id: 13,
    slug: "dressed-chicken",
    commoditySlug: "poultry",
    name: "Dressed Chicken",
    category: "Poultry",
    image: DressedChicken,
    description: "Dressed chicken meat",
    about:
      "Processed, chilled birds sold by weight to households, caterers and cold stores. Demand spikes hard in December and around Easter, and feed-grain costs set the floor under the price.",
  },
  {
    id: 14,
    slug: "live-chicken",
    commoditySlug: "poultry",
    name: "Live Chicken",
    category: "Poultry",
    image: LiveChicken,
    description: "Live broiler chicken",
    about:
      "Live broilers sold at the farm gate and in open markets. The price tracks dressed chicken but reacts faster, because birds still on feed cost money every day they go unsold.",
  },
  {
    id: 15,
    slug: "beans",
    commoditySlug: "beans",
    name: "Beans",
    category: "Beans",
    image: Beans,
    description: "Premium beans",
    about:
      "Cowpea sold dry in bags, so it stores well and the price rises steadily through the lean season. That storability makes it one of the easier crops to time deliberately.",
  },
  {
    id: 16,
    slug: "plantain",
    commoditySlug: "plantain",
    name: "Plantain",
    category: "Plantain",
    image: Plantain,
    description: "Fresh Apem plantain",
    about:
      "Apem plantain from the forest zone, sold by the bunch. It cannot be stored, so the price is set almost entirely by how much reached the market that week.",
  },
  {
    id: 17,
    slug: "cassava",
    commoditySlug: "cassava",
    name: "Cassava",
    category: "Cassava",
    image: Cassava,
    description: "Esi Abaaya cassava",
    about:
      "Fresh roots for household use and for processing into gari and dough. Because cassava can be left in the ground until it is needed, the price stays flatter than most fresh produce.",
  },
  {
    id: 18,
    slug: "sorghum",
    commoditySlug: "sorghum",
    name: "Sorghum",
    category: "Sorghum",
    image: Sorghum,
    description: "Premium Kapala sorghum",
    about:
      "Kapala sorghum from the north, bought by brewers and by feed millers. Demand is steadier than maize but thinner, so large lots take longer to move.",
  },
];

export const categories = [
  "All",
  "Maize",
  "Soybeans",
  "Onion",
  "Pepper",
  "Poultry",
  "Tomatoes",
  "Yam",
  "Rice",
  "Beans",
  "Cassava",
  "Plantain",
  "Sorghum",
];

/** The regions we publish market-centre pricing for. */
export const regions = ["Greater Accra", "Ashanti", "Northern", "Western"];

/** Look a catalogue entry up by its URL slug. Returns undefined when unknown. */
export function getCommodityBySlug(slug) {
  return commodities.find((item) => item.slug === slug);
}

/** Other entries sharing a category, excluding the one passed in. */
export function getRelatedCommodities(commodity, limit = 4) {
  if (!commodity) return [];
  return commodities
    .filter((item) => item.category === commodity.category && item.slug !== commodity.slug)
    .slice(0, limit);
}
