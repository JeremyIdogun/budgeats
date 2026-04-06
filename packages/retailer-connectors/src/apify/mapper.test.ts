import assert from "node:assert/strict";
import { describe, it } from "node:test";
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

    assert.equal(result?.base_price_pence, 185);
    assert.equal(result?.loyalty_price_pence, 150);
    assert.equal(result?.loyalty_scheme, "clubcard");
  });

  it("drops rows with missing or zero base price", () => {
    assert.equal(mapTescoApifyItem({ name: "No Price" }), null);
    assert.equal(mapTescoApifyItem({ name: "Zero", price: 0 }), null);
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

    assert.equal(result?.base_price_pence, 150);
    assert.equal(result?.promo_price_pence, 120);
    assert.equal(result?.loyalty_price_pence, null);
  });

  it("keeps current price as base when no valid discount exists", () => {
    const result = mapAsdaApifyItem({
      id: "abc",
      name: "Asda Pasta 500g",
      price: "£1.20",
      wasPrice: "£1.10",
      url: "https://groceries.asda.com/product/abc",
    });

    assert.equal(result?.base_price_pence, 120);
    assert.equal(result?.promo_price_pence, null);
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

    assert.equal(result?.base_price_pence, 150);
    assert.equal(result?.loyalty_price_pence, 125);
    assert.equal(result?.loyalty_scheme, "nectar");
  });
});
