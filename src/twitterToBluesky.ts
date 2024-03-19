const bskyEmail = process.env.BSKY_EMAIL;
const bskyAppPass = process.env.BSKY_APP_PASS;
const bskyHost = "bsky.social";

export async function doPost(data: any) {
  const loadedData = await createSession();
  const params = createPostParams(loadedData, data);
  return postRecord(params);
}

function removeURL(str: string) {
  return str.replace(/(https?:\/\/[^\s]+)/g, "");
}

function truncateString(str: string) {
  if (str.length > 75) {
    return str.substring(0, 75) + "...";
  }
  return str;
}

function getEndpoint(path: string) {
  const baseUrl = `https://${bskyHost}`;
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  return `${baseUrl}/xrpc${path}`;
}

async function createSession() {
  const url = getEndpoint("/com.atproto.server.createSession");
  const payload = {
    identifier: bskyEmail,
    password: bskyAppPass,
  };

  const response = await fetch(url, {
    method: "post",
    headers: { "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify(payload),
  });
  return response.json();
}

function createPostParams(loadedData: any, data: any) {
  const originalTweet = data.tweet;
  const rmUrlTweet = removeURL(originalTweet);
  const userName = data.userName;
  const uri = data.uri;
  const embed = {
    $type: "app.bsky.embed.external",
    external: {
      uri: uri,
      title: `Tweet by @${userName}`,
      description: truncateString(rmUrlTweet),
    },
  };
  return {
    method: "post",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      Authorization: `Bearer ${loadedData.accessJwt}`,
    },
    body: JSON.stringify({
      repo: loadedData.did,
      collection: "app.bsky.feed.post",
      record: {
        text: originalTweet,
        createdAt: new Date().toISOString(),
        langs: ["ja", "en"],
        $type: "app.bsky.feed.post",
        // embed: embed
      },
    }),
  };
}

async function postRecord(params: any) {
  const url = getEndpoint("/com.atproto.repo.createRecord");
  const resp = await fetch(url, params);
  return resp.json();
}
