# News publishing bridge

Install on the **existing Tiverton Town Wix Editor site**, not as a Wix CLI app or a replacement website. `publisher-setup.html` provides copy buttons and installation steps. Keep existing `http-functions.js` exports when adding the snippet.

The frontend uses the existing Firebase sign-in. The backend sends only the caller's token to Google's accounts.lookup endpoint and compares the verified UID to the account already authorised by `auth.js`. CORS is restricted to `https://nickabull.github.io`. No private member lookup, Wix API key, extra npm package, new CMS collection, or third-party server is required.

The red confirmation makes two calls: `prepare` uploads the selected photo and creates an unpublished Wix draft; the client stores the returned draft ID before `publish`. Retrying publication uses that ID. A lost preparation response may leave an additional unpublished draft, but never triggers automatic publication of it. If preparation succeeds and localStorage fails, publishing stops. A successful publication with a lost response can be retried on the same draft ID. The backend checks existing published status before publishing.

News author ID comes from the already-public Portland preview. Rich content is restricted to paragraphs, bold, italic, underline and lists; arbitrary plugin nodes/URLs are rejected server-side. Photo credit becomes the first italic paragraph. Velo's `media.wixMedia.image` uses its uploaded `wix:image://` string.

The bridge has not been deployed to Wix or live-published a test article until the two backend files are installed and the authenticated end-to-end trial succeeds. Local checks use stubbed Wix services; they do not prove the production environment.

Official references:
- https://dev.wix.com/docs/develop-websites/articles/coding-with-velo/integrations/exposing-services/write-an-http-function
- https://dev.wix.com/docs/develop-websites/articles/coding-with-velo/integrations/exposing-services/site-api-calls
- https://dev.wix.com/docs/velo/apis/wix-blog-backend/draft-posts/create-draft-post
- https://dev.wix.com/docs/velo/apis/wix-blog-backend/draft-posts/get-draft-post
- https://dev.wix.com/docs/velo/apis/wix-blog-backend/draft-posts/publish-draft-post
- https://dev.wix.com/docs/velo/apis/wix-media-backend/media-manager/upload
- https://docs.cloud.google.com/identity-platform/docs/reference/rest/v1/accounts/lookup
