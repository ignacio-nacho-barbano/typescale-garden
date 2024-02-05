import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import indexRouter from "./routes";
import usersRouter from "./routes/users";

const app = express();
// add rate limiter
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/users", indexRouter);
app.use("/", usersRouter);

const port = process.env.PORT || 3000;

app.listen(port, () => {
	console.log(`[server]: Server is running at port ${port}`);
});
