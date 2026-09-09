# Microsoft’s record Patch Tuesday (~974 CVEs, 2 zero-days)

**Source:** [The Register](https://www.theregister.com/security/2026/09/09/microsoft-breaks-patch-tuesday-record-with-974-cve-deluge/5295160) · Sep 9, 2026  
**Also useful:** [Tenable analysis](https://www.tenable.com/blog/microsofts-september-2026-patch-tuesday-addresses-964-cves-cve-2026-81963-cve-2026-85880) · [The Hacker News](https://thehackernews.com/2026/09/microsoft-patches-record-974-flaws.html)

## Why it matters

Largest Microsoft Patch Tuesday on record. Two local privilege-escalation bugs are already exploited in the wild and are on CISA KEV with a **Sep 22** federal fix deadline.

## Key details

- **CVE-2026-85880** — Windows ALPC EoP → SYSTEM (CVSS 7.8); credited to Volexity/Proofpoint
- **CVE-2026-81963** — Windows Update Stack EoP → SYSTEM (CVSS 7.8); first Update Stack zero-day exploited in the wild
- Hundreds of additional fixes across Windows, Office, SQL, Azure-adjacent surfaces; EoP and RCE dominate
- Adjacent urgency: Google Chrome **CVE-2026-85046** was patched Sep 3 with known in-the-wild exploit

## Defender action

Prioritize the two KEV zero-days, then Exchange (see companion note), DNS/DHCP/SMB wormables, and any internet-facing Windows roles. Expect volume-driven backlog — triage by exploitability, not CVE count.