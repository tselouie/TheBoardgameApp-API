const User = require("../../models/user");
const Event = require("../../models/event");
const app = require("../../app");
const chai = require("chai");
const chaiHttp = require("chai-http");
const { expect } = require("chai");
const { it } = require("mocha");
const { token } = require("morgan");
const should = chai.should();

let regUserToken;
let regUser;
let regUser2Token;
let regUser2;
let notLoginUser2;
let event;
describe("Event Controller", () => {
  before((done) => {
    regUser = new User({
      email: "regUserJane@test.com",
      name: "tom doe",
      password: "Password1",
    });
    regUser.save();
    regUser2 = new User({
      email: "regUserJim@test.com",
      name: "jim smith",
      password: "Password1",
    });
    regUser2.save();
    notLoginUser2 = new User({
      email: "notLoginUser2@test.com",
      name: "john smith",
      password: "Password1",
    });
    notLoginUser2.save();
    event = new Event({
      title: "new event",
      startDate: new Date(),
      owner: regUser._id,
    });
    event.save();
    setTimeout(function () {
      done();
    }, 500);
  });
  beforeEach((done) => {
    chai
      .request(app)
      .post("/api/signin")
      .send({
        email: "regUserJane@test.com",
        password: "Password1",
      })
      .end((err, res) => {
        expect(res).to.have.nested.property("body.token");
        regUserToken = res.body.token;
        chai
          .request(app)
          .post("/api/signin")
          .send({
            email: "regUserJim@test.com",
            password: "Password1",
          })
          .end((err, res) => {
            expect(res).to.have.nested.property("body.token");
            regUser2Token = res.body.token;
            done();
          });
      });
  });

  after((done) => {
    User.collection.drop();
    Event.collection.drop();
    done();
  });
  describe("Get event by eventId", () => {
    it("should show 401 if user not logged in", (done) => {
      chai
        .request(app)
        .get(`/api/event/${event._id}`)
        .end((err, res) => {
          expect(res).to.have.nested.property(
            "text",
            '{"error":"Unauthorized Access!"}'
          );
          expect(res).to.have.status(401);
          done();
        });
    });
    it("should show 400 if event doesnt exist", (done) => {
      chai
        .request(app)
        .get(`/api/event/12`)
        .set("Authorization", `Bearer ${regUserToken}`)
        .end((err, res) => {
          expect(res).to.have.status(400);
          done();
        });
    });
    it("should show 200 w/ event info if user logged in", (done) => {
      chai
        .request(app)
        .get(`/api/event/${event._id}`)
        .set("Authorization", `Bearer ${regUserToken}`)
        .end((err, res) => {
          expect(res).to.have.nested.property("body.title", "new event");
          expect(res).to.have.status(200);
          done();
        });
    });
  });
  describe("Get events by userId", () => {
    it("should show 401 if user not logged in", (done) => {
      chai
        .request(app)
        .get(`/api/events/by/${notLoginUser2._id}`)
        .end((err, res) => {
          expect(res).to.have.nested.property(
            "text",
            '{"error":"Unauthorized Access!"}'
          );
          expect(res).to.have.status(401);
          done();
        });
    });
    it("should show 400 if user not found", (done) => {
      chai
        .request(app)
        .get(`/api/events/by/123`)
        .end((err, res) => {
          expect(res).to.have.nested.property(
            "text",
            '{"error":"User not found"}'
          );
          expect(res).to.have.status(400);
          done();
        });
    });
    it("should show 200 w/ empty array", (done) => {
      chai
        .request(app)
        .get(`/api/events/by/${regUser2._id}`)
        .set("Authorization", `Bearer ${regUser2Token}`)
        .end((err, res) => {
          expect(res.body).to.be.an("array").that.is.empty;
          expect(res).to.have.status(200);
          done();
        });
    });
    it("should show 200 w/ array length 1", (done) => {
      let event2 = new Event({
        title: "new event",
        startDate: new Date(),
        owner: regUser._id,
      });
      event2.save();
      chai
        .request(app)
        .get(`/api/events/by/${regUser._id}`)
        .set("Authorization", `Bearer ${regUserToken}`)
        .end((err, res) => {
          expect(res.body).to.have.lengthOf(2);
          expect(res).to.have.status(200);
          done();
        });
    });
  });
  describe("Create new event", () => {
    it("should show 401 if user not logged in", (done) => {
      chai
        .request(app)
        .post(`/api/event/new/${notLoginUser2._id}`)
        .send({
          title: "new event2",
          startDate: new Date(),
          owner: notLoginUser2._id,
        })
        .end((err, res) => {
          expect(res).to.have.nested.property(
            "text",
            '{"error":"Unauthorized Access!"}'
          );
          expect(res).to.have.status(401);
          done();
        });
    });

    it("should show 200 when created by auth user", (done) => {
      chai
        .request(app)
        .post(`/api/event/new/${regUser._id}`)
        .set("Authorization", `Bearer ${regUserToken}`)
        .send({
          title: "new event2",
          startDate: new Date(),
        })
        .end((err, res) => {
          expect(res).to.have.nested.property("body.title", "new event2");
          expect(res).to.have.status(200);
          done();
        });
    });
  });
  describe("Update event", () => {
    it("should show 401 if user not logged in", (done) => {
      chai
        .request(app)
        .put(`/api/event/${event._id}`)
        .send({
          title: "update event",
          startDate: new Date(),
        })
        .end((err, res) => {
          expect(res).to.have.nested.property(
            "text",
            '{"error":"Unauthorized Access!"}'
          );
          expect(res).to.have.status(401);
          done();
        });
    });
    it("should show 403 if update by non admin/owner", (done) => {
      chai
        .request(app)
        .put(`/api/event/${event._id}`)
        .set("Authorization", `Bearer ${regUser2Token}`)
        .send({
          title: "update event",
          startDate: new Date(),
        })
        .end((err, res) => {
          expect(res).to.have.nested.property(
            "text",
            '{"error":"User is not authorized to perform this action"}'
          );
          expect(res).to.have.status(403);
          done();
        });
    });
    it("should show 200 if updated by owner", (done) => {
      chai
        .request(app)
        .put(`/api/event/${event._id}`)
        .set("Authorization", `Bearer ${regUserToken}`)
        .send({
          title: "update event",
          startDate: new Date(),
        })
        .end((err, res) => {
          expect(res).to.have.nested.property("body.title", "update event");
          expect(res).to.have.status(200);
          done();
        });
    });
  });
});
