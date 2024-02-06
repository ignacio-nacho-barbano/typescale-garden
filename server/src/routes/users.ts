import express from "express";

const router = express.Router();

router.get("/user", (req, res, next) => {
	res.status(200).json({ user: "Hola Nacho" });
});
// router.get('/user', authentication.required, (req, res, next) => {

//     User
//       .findById(req.payload.id)
//       .then((user: IUserModel) => {
//           res.status(200).json({user: user.toAuthJSON()});
//         }
//       )
//       .catch(next);

//   }
// );

export const UsersRoutes = router;
