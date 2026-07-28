import express from "express";
import {
	deletePluginConnection,
	getPluginConnections,
	getPluginTypescales,
	postPairingCode,
	postPluginToken
} from "../controllers/plugin";
import { checkUser } from "../middlewares/auth";
import { checkPluginToken } from "../middlewares/plugin-auth";

const router = express.Router();

// Two different credentials live on this router, which is the whole point of keeping
// them adjacent and visible:
//
//   checkUser        — Auth0 access token, from the web app. Mints and revokes.
//   checkPluginToken — the plugin's own opaque token. Reads, and only reads.
//   (neither)        — POST /tokens, where the pairing code itself is the credential.

// Issued by the web app for the signed-in user to read out.
router.post("/pairing-codes", checkUser, postPairingCode);

// Redeemed by the plugin. Intentionally unauthenticated — see the controller for what
// bounds it and why platform-level rate limiting is required here.
router.post("/tokens", postPluginToken);

// Managed from the web app.
router.get("/connections", checkUser, getPluginConnections);
router.delete("/connections/:connectionId", checkUser, deletePluginConnection);

// The only thing a plugin token can reach. Keep this router read-only: writes must
// stay behind checkUser.
router.get("/typescales", checkPluginToken, getPluginTypescales);

export const PluginRouter = router;
