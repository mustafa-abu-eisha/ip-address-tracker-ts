export const onRequestGet = async ({
  request,
  env,
}: {
  request: Request;
  env: { IPIFY_KEY: string };
}) => {
  const incoming = new URL(request.url).searchParams;
  const upstream = new URL("https://geo.ipify.org/api/v2/country,city");
  upstream.searchParams.set("apiKey", env.IPIFY_KEY);

  const domain = incoming.get("domain");
  const ip =
    incoming.get("ipAddress") || request.headers.get("CF-Connecting-IP") || "";

  upstream.searchParams.set(domain ? "domain" : "ipAddress", domain ?? ip);

  return fetch(upstream);
};
