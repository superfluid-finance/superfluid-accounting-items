require("mocha");
const proxyquire = require("proxyquire").noCallThru().noPreserveCache();

const chai = require("chai");
const sinon = require("sinon");

global.proxyquire = proxyquire;
global.sinon = sinon;
global.expect = chai.expect;

afterEach(async () => {
  sinon.reset();
});
