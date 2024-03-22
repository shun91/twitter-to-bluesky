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
        text: data.tweet,
        createdAt: new Date().toISOString(),
        langs: ["ja", "en"],
        $type: "app.bsky.feed.post",
        facets: createLinkFacets(data.tweet),
      },
    }),
  };
}

async function postRecord(params: any) {
  const url = getEndpoint("/com.atproto.repo.createRecord");
  const resp = await fetch(url, params);
  return resp.json();
}

function createLinkFacets(text: string) {
  const linkRegex = /https?:\/\/\S*/g;
  let match;
  const facets = [];

  while ((match = linkRegex.exec(text)) !== null) {
    const url = match[0];
    const byteStart = getBytePosition(text, match.index);
    const byteEnd = byteStart + getByteLength(url);

    const facet = {
      index: {
        byteStart,
        byteEnd,
      },
      features: [
        {
          $type: "app.bsky.richtext.facet#link",
          uri: url,
        },
      ],
    };

    facets.push(facet);
  }

  return facets;
}

function getByteLength(str: string): number {
  return new Blob([str]).size;
}

function getBytePosition(text: string, position: number): number {
  const substring = text.substring(0, position);
  return getByteLength(substring);
}
