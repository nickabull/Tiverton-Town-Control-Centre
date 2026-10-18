// Add to backend/http-functions.js. Preserve any functions already in that file.
import { publisherHealth, publisherPreflight, publisherPost } from 'backend/news-publisher';

export function get_newsPublisher(request) { return publisherHealth(request); }
export function post_newsPublisher(request) { return publisherPost(request); }
export function use_newsPublisher(request) { return publisherPreflight(request); }
