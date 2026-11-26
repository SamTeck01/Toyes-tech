import { parse } from "@/components/MoneyInput";

describe("price input parsing", () => {
  it("reads plain numbers with or without commas", () => {
    expect(parse("3500")).toBe(3500);
    expect(parse("1,550,000")).toBe(1550000);
    expect(parse("₦ 2,000")).toBe(2000);
  });
  it("supports k and m shortcuts", () => {
    expect(parse("5k")).toBe(5000);
    expect(parse("15K")).toBe(15000);
    expect(parse("2m")).toBe(2000000);
  });
  it("ignores junk and empty input", () => {
    expect(parse("")).toBe(0);
    expect(parse("abc")).toBe(0);
  });
});
