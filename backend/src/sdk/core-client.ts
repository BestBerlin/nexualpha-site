import type { paths } from "../generated/openapi.js";

export interface CoreClientOptions { baseUrl: string; fetch?: typeof globalThis.fetch; }
type JsonResponse<Path extends keyof paths, Method extends keyof paths[Path], Status extends number> = paths[Path][Method] extends { responses: infer Responses }
  ? Responses extends Record<Status, { content: { "application/json": infer Response } }> ? Response : never
  : never;
export type LiveResponse = JsonResponse<"/health/live", "get", 200>;
export type HomepageCompositionResponse = JsonResponse<"/v2/homepage", "get", 200>;
export type ReadyResponse = JsonResponse<"/health/ready", "get", 200>;
export type BootstrapResponse = JsonResponse<"/site/bootstrap", "get", 200>;
export type CryptoSentimentResponse = JsonResponse<"/market/crypto-sentiment", "get", 200>;
export type OpportunityListResponse = JsonResponse<"/opportunities", "get", 200>;
export type OpportunityResponse = JsonResponse<"/opportunities/{slug}", "get", 200>;
export type VenueListResponse = JsonResponse<"/venues", "get", 200>;
export type VenueResponse = JsonResponse<"/venues/{slug}", "get", 200>;
export type ListingFeedResponse = JsonResponse<"/listings", "get", 200>;
export type OfficialUpdateFeedResponse = JsonResponse<"/official-updates", "get", 200>;
export type AssetPulseResponse = JsonResponse<"/market/asset-pulse", "get", 200>;
export type ExchangeSnapshotsResponse = JsonResponse<"/market/exchange-snapshots", "get", 200>;
export type CommercialResolveResponse = JsonResponse<"/commercial/resolve", "post", 200>;
export type AttributionPreflightResponse = JsonResponse<"/attribution/preflight", "post", 202>;
export type AttributionPreflightRequest = paths["/attribution/preflight"]["post"] extends { requestBody: { content: { "application/json": infer Request } } } ? Request : never;
export class CoreClient {
  private readonly fetchImpl: typeof globalThis.fetch;
  constructor(private readonly options: CoreClientOptions) { this.fetchImpl = options.fetch ?? globalThis.fetch; }
  async live(): Promise<LiveResponse> { return this.get<LiveResponse>("/health/live"); }
  async homepage(locale: string, country?: string): Promise<HomepageCompositionResponse> {
    const query = new URLSearchParams({ locale });
    if (country) query.set("country", country);
    return this.get<HomepageCompositionResponse>(`/v2/homepage?${query}`);
  }
  async ready(): Promise<ReadyResponse> { return this.get<ReadyResponse>("/health/ready"); }
  async bootstrap(locale: string): Promise<BootstrapResponse> { return this.get<BootstrapResponse>(`/site/bootstrap?locale=${encodeURIComponent(locale)}`); }
  async cryptoSentiment(): Promise<CryptoSentimentResponse> { return this.get<CryptoSentimentResponse>("/market/crypto-sentiment"); }
  async opportunities(): Promise<OpportunityListResponse> { return this.get<OpportunityListResponse>("/opportunities"); }
  async opportunity(slug: string): Promise<OpportunityResponse> { return this.get<OpportunityResponse>(`/opportunities/${encodeURIComponent(slug)}`); }
  async venues(): Promise<VenueListResponse> { return this.get<VenueListResponse>("/venues"); }
  async venue(slug: string): Promise<VenueResponse> { return this.get<VenueResponse>(`/venues/${encodeURIComponent(slug)}`); }
  async listings(): Promise<ListingFeedResponse> { return this.get<ListingFeedResponse>("/listings"); }
  async officialUpdates(): Promise<OfficialUpdateFeedResponse> { return this.get<OfficialUpdateFeedResponse>("/official-updates"); }
  async assetPulse(): Promise<AssetPulseResponse> { return this.get<AssetPulseResponse>("/market/asset-pulse"); }
  async exchangeSnapshots(): Promise<ExchangeSnapshotsResponse> { return this.get<ExchangeSnapshotsResponse>("/market/exchange-snapshots"); }
  async resolveCommercial(opportunitySlug: string): Promise<CommercialResolveResponse> { return this.request<CommercialResolveResponse>("/commercial/resolve", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ opportunitySlug }) }); }
  async preflightAttribution(input: AttributionPreflightRequest): Promise<AttributionPreflightResponse> { return this.request<AttributionPreflightResponse>("/attribution/preflight", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) }); }
  private async get<T>(path: string): Promise<T> { return this.request<T>(path); }
  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await this.fetchImpl(new URL(path, this.options.baseUrl).toString(), init);
    if (!response.ok) throw new Error(`Shared Core request failed: ${response.status}`);
    return response.json() as Promise<T>;
  }
}
