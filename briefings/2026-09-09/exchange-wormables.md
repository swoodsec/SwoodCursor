# Exchange Visio RCE + wormable Windows bugs in September Patch Tuesday

**Source:** [Security Affairs](https://securityaffairs.com/198705/security/microsofts-biggest-patch-tuesday-974-cves-2-zero-days-and-20-wormable-bugs.html) · Sep 9, 2026

## Why it matters

Beyond the two exploited Windows EoPs, researchers flag an Exchange RCE and an unusually large set of **wormable** (remote, no-user-interaction) RCEs as the practical prioritization problem inside the 900+ CVE flood.

## Key details

- **CVE-2026-55007** — unauthenticated Exchange RCE via malicious Visio attachment processed during content indexing; no user click required (reliability may depend on low-memory conditions)
- ~**20 wormable** fixes spanning DHCP, AD, DNS, SMB client, Netlogon, NFS, RRAS, MSMQ, and related services
- **CVE-2026-69730** — Windows DNS Server UAF RCE, CVSS 9.8; described as a “SigRed spiritual successor”
- Microsoft also shipped large non–Patch Tuesday fixes earlier in September across Azure / Entra / Edge

## Defender action

Patch Exchange and DNS/AD/DHCP-facing Windows Server roles first after the KEV zero-days. Validate mail-flow attachment processing and content indexing exposure; monitor for anomalous DNS/SMB/Netlogon traffic post-patch window.