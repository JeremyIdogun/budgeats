import { describe, expect, it } from "vitest";
import { mapAsdaApifyItem } from "../asda/apify-mapper";
import { mapSainsburysApifyItem } from "../sainsburys/apify-mapper";
import { mapTescoApifyItem } from "../tesco/apify-mapper";

describe("tesco apify mapper", () => {
  it("maps clubcard data separately from base price", () => {
    const result = mapTescoApifyItem({
      id: "123",
      name: "Tesco Pasta 500g",
      price: 1.85,
      clubcardPrice: 1.5,
      url: "https://www.tesco.com/groceries/en-GB/products/123",
    });

    expect(result?.base_price_pence).toBe(185);
    expect(result?.loyalty_price_pence).toBe(150);
    expect(result?.loyalty_scheme).toBe("clubcard");
  });

  it("drops rows with missing or zero base price", () => {
    expect(mapTescoApifyItem({ name: "No Price" })).toBeNull();
    expect(mapTescoApifyItem({ name: "Zero", price: 0 })).toBeNull();
  });
});

describe("asda apify mapper", () => {
  it("maps wasPrice as base and current price as promo when discounted", () => {
    const result = mapAsdaApifyItem({
      id: "abc",
      name: "Asda Pasta 500g",
      price: 1.2,
      wasPrice: 1.5,
      url: "https://groceries.asda.com/product/abc",
    });

    expect(result?.base_price_pence).toBe(150);
    expect(result?.promo_price_pence).toBe(120);
    expect(result?.loyalty_price_pence).toBeNull();
  });

  it("keeps current price as base when no valid discount exists", () => {
    const result = mapAsdaApifyItem({
      id: "abc",
      name: "Asda Pasta 500g",
      price: "£1.20",
      wasPrice: "£1.10",
      url: "https://groceries.asda.com/product/abc",
    });

    expect(result?.base_price_pence).toBe(120);
    expect(result?.promo_price_pence).toBeNull();
  });
});

describe("sainsburys apify mapper", () => {
  it("maps nectar pricing separately", () => {
    const result = mapSainsburysApifyItem({
      id: "xyz",
      name: "Sainsbury's Pasta 500g",
      price: "£1.50",
      nectarPrice: "£1.25",
      url: "https://www.sainsburys.co.uk/gol-ui/product/xyz",
    });

    expect(result?.base_price_pence).toBe(150);
    expect(result?.loyalty_price_pence).toBe(125);
    expect(result?.loyalty_scheme).toBe("nectar");
  });
});
