import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import logger from "morgan";
import path from "path";
import { MainRouter } from "./routes";
import { APP_PORT, CLIENT_ORIGIN } from "./secrets";
import { loadErrorHandlers } from "./utils";
import { rateLimiter } from "./middlewares/rateLimit";

const app = express();
// add rate limiter
// test and enable helmet
// app.use(helmet());
app.use(logger("dev"));

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(rateLimiter);

app.use("/api/", MainRouter);

loadErrorHandlers(app);

app.listen(APP_PORT, () => {
	console.log(`[server]: Server is running at port ${APP_PORT}`);
});
