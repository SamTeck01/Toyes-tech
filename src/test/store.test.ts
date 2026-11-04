import { describe, it, expect } from "vitest";
import { products } from "@/data/products";
import { searchProducts } from "@/lib/search";
import { normalisePhone } from "@/lib/phone";
import { deliveryQuote, FREE_DELIVERY_THRESHOLD } from "@/config/store";

const names = (q: string) => searchProducts(products, q).map((p) => p.name);

describe("search", () => {
  it("finds exact names first", () => {
    expect(names("iphone 15")[0]).toBe("iPhone 15 Pro Max");
  });
  it("forgives a typo", () => {
    expect(names("samsng")).toContain("Galaxy S24 Ultra");
  });
  it("understands everyday words", () => {
    expect(names("earbuds")).toContain("AirPods Pro (2nd Gen)");
    expect(names("charger").length).toBeGreaterThan(0);
  });
  it("returns nothing for nonsense", () => {
    expect(names("zzzqqq")).toHaveLength(0);
  });
});

describe("normalisePhone", () => {
  it("accepts local and international formats", () => {
    expect(normalisePhone("0803 123 4567")).toBe("+2348031234567");
    expect(normalisePhone("+234 803 123 4567")).toBe("+2348031234567");
  });
  it("rejects short or foreign numbers", () => {
    expect(normalisePhone("080312")).toBeNull();
    expect(normalisePhone("+44 7700 900123")).toBeNull();
  });
});

describe("deliveryQuote", () => {
  it("charges by zone and is free over the threshold", () => {
    expect(deliveryQuote("Lagos", 10000).fee).toBeGreaterThan(0);
    expect(deliveryQuote("Kano", FREE_DELIVERY_THRESHOLD).fee).toBe(0);
  });
});
