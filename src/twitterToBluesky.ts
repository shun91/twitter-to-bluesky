import { replaceShortUrlsInText } from "./replaceShortUrl";

const bskyEmail = process.env.BSKY_EMAIL;
const bskyAppPass = process.env.BSKY_APP_PASS;
const bskyHost = "bsky.social";

export async function doPost(data: any) {
  const loadedData = await createSession();
  const params = await createPostParams(loadedData, data);
  return postRecord(params);
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

async function createPostParams(loadedData: any, data: any) {
  const text = await replaceShortUrlsInText(data.tweet);
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
        text,
        createdAt: new Date().toISOString(),
        langs: ["ja", "en"],
        $type: "app.bsky.feed.post",
        facets: createLinkFacets(text),
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
