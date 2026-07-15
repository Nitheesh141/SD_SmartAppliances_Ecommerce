import { Category } from "../types";

export const categories: Category[] = [
  {
    id: "cat-1",
    name: "Pressure Cookers",
    description: "Traditional and smart pressure cookers crafted for faster cooking, superior safety, and everyday convenience.",
    image: "/Categories-1.png",
    href: "/shop?category=pressure-cookers",
    isActive: true
  },
  {
    id: "cat-2",
    name: "Non-Stick Cookware",
    description: "Premium non-stick cookware designed for healthier meals, effortless cooking, and easy cleaning.",
    image: "/Categories-2.png",
    href: "/shop?category=non-stick",
    isActive: true
  },
  {
    id: "cat-4",
    name: "LPG Stoves",
    description: "High-performance stainless steel and glass-top stoves engineered for efficiency, durability, and style.",
    image: "/Categories-4.png",
    href: "/shop?category=gas-stoves",
    isActive: true
  },
  {
    id: "cat-5",
    name: "Stainless Steel Wet Grinders",
    description: "Food-grade stainless steel grinders delivering smooth batter, consistent performance, and lasting reliability.",
    image: "/Categories-5.png",
    href: "/shop?category=wet-grinders",
    isActive: true
  },
  {
    id: "cat-6",
    name: "Commercial Wet Grinders",
    description: "Heavy-duty grinding solutions built for hotels, restaurants, catering units, and large-scale food production.",
    image: "/Categories-6.png",
    href: "/shop?category=commercial",
    isActive: true
  }
];
