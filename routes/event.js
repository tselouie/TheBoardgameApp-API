const express = require("express");

const { requireSignIn } = require("../controllers/auth");
const {
  findUserById,
  getEvent,
  findEventById,
  eventsByUser,
  createEvent,
  isOwner,
  updateEvent,
  deleteEvent,
} = require("../controllers/event");

const router = express.Router();
router.get("/event/:eventId", getEvent);
router.get("/events/by/:userId", requireSignIn, eventsByUser);

router.post("/event/new/:userId", requireSignIn, createEvent);
router.put("/event/:eventId", requireSignIn, isOwner, updateEvent);
router.delete("/event/:eventId", requireSignIn, isOwner, deleteEvent);

// check if user exist when any route uses :userId in para
router.param("userId", findUserById);
// check if event exist when any route uses :eventId in para
router.param("eventId", findEventById);
module.exports = router;
