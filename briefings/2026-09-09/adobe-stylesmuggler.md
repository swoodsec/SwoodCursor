# Adobe StyleSmuggler — Magento / Adobe Commerce zero-day RCE

**Source:** [The Hacker News](https://thehackernews.com/2026/09/adobe-patches-magento-zero-day.html) · Sep 8, 2026  
**CVE:** CVE-2026-75650 (CVSS 10.0) · Adobe APSB26-146

## Why it matters

Unauthenticated remote code execution against Magento Open Source / Adobe Commerce, actively exploited since **Sep 4**. CISA KEV deadline reported as **Sep 11** — treat e-commerce estates as emergency patching.

## Key details

- Codename **StyleSmuggler** (Sansec): abuses Magento template / dependency-injection handling
- Observed payload paths: Rust Linux backdoor C2 wait-loop; PHP dropper → webshell
- Trigger pattern involves poisoned template/log content plus “Payment Transaction Failed Reminder” email rendering
- Rapid opportunistic scanning: at least one managed Magento host compromised ~50 minutes after first public exploitation reports

## Defender action

Apply Adobe’s hotfix immediately for all Magento/Commerce lines through 2.4.9. Hunt for unexpected cron/processes, webshells, outbound C2, and anomalous template/email activity. If compromise is plausible, rebuild from clean artifacts and rotate secrets.