const jwt = require("jsonwebtoken");
//const userKey = "a952f746-20c7-4d82-9eea-0896af4d27e5"; //input userkey
const userKey = "bb872cb0-c6da-4c32-b68d-15ff95679837"; //input userkey
const payload = {
  appId: "deepbrain.io", //input appId
  //appId: "apr-2024-test", //input appId
  platform: "web",
};

const options = {
  header: { typ: "JWT", alg: "HS256" },
  expiresIn: 60 * 5, // expire time: 5 mins
};

function generateJWT(req, res) {
  try {
    if (userKey.length <= 0 || payload.appId.length <= 0) {
      res.json({ error: 'Empty appId or userkey'});
    } else {
      const clientToken = jwt.sign(payload, userKey, options);
      res.json({ appId: payload.appId, token: clientToken });
    }
  } catch (e) {
    console.log("jwt generate err ", e.name, e.message);

    res.json({error: e.message})
  }
}

export default function handler(req, res) {
  if (req.method === "GET") return generateJWT(req, res);
}
