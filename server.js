const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
// const bodyParser = require("body-parser");

// Route imports
const authRoute = require("./routes/auth.js");

// Model imports
const Posts = require("./model/Posts.js");
const Users = require("./model/Users.js");
const Comments = require("./model/Comments.js");
const FriendRequests = require("./model/FriendRequests");
const { post } = require("./routes/auth.js");
const { request } = require("express");

// App config
const app = express();
PORT = process.env.PORT || 8000;
dotenv.config();
app.use(cors({ origin: "http://localhost:3000" }));
// DB config
mongoose.connect(
  "mongodb+srv://administrator:u9B8dWyYbVU2juGw@cluster0.u5egm.mongodb.net/fbCloneDB?retryWrites=true&w=majority",
  {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  () => console.log("Database connected")
);

// Middlewares
app.use(express.json());
// app.use(bodyParser.urlencoded({ extended: false }));

// API Routes
app.get("/", (req, res) => {
  res.status(200).send("hello world");
});

// app.get("/users", (req, res) => {
//   Users.find({}, (err, data) => {
//     if (err) {
//       res.status(500).send(err);
//     } else {
//       res.status(200).send(data);
//     }
//   });
// });

app.get("/posts", (req, res) => {
  Posts.find({}, (err, data) => {
    if (err) {
      res.status(500).json({ message: err.message });
    } else {
      res.status(200).send(data);
    }
  });
});

app.post("/post", (req, res) => {
  const post = req.body;
  Posts.create(post, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
    }
  });
});

// app.post("/signup", (req, res) => {
//   const user = req.body;
//   Users.create(user, (err, data) => {
//     if (err) {
//       res.status(500).send(err);
//     } else {
//       res.status(201).send(data);
//     }
//   });
// });

app.get("/users", (req, res) => {
  Users.find({}, (err, data) => {
    if (err) {
      res.status(500).json({ message: err.message });
    } else {
      res.status(200).send(data);
    }
  });
});

app.use("/auth", authRoute);

// // SignUp Route
// app.post("/signup", (req, res) => {
//   const email = req.body.email;
//   const password = req.body.password;
//   Users.create({ email: email, password: password }, (err, data) => {
//     if (err) {
//       res.status(500).send(err);
//     } else {
//       res.status(201).send(data);
//     }
//   });
// });

// Like post
app.post("/post/like", (req, res) => {
  const postId = req.body.postId;
  const action = req.body.like;
  const userId = req.body.userId;
  const displayName = req.body.displayName;
  Posts.findById(postId)
    .then(async (post) => {
      if (action) {
        post.likesCount = post.likesCount + 1;
        post.likes.push({
          userId: userId,
          displayName: displayName,
        });
        return post.save();
      } else {
        if (post.likesCount === 0) {
          res.status(400).send("cant dislike, already no like");
        } else {
          post.likesCount = post.likesCount - 1;
          post.likes.splice(
            post.likes.findIndex((like) => like.userId === userId),
            1
          );
          return post.save();
        }
      }
    })
    .then((result) => res.send(result))
    .catch((e) => res.status(400).json({ message: e.message }));
});

// Comment on a post
app.post("/post/comment", (req, res) => {
  const newComment = {
    postId: req.body.postId,
    userId: req.body.userId,
    displayName: req.body.displayName,
    content: req.body.content,
  };
  Comments.create(newComment, async (err, data) => {
    if (err) {
      console.log("Helooo");
      res.status(500).json({ message: err.message });
    } else {
      await Posts.findById(data.postId)
        .then((post) => {
          post.comments.push({
            commentId: data._id,
          });
          return post.save();
        })
        .then((result) =>
          res.status(201).json({
            message: "Comment added to post successfully",
          })
        )
        .catch((e) =>
          res.status(400).json({
            message: e.message,
          })
        );
    }
  });
});

// Load comments of a particular post
app.post("/post/comments", (req, res) => {
  const commentIds = req.body.commentIds;
  Comments.find({ _id: { $in: commentIds } }, (err, data) => {
    if (err) {
      res.status(400).json({ message: err.message });
    } else {
      res.status(200).send(data);
    }
  });
});

// Send friendRequest
app.put("/user/friendRequest", (req, res) => {
  const request = {
    senderId: req.body.userId,
    senderDisplayName: req.body.displayName,
    senderProfilePicture: req.body.profilePicture,
    recieverId: req.body.targetUserId,
    recieverDisplayName: req.body.targetDisplayName,
    recieverProfilePicture: req.body.targetProfilePicture,
  };
  // Adding request to FriendRequest collection
  FriendRequests.create(request, (err, data) => {
    if (err) {
      res.status(403).json({ message: "failed to send request" });
    } else {
      // Adding to friend request sent list of sending user
      Users.findById(req.body.userId)
        .then((user) => {
          user.friendRequestsSent.push({
            requestId: data._id,
          });
          return user.save();
        })
        .then(async (result) => {
          const targetUserData = await Users.findById(req.body.targetUserId);
          return {
            targetUser: targetUserData,
            result: result,
          };
        })
        .then(async ({ targetUser, result }) => {
          // console.log(targetUser);
          targetUser.friendRequestsRecieved.push({
            requestId: data._id,
          });
          savedTargetUser = await targetUser.save();
          return { savedTargetUser: savedTargetUser, result: result };
        })
        .then(({ savedTargetUser, result }) => {
          if (action) {
            res.status(201).send("Friend Request sent successfully");
          } else {
            res.status(201).send("friend request deleted successfully");
          }
        })
        .catch((e) => res.status(400).json({ m: e }));
    }
  });
});

// Accepting a friend request
app.post("/user/friendRequest", (req, res) => {
  const requestId = req.body.requestId;
  const action = req.body.action;
  let senderid,
    senderDisplayName,
    senderProfilePicture,
    recieverId,
    recieverDisplayName,
    recieverProfilePicture;
  FriendRequests.findById(requestId)
    .then(async (request) => {
      senderId = request.senderId;
      senderDisplayName = request.senderDisplayName;
      senderProfilePicture = request.senderProfilePicture;
      recieverId = request.recieverId;
      recieverDisplayName = request.recieverDisplayName;
      recieverProfilePicture = request.recieverProfilePicture;
      return request.remove();
    })
    .then((result) => {
      Users.findById(senderId)
        .then(async (user) => {
          user.friendRequestsSent.splice(
            user.friendRequestsSent.findIndex(
              (rqst) => rqst.requestid === requestId
            )
          );
          if (action) {
            user.friends.push({
              id: recieverId,
              displayName: recieverDisplayName,
              profilePicture: recieverProfilePicture,
            });
          }
          return user.save();
        })
        .then((result) => console.log(result))
        .catch((e) => console.log(e));
      Users.findById(recieverId)
        .then(async (user) => {
          user.friendRequestsRecieved.splice(
            user.friendRequestsSent.findIndex(
              (rqst) => rqst.requestid === requestId
            )
          );
          if (action) {
            user.friends.push({
              id: senderId,
              displayName: senderDisplayName,
              profilePicture: senderProfilePicture,
            });
          }
          return user.save();
        })
        .then((result) => console.log(result))
        .catch((e) => console.log(e));
      return result;
    })
    .then((result) => res.status(201).send("Accepted friendRequest"))
    .catch((e) => res.status(403).send(e));
});

// Server listener
app.listen(PORT, () => console.log("server started at " + PORT));
