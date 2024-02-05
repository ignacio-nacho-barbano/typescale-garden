import express from "express";
const router = express.Router();

/* GET users listing. */
export default router.get("/", function (req, res, next) {
	res.send("respond with a resource");
});
