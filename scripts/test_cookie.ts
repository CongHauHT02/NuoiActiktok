import { PrismaClient } from "@prisma/client";
import { parseTikTokCookies } from "../src/lib/browserWorker";

const prisma = new PrismaClient();

const sampleCookie = `perf_feed_cache\t{%22expireTimestamp%22:1794290400000%2C%22itemIds%22:[%227694998172497710357%22%2C%227703461937140501768%22]}\t.www.tiktok.com\t/\t2026-11-10T06:42:46.000Z\t124\t\t✓\t\t\t\tMedium\t
s_v_web_id\tverify_mw0at66y_SZDMhHep_iGl7_492L_9zur_hYBXj3gH2AMs\t.tiktok.com\t/\tSession\t62\t\t✓\tNone\t\t\tMedium\t
sessionid\tf89389a33bf4743c08605e957653e507\t.tiktok.com\t/\t2027-05-02T06:20:32.006Z\t41\t✓\t✓\t\t\t\tMedium\t
sessionid_ss\tf89389a33bf4743c08605e957653e507\t.tiktok.com\t/\t2027-05-02T06:20:32.006Z\t44\t✓\t✓\tNone\t\t\tMedium\t
sid_guard\tf89389a33bf4743c08605e957653e507%7C1793686831%7C15552000%7CSun%2C+02-May-2027+06%3A20%3A31+GMT\t.tiktok.com\t/\t2027-10-29T06:20:32.006Z\t103\t✓\t✓\t\t\t\tMedium\t
sid_tt\tf89389a33bf4743c08605e957653e507\t.tiktok.com\t/\t2027-05-02T06:20:32.006Z\t38\t✓\t✓\t\t\t\tMedium\t
sid_ucp_v1\t1.0.1-KDJjMDczYmFkYmY4ZTBlNzFmYzg3MzJhNDNkMzNiMTY4NDZhNTA2M2YKIQiCgJq0jo7UsFsQr_ql1wYYswsgDDDO96DXBjgIQApIBBADGgJteSIgZjg5Mzg5YTMzYmY0NzQzYzA4NjA1ZTk1NzY1M2U1MDcyTgogVn9MVopPDtR-XnQZKN3KptQvOgE1Lr0BJg5ag6bmSMoSIF1krg6wYT3r0fX9OLr029aLJHOGlrymqSaF2WJwsBJmGAEiBnRpa3Rvaw\t.tiktok.com\t/\t2027-05-02T06:20:32.006Z\t278\t✓\t✓\t\t\t\tMedium\t
ssid_ucp_v1\t1.0.1-KDJjMDczYmFkYmY4ZTBlNzFmYzg3MzJhNDNkMzNiMTY4NDZhNTA2M2YKIQiCgJq0jo7UsFsQr_ql1wYYswsgDDDO96DXBjgIQApIBBADGgJteSIgZjg5Mzg5YTMzYmY0NzQzYzA4NjA1ZTk1NzY1M2U1MDcyTgogVn9MVopPDtR-XnQZKN3KptQvOgE1Lr0BJg5ag6bmSMoSIF1krg6wYT3r0fX9OLr029aLJHOGlrymqSaF2WJwsBJmGAEiBnRpa3Rvaw\t.tiktok.com\t/\t2027-05-02T06:20:32.006Z\t279\t✓\t✓\tNone\t\t\tMedium\t
store-country-code\tvn\t.tiktok.com\t/\t2027-05-02T06:20:31.108Z\t20\t✓\t\t\t\t\tMedium\t
store-country-code-src\tuid\t.tiktok.com\t/\t2027-05-02T06:20:31.108Z\t25\t✓\t\t\t\t\tMedium\t
store-country-sign\tMEIEDKvBHIsMQT_bh_dCOAQgv0lZKnLQwoIPJw9OVzufon7ZK9-lURjXM_CUyg503YkEEMObS6jjC0dpdyqFuvicy3E\t.tiktok.com\t/\t2027-05-02T06:20:31.108Z\t109\t✓\t\t\t\t\tMedium\t
store-idc\talisg\t.tiktok.com\t/\t2027-05-02T06:20:31.108Z\t14\t✓\t\t\t\t\tMedium\t
tiktok_webapp_theme\tdark\t.www.tiktok.com\t/\t2027-08-30T06:43:32.000Z\t23\t\t✓\t\t\t\tMedium\t
tiktok_webapp_theme_source\tauto\t.www.tiktok.com\t/\t2027-08-30T06:43:32.000Z\t30\t\t✓\t\t\t\tMedium\t
tt_chain_token\t/rENjpV8teKH3nTnvAULOA==\t.tiktok.com\t/\t2027-05-02T06:43:32.711Z\t38\t✓\t✓\t\t\t\tMedium\t
tt_csrf_token\tf2iVNwWS-2OqEj89xXj6k2hID6eCbtRP9-rM\t.tiktok.com\t/\tSession\t49\t✓\t✓\tLax\t\t\tMedium\t`;

async function main() {
  const parsed = parseTikTokCookies(sampleCookie);
  console.log("Parsed cookies count:", parsed.length);
  console.log("Cookies summary:", parsed.map((c: any) => `${c.name}=${c.value.slice(0, 15)}... (${c.domain})`));

  // Update account @sarah_tech_101 with this cookie
  const updated = await prisma.tikTokAccount.update({
    where: { username: "sarah_tech_101" },
    data: {
      sessionCookies: JSON.stringify(parsed),
      status: "ACTIVE",
    },
  });
  console.log("Updated account @sarah_tech_101 with real session cookies! ID:", updated.id);
}

main().catch(console.error).finally(() => prisma.$disconnect());
