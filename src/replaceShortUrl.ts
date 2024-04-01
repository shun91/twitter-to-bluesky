/**
 * 短縮されたURLを元のURLに変換する
 */
async function replaceShortUrl(shortUrl: string) {
  try {
    // fetchリクエストを送信し、リダイレクトを手動で処理する
    const response = await fetch(shortUrl, { redirect: "manual" });

    if (response.status >= 300 && response.status < 400) {
      // リダイレクトレスポンスの場合、LocationヘッダーからURLを取得
      return response.headers.get("Location") ?? shortUrl;
    }

    // リダイレクトがない場合は、元のURLをそのまま返す
    return shortUrl;
  } catch (error) {
    // エラーで元のURLを取得できなかった場合は、短縮URLをそのまま返す
    console.warn(error);
    return shortUrl;
  }
}

/**
 * 与えられたテキスト内の短縮URLを元のURLに置換する
 */
export async function replaceShortUrlsInText(text: string) {
  // URLにマッチする正規表現パターン
  const linkRegex = /https?:\/\/\S*/g;
  // テキストからURLを抽出
  const urls = text.match(linkRegex) || [];

  // 各URLに対して非同期処理を行う
  for (const shortUrl of urls) {
    // 短縮URLを展開
    const expandedUrl = await replaceShortUrl(shortUrl);
    // テキスト内の短縮URLを元のURLに置換
    text = text.replace(shortUrl, expandedUrl);
  }

  return text;
}
