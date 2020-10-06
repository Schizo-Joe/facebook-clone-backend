const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { signupSchema, loginSchema } = require("../../util/validation");

// Model imports
const MiniUsers = require("../../model/MiniUser");
const Albums = require("../../model/Album");
const Users = require("../../model/Users.js");

module.exports = {
  signup: async (req, res) => {
    // Data validation
    const { error } = signupSchema.validate(req.body);
    if (error) {
      return res.status(400).send(error);
    }
    const userExists = await Users.findOne({ email: req.body.email });
    if (userExists) return res.send("email already exists");
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    try {
      const user = new Users({
        displayName: req.body.displayName,
        email: req.body.email,
        password: hashedPassword,
        gender: req.body.gender,
        DOB: req.body.DOB,
      });
      // console.log(user);
      const savedUser = await user.save();
      const miniUser = new MiniUsers({
        userId: savedUser._id,
        displayName: savedUser.displayName,
        profilePicture: savedUser.profilePicture,
      });
      const savedMiniUser = await miniUser.save();
      const albumsArray = [
        "Profile Pictures",
        "Cover Photos",
        "Mobile Uploads",
      ];
      albumsArray.forEach((album) => {
        let newAlbum = {
          userId: savedUser._id,
          miniUserId: savedMiniUser._id,
          albumName: album,
        };
        Albums.create(newAlbum, (err, data) => {
          if (err) {
            console.log(err);
          } else {
            Users.findById(savedUser._id)
              .then((user) => {
                user.albums.push({
                  albumId: data._id,
                  albumName: data.albumName,
                });
                return user.save();
              })
              .then((result) => console.log(result))
              .catch((e) => console.log(e));
          }
        });
      });
      return res.status(201).json({ id: savedUser._id });
    } catch {
      (err) => {
        res.status(400).send(err);
      };
    }
  },
  login: async (req, res) => {
    const { error } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).send(error);
    }
    const selectedUser = await Users.findOne({ email: req.body.email });
    if (!selectedUser) return res.send("user not found");
    const isPasswordValid = await bcrypt.compare(
      req.body.password,
      selectedUser.password
    );
    //   Create and assign token
    if (!isPasswordValid)
      return res.status(400).json({ message: "Incorrect password" });
    const token = jwt.sign(
      { id: selectedUser._id },
      process.env.ACCESS_TOKEN_SECRET
    );
    res.header("auth-token", token);
    res.status(201).json({
      token: token,
      email: selectedUser.email,
      displayName: selectedUser.displayName,
      profilePicture: selectedUser.profilePicture,
      friends: selectedUser.friends,
    });
  },
};