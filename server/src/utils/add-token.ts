import { Response } from "express";
import { JWT_SECRET } from "../secrets";
import jwt from "jsonwebtoken";

export interface UserObj {
	id: number;
	name: string;
	mail: string;
}

export const addTokenCookie = (res: Response, { id, name, mail }: UserObj) => {
	const token = jwt.sign({ id, name, mail }, JWT_SECRET);
	const expires = new Date();
	expires.setDate(expires.getDate() + 7);

	res.cookie("auth_token", token, {
		httpOnly: true,
		secure: process.env.DB_HOST !== "localhost",
		sameSite: "strict",
		expires
	});
};
