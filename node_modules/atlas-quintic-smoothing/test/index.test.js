const { describe, it } = require("mocha")
const { expect } = require("chai")
const smooth = require("../src/index");

describe("quintic smoothing function", function(){
  it("should be 0 at x = 0", function(){
    expect(smooth(0)).to.equal(0)
  })
  it("should be 1/2 at x = 1/2", function(){
    expect(smooth(1/2)).to.equal(1/2)
  })
  it("should be 1 at x = 1", function(){
    expect(smooth(1)).to.equal(1)
  })
  it("should be 27/8 at x = 3/2", function(){
    expect(smooth(3/2)).to.equal(27/8)
  })
  it("should be 32 at x = 2", function(){
    expect(smooth(2)).to.equal(32)
  })
  it("should be 5^4/4 at x = 5/2", function(){
    expect(smooth(5/2)).to.equal(Math.pow(5,4)/4)
  })
})
