import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import cors from "cors";
import { MainRouter } from "./routes";
import { APP_PORT, CLIENT_ORIGIN, DB } from "./secrets";
import { loadErrorHandlers } from "./utils";
import { MongoClient, ServerApiVersion } from "mongodb";

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

const client = new MongoClient(
	`mongodb+srv://${DB.HOST}/?authSource=%24external&authMechanism=MONGODB-X509&retryWrites=true&w=majority`,
	{
		tlsCertificateKeyFile: DB.CERTIFICATE_FILE,
		serverApi: ServerApiVersion.v1
	}
);

async function run() {
	try {
		await client.connect();
		const database = client.db("testDB");
		const collection = database.collection("testCol");
		const docCount = await collection.countDocuments({});
		console.log(docCount);
		// perform actions using client
	} finally {
		// Ensures that the client will close when you finish/error
		await client.close();
	}
}
run().catch(console.dir);

app.use("/api/", MainRouter);

loadErrorHandlers(app);

app.listen(APP_PORT, () => {
	console.log(`[server]: Server is running at port ${APP_PORT}`);
});
