import type { FmpPeer } from "@/lib/types";

const MIN_PEER_MARKET_CAP = 1_000_000_000;

export function listedPeers(peers: FmpPeer[], symbol: string, limit = 12) {
  const ticker = symbol.toUpperCase();
  return peers
    .filter((peer) => peer.symbol && peer.symbol.toUpperCase() !== ticker)
    .filter((peer) => (peer.mktCap ?? 0) >= MIN_PEER_MARKET_CAP)
    .slice(0, limit);
}

export function compareHref(symbols: string[]) {
  const unique = [...new Set(symbols.map((symbol) => symbol.toUpperCase()))].slice(0, 6);
  return `/compare?symbols=${unique.map((symbol) => encodeURIComponent(symbol)).join(",")}`;
}
