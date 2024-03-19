import * as functions from "@google-cloud/functions-framework";
import { doPost } from "./twitterToBluesky";

const accessToken = process.env.ACCESS_TOKEN;

export const twitterToBluesky = functions.http(
  "twitterToBluesky",
  async (req: functions.Request, res: functions.Response) => {
    // accessTokenが不正なら401を返す
    if (req.headers.authorization !== `Bearer ${accessToken}`) {
      const error = { status: 401, message: "Unauthorized" };
      console.error(error);
      res.status(401).json(error);
      return;
    }

    try {
      const resp = await doPost(req.body);
      res.json(resp);
    } catch (error: any) {
      const resp = { status: 500, message: `Unknown error: ${error}` };
      console.error(resp);
      res.status(500).json(resp);
    }
  }
);
